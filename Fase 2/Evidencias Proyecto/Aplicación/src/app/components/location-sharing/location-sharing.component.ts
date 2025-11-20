import { AfterViewInit, Component, Input } from '@angular/core';

import { MapService } from '../../services/map.service';

@Component({
  selector: 'app-location-sharing',
  template: `
    <div class="location-container">
      <h2>Ubicación del encuentro</h2>

      <div #mapContainer class="map-container">
        <!-- El mapa se renderizará aquí -->
      </div>

      <div class="location-controls">
        <ion-item>
          <ion-label position="stacked">Dirección</ion-label>
          <ion-input
            [(ngModel)]="address"
            placeholder="Ingrese la dirección del encuentro"
            (ionChange)="searchLocation()">
          </ion-input>
        </ion-item>

        <ion-button expand="block" 
                    (click)="getCurrentLocation()"
                    class="location-button">
          <ion-icon name="locate" slot="start"></ion-icon>
          Usar mi ubicación actual
        </ion-button>

        <ion-button expand="block"
                    color="primary"
                    [disabled]="!selectedLocation"
                    (click)="shareLocation()"
                    class="share-button">
          <ion-icon name="share-social" slot="start"></ion-icon>
          Compartir ubicación
        </ion-button>
      </div>

      <div class="location-details" *ngIf="selectedLocation">
        <ion-card>
          <ion-card-header>
            <ion-card-subtitle>Ubicación seleccionada</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <p><ion-icon name="pin"></ion-icon> {{ selectedLocation.address }}</p>
            <p *ngIf="selectedLocation.distance">
              <ion-icon name="walk"></ion-icon> 
              Distancia aproximada: {{ selectedLocation.distance }}
            </p>
          </ion-card-content>
        </ion-card>
      </div>

      <div class="suggestions" *ngIf="suggestions.length > 0">
        <ion-list>
          <ion-item *ngFor="let suggestion of suggestions" 
                    button
                    (click)="selectSuggestion(suggestion)">
            <ion-icon name="location" slot="start"></ion-icon>
            <ion-label>
              <h3>{{ suggestion.name }}</h3>
              <p>{{ suggestion.address }}</p>
            </ion-label>
          </ion-item>
        </ion-list>
      </div>
    </div>
  `,
  styles: [`
    .location-container {
      padding: 1rem;
    }

    .map-container {
      height: 200px;
      margin-bottom: 1rem;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .location-controls {
      margin-bottom: 1rem;
    }

    .location-button,
    .share-button {
      margin-top: 1rem;
    }

    .location-details {
      margin-top: 1rem;
    }

    .suggestions {
      margin-top: 1rem;
    }

    ion-card {
      margin: 0;
    }

    ion-item {
      --padding-start: 0;
    }

    ion-icon {
      margin-right: 0.5rem;
      color: var(--ion-color-primary);
    }
  `]
})
export class LocationSharingComponent implements AfterViewInit {


  address: string = '';
  selectedLocation: any = null;
  suggestions: any[] = [];
  private mapInstance: any;
  private marker: any;

  constructor(

    private mapService: MapService
  ) { }

  ngAfterViewInit() {
    this.initializeMap();
  }

  private async initializeMap() {
    try {
      this.mapInstance = await this.mapService.createMap('mapContainer', {
        zoom: 15,
        center: { lat: 0, lng: 0 }
      });

      // Configurar eventos del mapa
      this.mapInstance.on('click', (e: any) => {
        this.onMapClick(e);
      });
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }

  async getCurrentLocation() {
    try {
      const position = await this.mapService.getCurrentPosition();
      this.updateMapLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });

      // Obtener dirección desde coordenadas
      const address = await this.mapService.reverseGeocode(position.coords);
      this.selectedLocation = {
        coordinates: {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        },
        address: address
      };
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  }

  async searchLocation() {
    if (!this.address || this.address.length < 3) return;

    try {
      this.suggestions = await this.mapService.searchPlaces(this.address);
    } catch (error) {
      console.error('Error searching location:', error);
    }
  }

  async selectSuggestion(suggestion: any) {
    this.selectedLocation = suggestion;
    this.address = suggestion.address;
    this.suggestions = [];

    this.updateMapLocation(suggestion.coordinates);
  }

  private updateMapLocation(coordinates: { lat: number; lng: number }) {
    if (!this.mapInstance) return;

    this.mapInstance.setCenter(coordinates);

    if (this.marker) {
      this.marker.setPosition(coordinates);
    } else {
      this.marker = this.mapService.addMarker(this.mapInstance, coordinates);
    }
  }

