import { Pipe, PipeTransform } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Pipe({
    name: 'firebaseImage'
})
export class FirebaseImagePipe implements PipeTransform {

    constructor(private storage: AngularFireStorage) { }

    transform(imagePath: string | null | undefined, fallbackImage: string = 'assets/imgs/paw.png'): Observable<string> {
        // Si no hay imagen, retornar fallback
        if (!imagePath) {
            return of(fallbackImage);
        }

        // Si la URL ya tiene token (contiene 'token='), retornarla directamente
        if (imagePath.includes('token=') || imagePath.includes('firebasestorage.googleapis.com')) {
            return of(imagePath);
        }

        // Si es una ruta de assets local, retornarla directamente
        if (imagePath.startsWith('assets/') || imagePath.startsWith('/assets/')) {
            return of(imagePath);
        }

        // Obtener URL con token desde Firebase Storage
        try {
            return this.storage.ref(imagePath).getDownloadURL().pipe(
                catchError(error => {
                    console.warn('Error loading image from Firebase Storage:', error);
                    return of(fallbackImage);
                })
            );
        } catch (error) {
            console.warn('Error getting download URL:', error);
            return of(fallbackImage);
        }
    }
}
