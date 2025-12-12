import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Import existing shared modules
import { PipesModule } from '../pipes/pipes.module';

// Componentes reutilizables (importamos desde el módulo existente)
// Eventualmente estos componentes se moverán aquí
import { SharedComponentsModule as OldSharedComponentsModule } from '../components/shared-components.module';

// Import performance optimization modules


/**
 * SharedModule
 * 
 * Este módulo contiene componentes, directivas, pipes y servicios
 * que son reutilizables en múltiples features de la aplicación.
 * 
 * Se puede importar en cualquier feature module que lo necesite.
 */
@NgModule({
    imports: [
        CommonModule,
        IonicModule,
        FormsModule,
        ReactiveFormsModule,
        PipesModule,
        OldSharedComponentsModule
    ],
    exports: [
        CommonModule,
        IonicModule,
        FormsModule,
        ReactiveFormsModule,
        PipesModule,
        OldSharedComponentsModule
    ]
})
export class SharedModule { }
