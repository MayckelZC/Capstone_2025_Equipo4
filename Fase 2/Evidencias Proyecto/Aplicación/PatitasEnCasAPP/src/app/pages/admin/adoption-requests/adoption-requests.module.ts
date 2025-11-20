import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AdoptionRequestsPageRoutingModule } from './adoption-requests-routing.module';
import { AdoptionRequestsPage } from './adoption-requests.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AdoptionRequestsPageRoutingModule
  ],
  declarations: [AdoptionRequestsPage]
})
export class AdoptionRequestsPageModule {}