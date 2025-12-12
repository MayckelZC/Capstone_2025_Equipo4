import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DetallePageRoutingModule } from './detalle-routing.module';

import { CardModule } from '../../../../components/card/card.module';
import { DetallePage } from './detalle.page';
import { ImageViewerModalComponent } from './image-viewer.modal';
import { PipesModule } from '../../../../pipes/pipes.module';
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DetallePageRoutingModule,
    PipesModule,
    CardModule
  ],
  declarations: [DetallePage, ImageViewerModalComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DetallePageModule { }

