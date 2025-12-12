import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthRoutingModule } from './auth-routing.module';
import { SharedModule } from '@shared/shared.module';

/**
 * AuthModule
 * 
 * Feature module for authentication-related pages:
 * - Login
 * - Registro (Sign up)
 * - Restablecer (Password reset)
 */
@NgModule({
    imports: [
        CommonModule,
        SharedModule,
        AuthRoutingModule
    ]
})
export class AuthModule { }
