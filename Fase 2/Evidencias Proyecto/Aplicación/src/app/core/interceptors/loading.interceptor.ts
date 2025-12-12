import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoadingController } from '@ionic/angular';

/**
 * LoadingInterceptor
 * 
 * Muestra un indicador de carga global para peticiones HTTP.
 * Se puede desactivar por petición usando el header 'X-Skip-Loading'.
 */
@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
    private activeRequests = 0;
    private loading: HTMLIonLoadingElement | null = null;

    constructor(private loadingController: LoadingController) { }

    intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        // Permitir skip del loading para peticiones específicas
        if (request.headers.has('X-Skip-Loading')) {
            return next.handle(request);
        }

        // Incrementar contador de peticiones activas
        this.activeRequests++;

        // Mostrar loading solo si es la primera petición
        if (this.activeRequests === 1) {
            this.showLoading();
        }

        return next.handle(request).pipe(
            finalize(() => {
                // Decrementar contador
                this.activeRequests--;

                // Ocultar loading cuando no hay más peticiones activas
                if (this.activeRequests === 0) {
                    this.hideLoading();
                }
            })
        );
    }

    private async showLoading() {
        this.loading = await this.loadingController.create({
            message: 'Cargando...',
            spinner: 'crescent',
            translucent: true,
            cssClass: 'custom-loading'
        });
        await this.loading.present();
    }

    private async hideLoading() {
        if (this.loading) {
            await this.loading.dismiss();
            this.loading = null;
        }
    }
}
