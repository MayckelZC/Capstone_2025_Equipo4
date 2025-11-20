import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { Observable, throwError, timer } from 'rxjs';
import { retry, catchError, retryWhen, mergeMap, finalize } from 'rxjs/operators';
import { ERROR_MESSAGES, RETRY_CONSTANTS, TIME_CONSTANTS } from '../constants/veterinarian.constants';

export interface ErrorState {
  hasError: boolean;
  message: string;
  code?: string;
  timestamp: Date;
  retryCount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  private errorState: ErrorState | null = null;

  constructor(private toastController: ToastController) {}

  /**
   * Maneja errores con reintentos automáticos y feedback al usuario
   */
  handleError<T>(
    error: any,
    showToast: boolean = true,
    customMessage?: string
  ): Observable<never> {
    const errorMessage = this.getErrorMessage(error, customMessage);
    
    this.errorState = {
      hasError: true,
      message: errorMessage,
      code: error?.code || 'UNKNOWN_ERROR',
      timestamp: new Date(),
      retryCount: error?.retryCount || 0
    };

    console.error('Error handled by ErrorHandlerService:', {
      error,
      errorState: this.errorState
    });

    if (showToast) {
      this.showErrorToast(errorMessage);
    }

    return throwError(() => error);
  }

  /**
   * Operador de reintento con backoff exponencial
   */
  retryWithBackoff<T>(maxRetries: number = RETRY_CONSTANTS.MAX_RETRY_ATTEMPTS) {
    return (source: Observable<T>) => source.pipe(
      retryWhen(errors =>
        errors.pipe(
          mergeMap((error, index) => {
            const retryAttempt = index + 1;

            // No reintentar errores de permisos o autenticación
            if (this.isNonRetryableError(error)) {
              return throwError(() => error);
            }

            // Alcanzó el máximo de reintentos
            if (retryAttempt > maxRetries) {
              console.error(`Max retries (${maxRetries}) reached for error:`, error);
              return throwError(() => error);
            }

            // Calcular delay con backoff exponencial
            const delayMs = RETRY_CONSTANTS.INITIAL_RETRY_DELAY * 
                          Math.pow(RETRY_CONSTANTS.RETRY_BACKOFF_MULTIPLIER, retryAttempt - 1);

            console.log(`Retry attempt ${retryAttempt}/${maxRetries} in ${delayMs}ms...`);

            return timer(delayMs);
          })
        )
      )
    );
  }

  /**
   * Wrapper para operaciones con manejo de errores completo
   */
  handleOperation<T>(
    operation$: Observable<T>,
    options: {
      retries?: number;
      showToast?: boolean;
      successMessage?: string;
      errorMessage?: string;
      onSuccess?: (data: T) => void;
      onError?: (error: any) => void;
    } = {}
  ): Observable<T> {
    const {
      retries = RETRY_CONSTANTS.MAX_RETRY_ATTEMPTS,
      showToast = true,
      successMessage,
      errorMessage,
      onSuccess,
      onError
    } = options;

    return operation$.pipe(
      this.retryWithBackoff(retries),
      catchError(error => {
        if (onError) {
          onError(error);
        }
        return this.handleError(error, showToast, errorMessage);
      }),
      finalize(() => {
        if (successMessage) {
          this.showSuccessToast(successMessage);
        }
      })
    );
  }

  /**
   * Obtiene mensaje de error legible
   */
  private getErrorMessage(error: any, customMessage?: string): string {
    if (customMessage) {
      return customMessage;
    }

    // Errores de Firebase
    if (error?.code) {
      switch (error.code) {
        case 'permission-denied':
          return ERROR_MESSAGES.NO_PERMISSIONS;
        case 'unavailable':
        case 'failed-precondition':
          return ERROR_MESSAGES.NETWORK_ERROR;
        case 'unauthenticated':
          return ERROR_MESSAGES.NO_AUTH;
        case 'not-found':
          return 'Recurso no encontrado';
        case 'already-exists':
          return 'El recurso ya existe';
        default:
          return error.message || ERROR_MESSAGES.LOAD_DATA_FAILED;
      }
    }

    // Errores HTTP
    if (error?.status) {
      switch (error.status) {
        case 401:
        case 403:
          return ERROR_MESSAGES.NO_PERMISSIONS;
        case 404:
          return 'Recurso no encontrado';
        case 500:
        case 503:
          return ERROR_MESSAGES.NETWORK_ERROR;
        default:
          return error.message || ERROR_MESSAGES.LOAD_DATA_FAILED;
      }
    }

    // Error genérico
    return error?.message || ERROR_MESSAGES.LOAD_DATA_FAILED;
  }

  /**
   * Determina si un error NO debe reintentar
   */
  private isNonRetryableError(error: any): boolean {
    const nonRetryableCodes = [
      'permission-denied',
      'unauthenticated',
      'not-found',
      'invalid-argument',
      'already-exists'
    ];

    return nonRetryableCodes.includes(error?.code) ||
           [401, 403, 404].includes(error?.status);
  }

  /**
   * Muestra toast de error
   */
  async showErrorToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: TIME_CONSTANTS.TOAST_DURATION_MS,
      color: 'danger',
      position: 'top',
      icon: 'alert-circle-outline',
      buttons: [
        {
          text: 'Cerrar',
          role: 'cancel'
        }
      ]
    });

    await toast.present();
  }

  /**
   * Muestra toast de éxito
   */
  async showSuccessToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: TIME_CONSTANTS.TOAST_SHORT_DURATION_MS,
      color: 'success',
      position: 'top',
      icon: 'checkmark-circle-outline'
    });

    await toast.present();
  }

  /**
   * Muestra toast de advertencia
   */
  async showWarningToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: TIME_CONSTANTS.TOAST_DURATION_MS,
      color: 'warning',
      position: 'top',
      icon: 'warning-outline'
    });

    await toast.present();
  }

  /**
   * Muestra toast de información
   */
  async showInfoToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: TIME_CONSTANTS.TOAST_SHORT_DURATION_MS,
      color: 'primary',
      position: 'top',
      icon: 'information-circle-outline'
    });

    await toast.present();
  }

  /**
   * Obtiene el estado actual del error
   */
  getErrorState(): ErrorState | null {
    return this.errorState;
  }

  /**
   * Limpia el estado de error
   */
  clearErrorState(): void {
    this.errorState = null;
  }

  /**
   * Verifica si hay error activo
   */
  hasActiveError(): boolean {
    return this.errorState !== null && this.errorState.hasError;
  }
}
