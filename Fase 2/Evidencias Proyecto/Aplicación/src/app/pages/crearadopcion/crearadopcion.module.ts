import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CrearadopcionPageRoutingModule } from './crearadopcion-routing.module';

import { CrearadopcionPage } from './crearadopcion.page';
import { ImageCropperComponent } from 'ngx-image-cropper';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    CrearadopcionPageRoutingModule,
    ImageCropperComponent
  ],
  declarations: [CrearadopcionPage]
})
export class CrearadopcionPageModule { }
