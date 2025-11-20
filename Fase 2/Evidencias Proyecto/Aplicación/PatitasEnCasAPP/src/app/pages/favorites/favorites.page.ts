import { Component, OnInit } from '@angular/core';
import { FavoriteService } from '../../services/favorite.service';
import { PetsService } from '../../services/pets.service';
import { AuthService } from '../../services/auth.service';
import { Adopcion } from '../../models/Adopcion';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.page.html',
  styleUrls: ['./favorites.page.scss'],
})
export class FavoritesPage implements OnInit {

  favoritePets: Adopcion[] = [];

  constructor(
    private favoriteService: FavoriteService,
    private petsService: PetsService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.authService.getCurrentUser().then(user => {
      if (user) {
        this.favoriteService.getFavorites(user.uid).subscribe(favorites => {
          const petObservables = favorites.map(fav => this.petsService.getPet(fav.petId));
          forkJoin(petObservables).subscribe(pets => {
            this.favoritePets = pets.filter(p => p !== undefined) as Adopcion[];
          });
        });
      }
    });
  }

}
