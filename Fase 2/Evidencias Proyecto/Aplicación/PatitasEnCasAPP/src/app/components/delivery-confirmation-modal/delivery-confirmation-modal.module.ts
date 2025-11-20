import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { DeliveryConfirmationModalComponent } from './delivery-confirmation-modal.component';

@NgModule({
  declarations: [DeliveryConfirmationModalComponent],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ],
  exports: [DeliveryConfirmationModalComponent]
})
export class DeliveryConfirmationModalModule {}
