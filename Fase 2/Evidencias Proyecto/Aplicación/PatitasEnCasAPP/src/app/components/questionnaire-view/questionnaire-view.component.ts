import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { AdoptionRequest } from '../../models/AdoptionRequest';

@Component({
  selector: 'app-questionnaire-view',
  templateUrl: './questionnaire-view.component.html',
  styleUrls: ['./questionnaire-view.component.scss'],
})
export class QuestionnaireViewComponent {
  @Input() request: AdoptionRequest;

  constructor(private modalCtrl: ModalController) { }
  dismiss() {
    this.modalCtrl.dismiss();
  }
}
