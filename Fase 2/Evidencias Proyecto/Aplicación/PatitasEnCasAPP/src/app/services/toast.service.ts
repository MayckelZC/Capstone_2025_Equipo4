import { Injectable } from '@angular/core';
import { ToastController, AlertController, Platform } from '@ionic/angular';

interface ToastOptions {
  message: string;
  color?: 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'danger' | 'light' | 'medium' | 'dark' | 'info';
  icon?: string;
  duration?: number;
  position?: 'top' | 'bottom' | 'middle';
  size?: 'mini' | 'normal' | 'large';
  sticky?: boolean;
  showProgress?: boolean;
  buttons?: any[];
  cssClass?: string[];
  haptic?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private activeToasts: any[] = [];
  private toastQueue: ToastOptions[] = [];
  private maxConcurrentToasts = 3;
  private lastToastMessage = '';
  private lastToastTime = 0;
  private debounceTime = 1000; // ms

  constructor(
    private toastController: ToastController,
    private alertController: AlertController,
    private platform: Platform
  ) { }

  async presentToast(
    message: string,
    color: 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'danger' | 'light' | 'medium' | 'dark' | 'info' = 'primary',
    icon?: string,
    duration: number = 3000,
    customCssClass?: string
  ) {
    // Debouncing - evitar duplicados
    const now = Date.now();
    if (message === this.lastToastMessage && (now - this.lastToastTime) < this.debounceTime) {
      return;
    }
    this.lastToastMessage = message;
    this.lastToastTime = now;

    const options: ToastOptions = {
      message,
      color,
      icon,
      duration,
      cssClass: customCssClass ? [customCssClass] : undefined
    };

    await this.showToast(options);
  }

  async showToast(options: ToastOptions) {
    // Control de cola
    if (this.activeToasts.length >= this.maxConcurrentToasts) {
      this.toastQueue.push(options);
      return;
    }

    const cssClasses = ['custom-toast'];
    
    // Agregar clase según el color
    if (options.color) {
      cssClasses.push(`toast-${options.color}`);
    }
    
    // Agregar clase según el tamaño
    if (options.size) {
      cssClasses.push(`toast-${options.size}`);
    }
    
    // Toast sticky
    if (options.sticky) {
      cssClasses.push('toast-sticky');
    }
    
    // Toast con progreso
    if (options.showProgress && !options.sticky) {
      cssClasses.push('toast-progress');
    }
    
    // Toast con acción
    if (options.buttons && options.buttons.length > 0) {
      cssClasses.push('toast-with-action');
    }
    
    // Clases personalizadas
    if (options.cssClass) {
      cssClasses.push(...options.cssClass);
    }

    // Calcular duración basada en longitud del mensaje
    let calculatedDuration = options.duration || 3000;
    if (!options.sticky && !options.duration) {
      const wordCount = options.message.split(' ').length;
      calculatedDuration = Math.max(3000, Math.min(wordCount * 400, 8000));
    }

    // Configuración del toast
    const toastConfig: any = {
      message: options.message,
      duration: options.sticky ? 0 : calculatedDuration,
      position: options.position || 'top',
      cssClass: cssClasses,
      buttons: options.buttons || [
        {
          icon: 'close',
          role: 'cancel',
          handler: () => {
            this.dismissToast(toast);
          }
        }
      ]
    };

    // Agregar icono si existe
    if (options.icon) {
      toastConfig.icon = options.icon;
    }

    // Agregar color
    if (options.color) {
      toastConfig.color = options.color === 'info' ? 'primary' : options.color;
    }

    const toast = await this.toastController.create(toastConfig);
    
    // Guardar referencia
    this.activeToasts.push(toast);

    // Haptic feedback en móviles
    if (options.haptic && this.platform.is('capacitor')) {
      try {
        if (options.color === 'success') {
          // Vibración suave para success
          if ('vibrate' in navigator) {
            navigator.vibrate(50);
          }
        } else if (options.color === 'danger') {
          // Vibración más fuerte para danger
          if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]);
          }
        }
      } catch (error) {
        console.log('Haptic feedback not available');
      }
    }

    // Auto-cleanup cuando se dismissea
    toast.onDidDismiss().then(() => {
      this.activeToasts = this.activeToasts.filter(t => t !== toast);
      this.processQueue();
    });

    await toast.present();
  }

  // Toast de éxito (turquesa en lugar de verde)
  async success(message: string, duration?: number, buttons?: any[]) {
    await this.showToast({
      message,
      color: 'success',
      icon: 'checkmark-circle',
      duration: duration || 3000,
      showProgress: true,
      haptic: true,
      buttons
    });
  }

  // Toast de advertencia
  async warning(message: string, duration?: number, buttons?: any[]) {
    await this.showToast({
      message,
      color: 'warning',
      icon: 'warning',
      duration: duration || 4000,
      showProgress: true,
      haptic: true,
      buttons
    });
  }

  // Toast de error
  async error(message: string, duration?: number, buttons?: any[]) {
    await this.showToast({
      message,
      color: 'danger',
      icon: 'alert-circle',
      duration: duration || 5000,
      showProgress: true,
      haptic: true,
      buttons
    });
  }

  // Toast informativo
  async info(message: string, duration?: number, buttons?: any[]) {
    await this.showToast({
      message,
      color: 'info',
      icon: 'information-circle',
      duration: duration || 3000,
      showProgress: true,
      buttons
    });
  }

  // Toast sticky (requiere acción del usuario)
  async sticky(message: string, color: any = 'primary', icon?: string, buttons?: any[]) {
    await this.showToast({
      message,
      color,
      icon: icon || 'alert-circle',
      sticky: true,
      buttons: buttons || [
        {
          text: 'Entendido',
          role: 'cancel'
        }
      ]
    });
  }

  // Toast con acción deshacer
  async withUndo(message: string, undoCallback: () => void, duration: number = 5000) {
    await this.showToast({
      message,
      color: 'warning',
      icon: 'alert-circle',
      duration,
      showProgress: true,
      buttons: [
        {
          text: 'Deshacer',
          handler: () => {
            undoCallback();
          }
        },
        {
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
  }

  // Toast mini (para notificaciones menores)
  async mini(message: string, icon?: string) {
    await this.showToast({
      message,
      color: 'medium',
      icon: icon || 'information-circle',
      duration: 2000,
      size: 'mini'
    });
  }

  // Toast grande (para mensajes importantes)
  async large(message: string, color: any = 'primary', icon?: string) {
    await this.showToast({
      message,
      color,
      icon: icon || 'megaphone',
      duration: 5000,
      size: 'large',
      showProgress: true
    });
  }

  // Dismissar toast específico
  private async dismissToast(toast: any) {
    if (toast) {
      await toast.dismiss();
    }
  }

  // Dismissar todos los toasts
  async dismissAll() {
    const promises = this.activeToasts.map(toast => toast.dismiss());
    await Promise.all(promises);
    this.activeToasts = [];
    this.toastQueue = [];
  }

  // Procesar cola de toasts
  private async processQueue() {
    if (this.toastQueue.length > 0 && this.activeToasts.length < this.maxConcurrentToasts) {
      const nextToast = this.toastQueue.shift();
      if (nextToast) {
        await this.showToast(nextToast);
      }
    }
  }

  async showAlert(options: {
    header: string;
    message: string;
    buttons: any[];
  }) {
    return this.alertController.create(options);
  }
}
