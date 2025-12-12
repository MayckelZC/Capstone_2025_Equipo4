import { Injectable } from '@angular/core';

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
}

export interface ThumbnailOptions {
  width: number;
  height: number;
  quality?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ImageOptimizationService {

  constructor() { }

  /**
   * Comprime una imagen manteniendo la relación de aspecto
   * @param file Archivo de imagen original
   * @param options Opciones de compresión
   * @returns Promise con el archivo comprimido
   */
  async compressImage(
    file: File,
    options: ImageCompressionOptions = {}
  ): Promise<Blob> {
    const {
      maxWidth = 1200,
      maxHeight = 1200,
      quality = 0.8,
      mimeType = 'image/jpeg'
    } = options;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;

        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calcular nuevas dimensiones manteniendo aspecto
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('No se pudo obtener contexto 2D'));
            return;
          }

          // Dibujar imagen redimensionada
          ctx.drawImage(img, 0, 0, width, height);

          // Convertir a blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Error al comprimir imagen'));
              }
            },
            mimeType,
            quality
          );
        };

        img.onerror = () => reject(new Error('Error al cargar imagen'));
      };

      reader.onerror = () => reject(new Error('Error al leer archivo'));
    });
  }

  /**
   * Genera un thumbnail de una imagen
   * @param file Archivo de imagen original
   * @param options Opciones del thumbnail
   * @returns Promise con el thumbnail como Blob
   */
  async generateThumbnail(
    file: File,
    size: number = 300,
    options: ThumbnailOptions = { width: 300, height: 300 }
  ): Promise<Blob> {
    return this.compressImage(file, {
      maxWidth: options.width,
      maxHeight: options.height,
      quality: options.quality || 0.7,
      mimeType: 'image/jpeg'
    });
  }

  /**
   * Convierte una imagen a formato WebP
   * @param file Archivo de imagen original
   * @param quality Calidad de compresión (0-1)
   * @returns Promise con la imagen en formato WebP
   */
  async convertToWebP(file: File, quality: number = 0.8): Promise<Blob> {
    // Verificar soporte de WebP
    if (!this.supportsWebP()) {
      console.warn('WebP no soportado, usando JPEG');
      return this.compressImage(file, { quality, mimeType: 'image/jpeg' });
    }

    return this.compressImage(file, {
      quality,
      mimeType: 'image/webp'
    });
  }

  /**
   * Verifica si el navegador soporta WebP
   * @returns true si soporta WebP
   */
  supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    if (canvas.getContext && canvas.getContext('2d')) {
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }
    return false;
  }

  /**
   * Optimiza una imagen para upload
   * Genera versión comprimida y thumbnail
   * @param file Archivo original
   * @returns Objeto con imagen optimizada y thumbnail
   */
  async optimizeForUpload(file: File): Promise<{
    optimized: Blob;
    thumbnail: Blob;
    webp?: Blob;
  }> {
    const [optimized, thumbnail, webp] = await Promise.all([
      this.compressImage(file, { maxWidth: 1200, quality: 0.8 }),
      this.generateThumbnail(file, 300),
      this.supportsWebP() ? this.convertToWebP(file, 0.8) : Promise.resolve(null)
    ]);

    const result: any = { optimized, thumbnail };
    if (webp) {
      result.webp = webp;
    }

    return result;
  }

  /**
   * Calcula el tamaño de reducción
   * @param originalSize Tamaño original en bytes
   * @param compressedSize Tamaño comprimido en bytes
   * @returns Porcentaje de reducción
   */
  calculateReduction(originalSize: number, compressedSize: number): number {
    return Math.round(((originalSize - compressedSize) / originalSize) * 100);
  }

  /**
   * Formatea el tamaño de archivo para mostrar
   * @param bytes Tamaño en bytes
   * @returns String formateado (ej: "2.5 MB")
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Valida que el archivo sea una imagen
   * @param file Archivo a validar
   * @returns true si es una imagen válida
   */
  isValidImage(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    return validTypes.includes(file.type);
  }

  /**
   * Valida el tamaño máximo de la imagen
   * @param file Archivo a validar
   * @param maxSizeMB Tamaño máximo en MB
   * @returns true si está dentro del límite
   */
  isValidSize(file: File, maxSizeMB: number = 10): boolean {
    const maxBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxBytes;
  }
}