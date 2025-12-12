import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * AuthInterceptor
 * 
 * Intercepta todas las peticiones HTTP y agrega el token de autenticación
 * de Firebase Auth si el usuario está autenticado.
 * 
 * Nota: Firebase Firestore ya maneja la autenticación automáticamente,
 * por lo que este interceptor está preparado para uso futuro con otras APIs.
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {

    intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        // Por ahora, simplemente pasar las peticiones sin modificar
        // Firebase Firestore maneja la autenticación automáticamente
        // Este interceptor está listo para agregar tokens a otras APIs en el futuro

        return next.handle(request);
    }
}
