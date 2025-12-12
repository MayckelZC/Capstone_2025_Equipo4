import { Injectable } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { from, Observable, of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PetImageService {
  constructor(private storage: AngularFireStorage) { }

  async uploadPetImage(file: File, petId: string, isMainImage: boolean = false): Promise<string> {
    // Validar el archivo
    if (!file.type.startsWith('image/')) {
      throw new Error('El archivo debe ser una imagen');
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB límite
      throw new Error('La imagen excede el tamaño máximo permitido (5MB)');
    }

    // Generar nombre único para la imagen
    const fileName = `${new Date().getTime()}_${file.name}`;
    const filePath = isMainImage
      ? `pet-images/${petId}/main_${fileName}`
      : `pet-images/${petId}/gallery_${fileName}`;

    try {
      // Comprimir la imagen antes de subirla
      const compressedFile = await this.compressImage(file);

      // Subir imagen
      const fileRef = this.storage.ref(filePath);
      const task = this.storage.upload(filePath, compressedFile);
      await task;

      // Obtener y devolver URL
      return await fileRef.getDownloadURL().toPromise();
    } catch (error) {
      console.error('Error al subir la imagen:', error);
      throw new Error('No se pudo subir la imagen. Por favor, intenta de nuevo.');
    }
  }

  private async compressImage(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Si la imagen es más grande que 1200px en cualquier dimensión, redimensionar
          if (width > 1200 || height > 1200) {
            if (width > height) {
              height *= 1200 / width;
              width = 1200;
            } else {
              width *= 1200 / height;
              height = 1200;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convertir a blob con calidad 0.8 (buena calidad pero tamaño reducido)
          canvas.toBlob(
            (blob) => resolve(blob),
            'image/jpeg',
            0.8
          );
        };
        img.src = e.target.result;
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  async deletePetImage(imageUrl: string): Promise<void> {
    try {
      await this.storage.refFromURL(imageUrl).delete().toPromise();
    } catch (error) {
      console.error('Error al eliminar la imagen:', error);
      throw new Error('No se pudo eliminar la imagen. Por favor, intenta de nuevo.');
    }
  }

  async deleteAllPetImages(petId: string): Promise<void> {
    const path = `pet-images/${petId}`;
    const ref = this.storage.ref(path);

    try {
      const items = await ref.listAll().toPromise();
      const deletePromises = items.items.map(item => item.delete());
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error al eliminar las imágenes:', error);
      throw new Error('No se pudieron eliminar todas las imágenes. Por favor, intenta de nuevo.');
    }
  }

  validateImageUrl(url: string): Observable<boolean> {
    return from(fetch(url, { method: 'HEAD' })).pipe(
      map(response => response.ok),
      catchError(() => of(false))
    );
  }

  refreshImageUrl(url: string): Observable<string> {
    return from(this.storage.refFromURL(url).getDownloadURL());
  }
}