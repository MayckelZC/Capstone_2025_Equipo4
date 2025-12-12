import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { Preferences } from '@capacitor/preferences';
import { PetsService } from '@features/pets/services/pets.service';
import { Adopcion } from '../../../../models/Adopcion';

@Component({
  selector: 'app-advanced-search',
  templateUrl: './advanced-search.page.html',
  styleUrls: ['./advanced-search.page.scss'],
})
export class AdvancedSearchPage implements OnInit {

  filters: any = {};
  pets: Adopcion[] = [];
  loading: boolean = false;
  searchAttempted: boolean = false;

  savedSearches: any[] = [];
  readonly SAVED_SEARCHES_KEY = 'saved_pet_searches';

  constructor(
    private petsService: PetsService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.loadSavedSearches();
  }

  async loadSavedSearches() {
    const { value } = await Preferences.get({ key: this.SAVED_SEARCHES_KEY });
    if (value) {
      this.savedSearches = JSON.parse(value);
    }
  }

  search() {
    this.loading = true;
    this.searchAttempted = true;
    this.pets = [];

    const cleanFilters = Object.entries(this.filters).reduce((acc: any, [key, value]) => {
      if (value !== null && value !== '' && value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {});

    this.petsService.getFilteredPets(cleanFilters).subscribe({
      next: (pets) => {
        this.pets = pets;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error during search:', err);
        this.loading = false;
        this.presentToast('Error al realizar la búsqueda.', 'danger');
      }
    });
  }

  async promptSaveSearch() {
    const alert = await this.alertController.create({
      header: 'Guardar Búsqueda',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Ej. Perros pequeños'
        },
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Guardar',
          handler: (data) => {
            if (data.name) {
              this.saveSearch(data.name);
            } else {
              this.presentToast('Debes proporcionar un nombre para la búsqueda.', 'warning');
            }
          },
        },
      ],
    });

    await alert.present();
  }

  async saveSearch(name: string) {
    const newSearch = {
      name: name,
      filters: { ...this.filters }
    };
    this.savedSearches.push(newSearch);
    await Preferences.set({
      key: this.SAVED_SEARCHES_KEY,
      value: JSON.stringify(this.savedSearches)
    });
    this.presentToast('Búsqueda guardada con éxito.', 'success');
  }

  applySavedSearch(search: any) {
    this.filters = { ...search.filters };
    this.search();
    this.presentToast(`Filtros de "${search.name}" aplicados.`, 'secondary');
  }

  async deleteSavedSearch(index: number) {
    const alert = await this.alertController.create({
      header: 'Confirmar Eliminación',
      message: `¿Estás seguro de que quieres eliminar la búsqueda "${this.savedSearches[index].name}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          handler: async () => {
            this.savedSearches.splice(index, 1);
            await Preferences.set({
              key: this.SAVED_SEARCHES_KEY,
              value: JSON.stringify(this.savedSearches)
            });
            this.presentToast('Búsqueda eliminada.', 'success');
          }
        }
      ]
    });
    await alert.present();
  }

  onDetails(pet: Adopcion) {
    this.router.navigate(['/pets/detalle'], { queryParams: { id: pet.id } });
  }

  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      color: color
    });
    toast.present();
  }
}

