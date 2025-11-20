import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HomePage } from './home.page';

import { HomePageRoutingModule } from './home-routing.module';
import { CardModule } from '../../components/card/card.module';
import { FilterModalPageModule } from '../filter-modal/filter-modal.module';
import { SharedComponentsModule } from '../../components/shared-components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HomePageRoutingModule,
    CardModule,
    FilterModalPageModule,
    SharedComponentsModule
  ],
  declarations: [
    HomePage
  ]
})
export class HomePageModule { }
