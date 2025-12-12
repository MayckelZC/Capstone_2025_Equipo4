import { Injectable, Injector } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastService } from '@shared/services/toast.service';
import { LoggerService, LogLevel } from '../services/logger.service';

/**
 * ErrorInterceptor - Firebase Logging
 * 
 * Intercepta errores HTTP y muestra mensajes amigables al usuario.
 * Maneja diferentes tipos de errores (auth, network, server, etc.)
 * Registra errores automáticamente en Firebase
 */
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
    private loggerService: LoggerService | undefined;

    constructor(
        private toastService: ToastService,
        private injector: Injector
    ) { }

    private get logger(): LoggerService {
        if (!this.loggerService) {
            this.loggerService = this.injector.get(LoggerService);
        }
        return this.loggerService;
    }

    intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        return next.handle(request).pipe(
            catchError((error: HttpErrorResponse) => {
                let errorMessage = 'Ha ocurrido un error';
                let severity: LogLevel = LogLevel.ERROR;

                if (error.error instanceof ErrorEvent) {
                    // Error del lado del cliente o de red
                    errorMessage = `Error de conexión: ${error.error.message}`;
                    severity = LogLevel.WARN;
                } else {
                    // Error del lado del servidor
                    switch (error.status) {
                        case 0:
                            errorMessage = 'No hay conexión a internet. Verifica tu conexión.';
                            severity = LogLevel.WARN;
                            break;
                        case 400:
                            errorMessage = 'Solicitud inválida. Verifica los datos enviados.';
                            severity = LogLevel.INFO;
                            break;
                        case 401:
                            errorMessage = 'No autorizado. Por favor inicia sesión nuevamente.';
                            severity = LogLevel.INFO;
                            break;
                        case 403:
                            errorMessage = 'No tienes permisos para realizar esta acción.';
                            severity = LogLevel.INFO;
                            break;
                        case 404:
                            errorMessage = 'Recurso no encontrado.';
                            severity = LogLevel.INFO;
                            break;
                        case 500:
                            errorMessage = 'Error del servidor. Intenta de nuevo más tarde.';
                            severity = LogLevel.CRITICAL;
                            break;
                        case 503:
                            errorMessage = 'Servicio no disponible. Intenta de nuevo más tarde.';
                            severity = LogLevel.WARN;
                            break;
                        default:
                            errorMessage = `Error ${error.status}: ${error.message || 'Error desconocido'}`;
                            severity = LogLevel.ERROR;
                    }
                }

                // Registrar según severidad
                if (severity === LogLevel.CRITICAL) {
                    this.logger.critical(errorMessage, error, {
                        feature: 'HTTP',
                        action: 'http_error',
                        metadata: {
                            url: request.url,
                            method: request.method,
                            status: error.status,
                            statusText: error.statusText
                        }
                    });
                } else if (severity === LogLevel.ERROR) {
                    this.logger.error(errorMessage, error, {
                        feature: 'HTTP',
                        action: 'http_error',
                        metadata: {
                            url: request.url,
                            method: request.method,
                            status: error.status
                        }
                    });
                } else if (severity === LogLevel.WARN) {
                    this.logger.warn(errorMessage, {
                        feature: 'HTTP',
                        action: 'http_warning',
                        metadata: {
                            url: request.url,
                            method: request.method,
                            status: error.status
                        }
                    });
                } else {
                    this.logger.info(errorMessage, {
                        feature: 'HTTP',
                        action: 'http_info',
                        metadata: {
                            url: request.url,
                            method: request.method,
                            status: error.status
                        }
                    });
                }

                // Mostrar toast solo para errores que no sean silenciosos
                if (!request.headers.has('X-Silent-Error')) {
                    this.toastService.presentToast(errorMessage, 'danger');
                }

                // Re-lanzar el error para que los componentes puedan manejarlo si lo necesitan
                return throwError(() => error);
            })
        );
    }
}
