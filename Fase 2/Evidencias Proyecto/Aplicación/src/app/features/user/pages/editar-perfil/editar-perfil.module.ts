import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EditarPerfilPageRoutingModule } from './editar-perfil-routing.module';

import { EditarPerfilPage } from './editar-perfil.page';
import { ImageCropperComponent } from 'ngx-image-cropper';
import { ChangeEmailModalComponent } from '../../../../components/change-email-modal/change-email-modal.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    EditarPerfilPageRoutingModule,
    ImageCropperComponent
  ],
  declarations: [
    EditarPerfilPage,
    ChangeEmailModalComponent
  ]
})
export class EditarPerfilPageModule {}

