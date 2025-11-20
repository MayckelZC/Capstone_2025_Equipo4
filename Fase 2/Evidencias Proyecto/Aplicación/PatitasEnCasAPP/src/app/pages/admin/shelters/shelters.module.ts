import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SheltersPageRoutingModule } from './shelters-routing.module';

import { SheltersPage } from './shelters.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SheltersPageRoutingModule
  ],
  declarations: [SheltersPage]
})
export class SheltersPageModule {}
