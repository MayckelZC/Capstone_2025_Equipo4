import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { ToastService } from '@shared/services/toast.service';
import { LoggerService } from './logger.service';

@Injectable()
export class GlobalErrorHandlerService implements ErrorHandler {

    constructor(private injector: Injector) { }

    handleError(error: any): void {
        const toastService = this.injector.get(ToastService);
        let loggerService: LoggerService | undefined;

        try {
            loggerService = this.injector.get(LoggerService);
        } catch (e) {
            // If LoggerService fails to load (e.g. circular dependency or init error),
            // fallback to console and avoid infinite loop
            console.error('GlobalErrorHandler: Error getting LoggerService', e);
            console.error('Original Error:', error);
            return;
        }

        console.error('Global Error Handler:', error);

        const message = error.message || error.toString();
        const cleanMessage = message.replace('Uncaught (in promise):', '').trim();

        // Evitar mostrar errores de cancelación de navegación o errores triviales
        if (cleanMessage.includes('NavigationCancelled')) {
            return;
        }

        // Ignorar errores de permisos de Firebase (ocurren durante logout normal)
        if (error.code === 'permission-denied' ||
            cleanMessage.includes('Missing or insufficient permissions') ||
            cleanMessage.includes('PERMISSION_DENIED')) {
            // Es un error esperado durante logout, no mostrar toast
            loggerService.debug('Permission denied (expected during logout)', {
                feature: 'Auth',
                action: 'permission_denied'
            });
            return;
        }

        // Ignorar errores de índices faltantes de Firestore (informativos, no críticos)
        if (error.code === 'failed-precondition' ||
            cleanMessage.includes('The query requires an index') ||
            cleanMessage.includes('create it here: https://console.firebase.google.com')) {
            // Es un error informativo, Firebase crea el índice automáticamente
            loggerService.warn('Firestore Index needed. Will be auto-created.', {
                feature: 'Firestore',
                action: 'index_missing'
            });
            return;
        }

        // Ignorar errores de DatePipe (InvalidPipeArgument) que ya han sido corregidos pero pueden quedar en caché
        if (cleanMessage.includes('InvalidPipeArgument') && cleanMessage.includes('DatePipe')) {
            loggerService.debug('DatePipe invalid argument (cached)', {
                feature: 'Pipes',
                action: 'invalid_argument'
            });
            return;
        }

        // Registrar en Firebase (automáticamente guardado en Firestore en producción)
        loggerService.critical(cleanMessage, error, {
            feature: 'Global',
            action: 'uncaught_error',
            metadata: {
                code: error.code,
                stack: error.stack
            }
        });

        // Mostrar notificación amigable
        // Usamos setTimeout para asegurar que Angular haya terminado el ciclo de detección de cambios actual
        setTimeout(() => {
            toastService.presentToast(
                'Ocurrió un error inesperado. Por favor, intenta de nuevo.',
                'danger',
                'alert-circle-outline'
            );
        });
    }
}
