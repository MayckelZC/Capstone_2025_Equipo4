import { NgModule, Optional, SkipSelf, ErrorHandler } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

// Guards
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { PublicGuard } from './guards/public.guard';
import { VeterinarianGuard } from './guards/veterinarian.guard';

// Services
import { GlobalErrorHandlerService } from './services/global-error-handler.service';

// Interceptors
import { AuthInterceptor, ErrorInterceptor, LoadingInterceptor } from './interceptors';

/**
 * CoreModule
 * 
 * Este módulo debe ser importado UNA SOLA VEZ en AppModule.
 * Contiene servicios singleton, guards e interceptors que se usan en toda la aplicación.
 * 
 * El constructor verifica que no se importe múltiples veces.
 */
@NgModule({
    imports: [
        CommonModule
    ],
    providers: [
        // Guards
        AuthGuard,
        AdminGuard,
        PublicGuard,
        VeterinarianGuard,

        // Error Handler
        {
            provide: ErrorHandler,
            useClass: GlobalErrorHandlerService
        },

        // HTTP Interceptors
        {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthInterceptor,
            multi: true
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: ErrorInterceptor,
            multi: true
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: LoadingInterceptor,
            multi: true
        }
    ]
})
export class CoreModule {
    /**
     * Constructor que previene que CoreModule se importe más de una vez
     */
    constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
        if (parentModule) {
            throw new Error(
                'CoreModule is already loaded. Import it in the AppModule only.'
            );
        }
    }
}