  private async onMapClick(event: any) {
    const coordinates = {
      lat: event.latlng.lat,
      lng: event.latlng.lng
    };

    try {
      const address = await this.mapService.reverseGeocode(coordinates);
      this.selectedLocation = {
        coordinates,
        address
      };
      this.updateMapLocation(coordinates);
      placeholder = "Ingrese la dirección del encuentro"
        (ionChange) = "searchLocation()" >
        </ion-input>
        </ion-item>

        < ion - button expand = "block"
          (click) = "getCurrentLocation()"
      class="location-button" >
        <ion-icon name = "locate" slot = "start" > </ion-icon>
          Usar mi ubicación actual
        </ion-button>

        < ion - button expand = "block"
      color = "primary"
      [disabled] = "!selectedLocation"
        (click) = "shareLocation()"
      class="share-button" >
        <ion-icon name = "share-social" slot = "start" > </ion-icon>
          Compartir ubicación
        </ion-button>
        </div>

        < div class="location-details" * ngIf="selectedLocation" >
          <ion-card >
          <ion-card - header >
          <ion-card - subtitle > Ubicación seleccionada </ion-card-subtitle>
            </ion-card-header>
            < ion - card - content >
            <p><ion-icon name = "pin" > </ion-icon> {{ selectedLocation.address }}</p >
              <p * ngIf="selectedLocation.distance" >
                <ion-icon name = "walk" > </ion-icon> 
              Distancia aproximada: { { selectedLocation.distance } }
      </p>
        </ion-card-content>
        </ion-card>
        </div>

        < div class="suggestions" * ngIf="suggestions.length > 0" >
          <ion-list >
          <ion-item * ngFor="let suggestion of suggestions"
      button
        (click) = "selectSuggestion(suggestion)" >
        <ion-icon name = "location" slot = "start" > </ion-icon>
          < ion - label >
          <h3>{{ suggestion.name }
    }</h3>
      < p > {{ suggestion.address }
  }</p>
    </ion-label>
    </ion-item>
    </ion-list>
    </div>
    </div>
      `,
  styles: [`
      .location - container {
  padding: 1rem;
}

    .map - container {
  height: 200px;
  margin - bottom: 1rem;
  border - radius: 8px;
  overflow: hidden;
  box - shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

    .location - controls {
  margin - bottom: 1rem;
}

    .location - button,
    .share - button {
  margin - top: 1rem;
}

    .location - details {
  margin - top: 1rem;
}

    .suggestions {
  margin - top: 1rem;
}

ion - card {
  margin: 0;
}

ion - item {
  --padding - start: 0;
}

ion - icon {
  margin - right: 0.5rem;
  color: var(--ion - color - primary);
}
`]
})
export class LocationSharingComponent implements AfterViewInit {


  address: string = '';
  selectedLocation: any = null;
  suggestions: any[] = [];
  private mapInstance: any;
  private marker: any;

  constructor(

    private mapService: MapService
  ) {}

  ngAfterViewInit() {
    this.initializeMap();
  }

  private async initializeMap() {
    try {
      this.mapInstance = await this.mapService.createMap('mapContainer', {
        zoom: 15,
        center: { lat: 0, lng: 0 }
      });

      // Configurar eventos del mapa
      this.mapInstance.on('click', (e: any) => {
        this.onMapClick(e);
      });
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }

  async getCurrentLocation() {
    try {
      const position = await this.mapService.getCurrentPosition();
      this.updateMapLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
      
      // Obtener dirección desde coordenadas
      const address = await this.mapService.reverseGeocode(position.coords);
      this.selectedLocation = {
        coordinates: {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        },
        address: address
      };
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  }

  async searchLocation() {
    if (!this.address || this.address.length < 3) return;

    try {
      this.suggestions = await this.mapService.searchPlaces(this.address);
    } catch (error) {
      console.error('Error searching location:', error);
    }
  }

  async selectSuggestion(suggestion: any) {
    this.selectedLocation = suggestion;
    this.address = suggestion.address;
    this.suggestions = [];

    this.updateMapLocation(suggestion.coordinates);
  }

  private updateMapLocation(coordinates: { lat: number; lng: number }) {
    if (!this.mapInstance) return;

    this.mapInstance.setCenter(coordinates);
    
    if (this.marker) {
      this.marker.setPosition(coordinates);
    } else {
      this.marker = this.mapService.addMarker(this.mapInstance, coordinates);
    }
  }

  private async onMapClick(event: any) {
    const coordinates = {
      lat: event.latlng.lat,
      lng: event.latlng.lng
    };

    try {
      const address = await this.mapService.reverseGeocode(coordinates);
      this.selectedLocation = {
        coordinates,
        address
      };
      this.updateMapLocation(coordinates);
    } catch (error) {
      console.error('Error handling map click:', error);
    }
  }
}