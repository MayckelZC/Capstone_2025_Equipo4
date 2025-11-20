import { DOCUMENT } from '@angular/common';
import { Injectable, Inject, OnDestroy, Renderer2, RendererFactory2 } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService implements OnDestroy {
  private readonly STORAGE_KEY = 'theme-preference';
  private readonly renderer: Renderer2;
  private readonly prefersDark: MediaQueryList | null = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;
  private mediaQueryListener?: (event: MediaQueryListEvent) => void;

  private readonly themePreferenceSubject = new BehaviorSubject<ThemePreference>('system');
  readonly themePreference$ = this.themePreferenceSubject.asObservable();

  private readonly currentThemeModeSubject = new BehaviorSubject<ThemeMode>('light');
  readonly currentThemeMode$: Observable<ThemeMode> = this.currentThemeModeSubject.asObservable();

  readonly isDarkMode$: Observable<boolean> = this.currentThemeMode$.pipe(
    map(mode => mode === 'dark')
  );

  constructor(rendererFactory: RendererFactory2, @Inject(DOCUMENT) private document: Document) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.initializeTheme();
    this.listenToSystemChanges();
  }

  ngOnDestroy(): void {
    if (this.prefersDark && this.mediaQueryListener) {
      if (typeof this.prefersDark.removeEventListener === 'function') {
        this.prefersDark.removeEventListener('change', this.mediaQueryListener);
      } else {
        this.prefersDark.removeListener(this.mediaQueryListener);
      }
    }
  }

  /**
   * Establece la preferencia de tema del usuario
   */
  async setPreference(preference: ThemePreference): Promise<void> {
    this.themePreferenceSubject.next(preference);
    await Preferences.set({ key: this.STORAGE_KEY, value: preference });
    this.applyTheme(this.resolveTheme(preference));
  }

  /**
   * Alterna entre light y dark (no afecta 'system')
   */
  async toggle(): Promise<void> {
    const current = this.getCurrentThemeMode();
    const newMode: ThemeMode = current === 'dark' ? 'light' : 'dark';
    await this.setPreference(newMode);
  }

  /**
   * Retorna la preferencia guardada (light, dark, system)
   */
  getCurrentPreference(): ThemePreference {
    return this.themePreferenceSubject.value;
  }

  /**
   * Retorna el tema actual resuelto (light o dark)
   */
  getCurrentThemeMode(): ThemeMode {
    return this.currentThemeModeSubject.value;
  }

  /**
   * Retorna true si el tema actual es oscuro
   */
  isDarkMode(): boolean {
    return this.getCurrentThemeMode() === 'dark';
  }

  private async initializeTheme(): Promise<void> {
    const storedPreference = await Preferences.get({ key: this.STORAGE_KEY });
    const preference = this.isValidPreference(storedPreference.value) 
      ? storedPreference.value as ThemePreference 
      : 'system';
    this.themePreferenceSubject.next(preference);
    this.applyTheme(this.resolveTheme(preference));
  }

  private listenToSystemChanges(): void {
    if (!this.prefersDark) {
      return;
    }

    this.mediaQueryListener = (event: MediaQueryListEvent) => {
      if (this.themePreferenceSubject.value === 'system') {
        this.applyTheme(event.matches ? 'dark' : 'light');
      }
    };

    if (typeof this.prefersDark.addEventListener === 'function') {
      this.prefersDark.addEventListener('change', this.mediaQueryListener);
    } else {
      this.prefersDark.addListener(this.mediaQueryListener);
    }
  }

  private applyTheme(mode: ThemeMode): void {
    const body = this.document?.body;
    const root = this.document?.documentElement;
    if (!body || !root) {
      return;
    }

    // Actualizar subject del tema actual
    this.currentThemeModeSubject.next(mode);

    // Añadir clase para transición suave
    this.renderer.addClass(body, 'theme-transition');

    if (mode === 'dark') {
      this.renderer.addClass(body, 'dark-theme');
      this.renderer.removeClass(body, 'light-theme');
      this.renderer.addClass(body, 'dark');
    } else {
      this.renderer.addClass(body, 'light-theme');
      this.renderer.removeClass(body, 'dark-theme');
      this.renderer.removeClass(body, 'dark');
    }

    this.renderer.setAttribute(body, 'data-color-theme', mode);
    this.renderer.setAttribute(root, 'data-color-theme', mode);

    // Remover clase de transición después de la animación
    setTimeout(() => {
      this.renderer.removeClass(body, 'theme-transition');
    }, 300);
  }

  private resolveTheme(preference: ThemePreference): ThemeMode {
    if (preference === 'system') {
      return this.prefersDark?.matches ? 'dark' : 'light';
    }

    return preference;
  }

  private isValidPreference(value: string | null | undefined): value is ThemePreference {
    return value === 'light' || value === 'dark' || value === 'system';
  }
}
