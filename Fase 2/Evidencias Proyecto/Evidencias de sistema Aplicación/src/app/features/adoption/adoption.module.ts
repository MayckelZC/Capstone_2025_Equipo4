import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdoptionRoutingModule } from './adoption-routing.module';
import { SharedModule } from '@shared/shared.module';

@NgModule({
    imports: [
        CommonModule,
        SharedModule,
        AdoptionRoutingModule
    ]
})
export class AdoptionModule { }
