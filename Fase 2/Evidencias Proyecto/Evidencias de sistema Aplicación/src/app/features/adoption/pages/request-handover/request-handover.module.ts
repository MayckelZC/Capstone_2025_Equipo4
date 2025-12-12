import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RequestHandoverPageRoutingModule } from './request-handover-routing.module';

import { RequestHandoverPage } from './request-handover.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RequestHandoverPageRoutingModule
  ],
  declarations: [RequestHandoverPage]
})
export class RequestHandoverPageModule {}

