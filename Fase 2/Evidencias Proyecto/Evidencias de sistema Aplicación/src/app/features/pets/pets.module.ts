import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PetsRoutingModule } from './pets-routing.module';
import { SharedModule } from '@shared/shared.module';

/**
 * PetsModule
 * 
 * Feature module for pet-related pages:
 * - Home (pet list)
 * - Detalle (pet detail)
 * - Crear (create pet adoption)
 * - Modificar (edit pet)
 * - Favorites (favorite pets)
 * - Advanced Search
 * - Filter Modal
 */
@NgModule({
    imports: [
        CommonModule,
        SharedModule,
        PetsRoutingModule
    ]
})
export class PetsModule { }
