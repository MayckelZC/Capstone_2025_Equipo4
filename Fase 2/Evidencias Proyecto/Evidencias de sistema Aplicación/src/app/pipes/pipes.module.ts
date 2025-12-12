import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusTranslatePipe } from './status-translate.pipe';
import { UserRoleTranslatePipe } from './user-role-translate.pipe';
import { PetLivingSpaceTranslatePipe } from './pet-living-space-translate.pipe';
import { ReportReasonTranslatePipe } from './report-reason-translate.pipe';
import { FirebaseTimestampPipe } from './firebase-timestamp.pipe';
import { FirebaseImagePipe } from './firebase-image.pipe';

@NgModule({
  declarations: [
    StatusTranslatePipe,
    UserRoleTranslatePipe,
    PetLivingSpaceTranslatePipe,
    ReportReasonTranslatePipe,
    FirebaseTimestampPipe,
    FirebaseImagePipe
  ],
  imports: [CommonModule],
  exports: [
    StatusTranslatePipe,
    UserRoleTranslatePipe,
    PetLivingSpaceTranslatePipe,
    ReportReasonTranslatePipe,
    FirebaseTimestampPipe,
    FirebaseImagePipe
  ]
})
export class PipesModule { }