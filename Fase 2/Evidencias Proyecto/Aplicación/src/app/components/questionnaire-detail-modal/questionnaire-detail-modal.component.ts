import { Component, OnInit, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { AdoptionRequest } from '../../models/AdoptionRequest';

interface AdoptionRequestWithPet extends AdoptionRequest {
  pet: {
    name: string;
    type: string;
    imageUrl: string;
    breed?: string;
  };
  requester: {
    name: string;
    email: string;
  };
  owner?: {
    name: string;
    email: string;
    phone?: string;
    whatsapp?: string;
  };
}

@Component({
  selector: 'app-questionnaire-detail-modal',
  templateUrl: './questionnaire-detail-modal.component.html',
  styleUrls: ['./questionnaire-detail-modal.component.scss'],
})
export class QuestionnaireDetailModalComponent implements OnInit {
  @Input() request!: AdoptionRequestWithPet;
  @Input() showOwnerContact: boolean = false; // Para mostrar contacto del dueño

  constructor(private modalController: ModalController) { }

  ngOnInit() {
    
    
    
    if (this.request.owner) {
      
      
      
    }
  }

  dismiss() {
    this.modalController.dismiss();
  }

  getSpaceText(space: string): string {
    const spaceMap: { [key: string]: string } = {
      'indoor': 'Interior',
      'indoor_with_garden': 'Interior con jardín',
      'outdoor': 'Exterior',
      'other': 'Otro'
    };
    return spaceMap[space] || space;
  }

  // Métodos de contacto
  callOwner() {
    if (this.request.owner?.phone) {
      window.open(`tel:${this.request.owner.phone}`, '_system');
    }
  }

  whatsappOwner() {
    if (this.request.owner?.whatsapp) {
      const message = encodeURIComponent(`Hola, me interesa la adopción de ${this.request.pet?.name || 'la mascota'}`);
      window.open(`https://wa.me/${this.request.owner.whatsapp}?text=${message}`, '_system');
    }
  }

  emailOwner() {
    if (this.request.owner?.email) {
      const subject = encodeURIComponent(`Adopción de ${this.request.pet?.name || 'mascota'}`);
      const body = encodeURIComponent(`Hola, me interesa la adopción de ${this.request.pet?.name || 'la mascota'}.`);
      window.open(`mailto:${this.request.owner.email}?subject=${subject}&body=${body}`, '_system');
    }
  }
}
