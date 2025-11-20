import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { QRCodeModule } from 'angularx-qrcode'; 

import { DetallePageRoutingModule } from './detalle-routing.module';
import { DetallePage } from './detalle.page';
import { CardModule } from '../../components/card/card.module'; // Importa el módulo del CardComponent (ruta relativa)
import { ImageViewerModalComponent } from './image-viewer.modal';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    QRCodeModule, 
    DetallePageRoutingModule,
  CardModule // Agrégalo aquí
  ],
  declarations: [DetallePage, ImageViewerModalComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DetallePageModule {}
