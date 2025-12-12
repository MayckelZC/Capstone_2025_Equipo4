import { Component, OnInit, OnDestroy } from '@angular/core';
import { FavoriteService } from '@features/pets/services/favorite.service';
import { PetsService } from '@features/pets/services/pets.service';
import { AuthService } from '@core/services/auth.service';
import { Adopcion } from '../../../../models/Adopcion';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.page.html',
  styleUrls: ['./favorites.page.scss'],
})
export class FavoritesPage implements OnInit, OnDestroy {

  favoritePets: Adopcion[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private favoriteService: FavoriteService,
    private petsService: PetsService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.loadFavorites();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async loadFavorites() {
    const user = await this.authService.getCurrentUser();
    if (!user) return;

    this.favoriteService.getFavorites(user.uid)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(favorites => {
          const petObservables = favorites.map(fav => this.petsService.getPet(fav.petId));
          return forkJoin(petObservables.length ? petObservables : []);
        })
      )
      .subscribe(pets => {
        this.favoritePets = pets.filter(p => p !== undefined) as Adopcion[];
      });
  }
}
