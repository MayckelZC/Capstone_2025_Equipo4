import { Component, OnInit } from '@angular/core';
import { ShelterService } from '@shared/services/shelter.service';
import { Shelter } from '../../../models/Shelter';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-shelters',
  templateUrl: './shelters.page.html',
  styleUrls: ['./shelters.page.scss'],
})
export class SheltersPage implements OnInit {

  shelters: Shelter[] = [];

  constructor(
    private shelterService: ShelterService,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    this.shelterService.getShelters().subscribe(shelters => {
      this.shelters = shelters;
    });
  }

  async addShelter() {
    const alert = await this.alertController.create({
      header: 'Añadir Refugio',
      inputs: [
        { name: 'name', type: 'text', placeholder: 'Nombre' },
        { name: 'address', type: 'text', placeholder: 'Dirección' },
        { name: 'phone', type: 'text', placeholder: 'Teléfono' },
        { name: 'email', type: 'email', placeholder: 'Email' },
        { name: 'website', type: 'url', placeholder: 'Sitio Web' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Añadir', handler: (data) => this.shelterService.addShelter(data) }
      ]
    });
    await alert.present();
  }

  async editShelter(shelter: Shelter) {
    const alert = await this.alertController.create({
      header: 'Editar Refugio',
      inputs: [
        { name: 'name', type: 'text', value: shelter.name, placeholder: 'Nombre' },
        { name: 'address', type: 'text', value: shelter.address, placeholder: 'Dirección' },
        { name: 'phone', type: 'text', value: shelter.phone, placeholder: 'Teléfono' },
        { name: 'email', type: 'email', value: shelter.email, placeholder: 'Email' },
        { name: 'website', type: 'url', value: shelter.website, placeholder: 'Sitio Web' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Guardar', handler: (data) => this.shelterService.updateShelter(shelter.id, data) }
      ]
    });
    await alert.present();
  }

  deleteShelter(shelterId: string) {
    this.shelterService.deleteShelter(shelterId);
  }

}
