import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, of, from } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) { }

  canActivate(): Observable<boolean> {
    return this.authService.isAuthenticated().pipe(
      switchMap(isAuth => from((async () => {
        if (!isAuth) {
          this.router.navigate(['/auth/login']);
          return false;
        }

        const isEmailVerified = await this.authService.isEmailVerified();
        if (!isEmailVerified) {
          this.router.navigate(['/auth/verificacion-pendiente']);
          return false;
        }

        return true;
      })())),
      catchError(error => from((async () => {
        console.error('Error checking authentication', error);
        const user = await this.authService.getCurrentFirebaseUser();
        if (user && !user.emailVerified) {
          this.router.navigate(['/auth/verificacion-pendiente']);
        }
        return false;
      })()))
    );
  }
}

