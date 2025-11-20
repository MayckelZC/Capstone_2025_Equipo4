import { Component } from '@angular/core';
import { ThemeService, ThemePreference } from '../../services/theme.service';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-theme-toggle',
    templateUrl: './theme-toggle.component.html',
    styleUrls: ['./theme-toggle.component.scss']
})
export class ThemeToggleComponent {
    isDarkMode$: Observable<boolean>;
    currentPreference$: Observable<ThemePreference>;

    constructor(public themeService: ThemeService) {
        this.isDarkMode$ = this.themeService.isDarkMode$;
        this.currentPreference$ = this.themeService.themePreference$;
    }

    async toggleTheme() {
        await this.themeService.toggle();
    }

    async setPreference(preference: ThemePreference) {
        await this.themeService.setPreference(preference);
    }
}
