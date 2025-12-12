import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';

/**
 * SelectivePreloadingStrategy
 * 
 * Una estrategia de precarga personalizada que solo precarga los módulos
 * más importantes y utilizados, mejorando el rendimiento inicial.
 * 
 * Beneficios vs PreloadAllModules:
 * - Menor uso de ancho de banda inicial
 * - Menor uso de memoria
 * - Carga más rápida de la app
 * 
 * Usage: Agregar `data: { preload: true }` a las rutas que deseas precargar
 */
@Injectable({
    providedIn: 'root'
})
export class SelectivePreloadingStrategy implements PreloadingStrategy {

    // Módulos que se precargarán (rutas de alta prioridad)
    private readonly highPriorityModules = ['pets', 'user'];

    // Módulos que se precargarán después de un delay (prioridad media)
    private readonly mediumPriorityModules = ['adoptions', 'appointments'];

    // Delay en ms antes de precargar módulos de prioridad media
    private readonly mediumPriorityDelay = 3000;

    preload(route: Route, load: () => Observable<any>): Observable<any> {
        // Si la ruta tiene data.preload = true, precargar inmediatamente
        if (route.data && route.data['preload']) {
            console.log(`[Preload] Loading: ${route.path}`);
            return load();
        }

        // Verificar si es un módulo de alta prioridad
        if (route.path && this.highPriorityModules.includes(route.path)) {
            console.log(`[Preload] High priority: ${route.path}`);
            return load();
        }

        // Verificar si es un módulo de prioridad media (precargar con delay)
        if (route.path && this.mediumPriorityModules.includes(route.path)) {
            console.log(`[Preload] Medium priority (delayed): ${route.path}`);
            return timer(this.mediumPriorityDelay).pipe(
                switchMap(() => {
                    console.log(`[Preload] Now loading: ${route.path}`);
                    return load();
                })
            );
        }

        // No precargar módulos de baja prioridad (admin, veterinarian, legal, etc.)
        console.log(`[Preload] Skipping: ${route.path}`);
        return of(null);
    }
}
