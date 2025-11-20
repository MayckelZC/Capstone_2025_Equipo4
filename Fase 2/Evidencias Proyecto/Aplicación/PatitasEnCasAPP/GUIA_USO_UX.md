# 🎨 Guía de Uso: Mejoras de UX

## 🚀 Quick Start

Esta guía te mostrará cómo usar las nuevas mejoras de UX implementadas en PatitasEnCasAPP.

---

## 📚 Tabla de Contenidos

1. [Dark Mode Toggle](#1-dark-mode-toggle)
2. [Skeleton Screens](#2-skeleton-screens)
3. [Animaciones](#3-animaciones)
4. [Efectos Hover](#4-efectos-hover)
5. [Loading States](#5-loading-states)

---

## 1. Dark Mode Toggle

### Uso Básico

#### Añadir el toggle a tu página

```html
<ion-header>
  <ion-toolbar>
    <ion-title>Mi Página</ion-title>
    <ion-buttons slot="end">
      <app-theme-toggle></app-theme-toggle>
    </ion-buttons>
  </ion-toolbar>
</ion-header>
```

#### Controlar el tema programáticamente

```typescript
import { ThemeService } from './services/theme.service';

export class MyComponent {
  constructor(private themeService: ThemeService) {}

  // Alternar tema
  toggleTheme() {
    this.themeService.toggle();
  }

  // Establecer tema específico
  setDarkMode() {
    this.themeService.setPreference('dark');
  }

  setLightMode() {
    this.themeService.setPreference('light');
  }

  setSystemMode() {
    this.themeService.setPreference('system');
  }

  // Obtener tema actual
  getCurrentTheme() {
    return this.themeService.getCurrentThemeMode(); // 'light' | 'dark'
  }

  // Suscribirse a cambios
  ngOnInit() {
    this.themeService.isDarkMode$.subscribe(isDark => {
      console.log('Dark mode activo:', isDark);
      // Ejecutar lógica específica según el tema
    });
  }
}
```

---

## 2. Skeleton Screens

### Uso Básico

#### Skeleton simple

```html
<div *ngIf="loading" class="skeleton skeleton-text"></div>
<p *ngIf="!loading">Contenido real</p>
```

#### Card de mascota con skeleton

```html
<!-- Mientras carga -->
<ion-card *ngIf="loading">
  <div class="skeleton skeleton-thumbnail"></div>
  <ion-card-header>
    <div class="skeleton skeleton-text skeleton-text-lg"></div>
    <div class="skeleton skeleton-text"></div>
  </ion-card-header>
  <ion-card-content>
    <div class="skeleton skeleton-text"></div>
    <div class="skeleton skeleton-text"></div>
    <div class="skeleton skeleton-text" style="width: 60%;"></div>
  </ion-card-content>
</ion-card>

<!-- Contenido real -->
<ion-card *ngIf="!loading && pet">
  <img [src]="pet.imageUrl">
  <ion-card-header>
    <ion-card-title>{{ pet.name }}</ion-card-title>
    <ion-card-subtitle>{{ pet.breed }}</ion-card-subtitle>
  </ion-card-header>
  <ion-card-content>
    {{ pet.description }}
  </ion-card-content>
</ion-card>
```

#### Lista con skeletons

```html
<ion-list>
  <!-- Skeletons mientras carga -->
  <ion-item *ngFor="let i of [1,2,3,4,5]" [hidden]="!loading">
    <div class="skeleton skeleton-avatar" slot="start"></div>
    <ion-label>
      <div class="skeleton skeleton-text skeleton-text-lg"></div>
      <div class="skeleton skeleton-text"></div>
    </ion-label>
  </ion-item>

  <!-- Datos reales -->
  <ion-item *ngFor="let pet of pets" [hidden]="loading">
    <ion-avatar slot="start">
      <img [src]="pet.imageUrl">
    </ion-avatar>
    <ion-label>
      <h2>{{ pet.name }}</h2>
      <p>{{ pet.breed }}</p>
    </ion-label>
  </ion-item>
</ion-list>
```

### Componente Reutilizable

Usa el componente `pet-skeleton-card` para ahorrar código:

```html
<!-- Página -->
<app-pet-skeleton-card [count]="5" *ngIf="loading"></app-pet-skeleton-card>

<ion-card *ngFor="let pet of pets" [hidden]="loading">
  <!-- Contenido real -->
</ion-card>
```

### Variantes de Skeleton

```html
<!-- Texto pequeño -->
<div class="skeleton skeleton-text skeleton-text-sm"></div>

<!-- Texto normal -->
<div class="skeleton skeleton-text"></div>

<!-- Texto grande -->
<div class="skeleton skeleton-text skeleton-text-lg"></div>

<!-- Avatar circular -->
<div class="skeleton skeleton-avatar"></div>

<!-- Círculo personalizado -->
<div class="skeleton skeleton-circle" style="width: 80px; height: 80px;"></div>

<!-- Thumbnail / imagen -->
<div class="skeleton skeleton-thumbnail"></div>
```

---

## 3. Animaciones

### Clases Disponibles

#### Fade In
```html
<div class="animate-fade-in">
  Aparece suavemente
</div>
```

#### Slide In
```html
<!-- Desde abajo -->
<div class="animate-slide-up">Sube desde abajo</div>

<!-- Desde arriba -->
<div class="animate-slide-down">Baja desde arriba</div>

<!-- Desde izquierda -->
<div class="animate-slide-left">Desde la izquierda</div>

<!-- Desde derecha -->
<div class="animate-slide-right">Desde la derecha</div>
```

#### Scale Up
```html
<div class="animate-scale-up">
  Zoom suave
</div>
```

#### Pulse (continua)
```html
<div class="animate-pulse">
  Pulsación continua
</div>
```

#### Shake (error)
```html
<div class="animate-shake">
  Sacudida
</div>
```

#### Bounce
```html
<div class="animate-bounce">
  Rebote
</div>
```

### Animaciones con Delay

```html
<ion-card class="animate-slide-up">Card 1 (inmediato)</ion-card>
<ion-card class="animate-slide-up animate-delay-100">Card 2 (+0.1s)</ion-card>
<ion-card class="animate-slide-up animate-delay-200">Card 3 (+0.2s)</ion-card>
<ion-card class="animate-slide-up animate-delay-300">Card 4 (+0.3s)</ion-card>
```

### Combinar Animaciones

```html
<ion-card class="animate-fade-in animate-scale-up">
  Aparece con fade y scale
</ion-card>
```

### Ejemplo: Grid animado

```html
<div class="pet-grid">
  <ion-card 
    *ngFor="let pet of pets; let i = index"
    class="animate-slide-up"
    [class.animate-delay-100]="i === 0"
    [class.animate-delay-200]="i === 1"
    [class.animate-delay-300]="i === 2"
    [class.animate-delay-400]="i === 3"
  >
    <!-- Card content -->
  </ion-card>
</div>
```

---

## 4. Efectos Hover

### Hover Lift
```html
<ion-card class="hover-lift">
  Se eleva al pasar el mouse
</ion-card>
```

### Hover Scale
```html
<ion-button class="hover-scale">
  Se agranda al hover
</ion-button>
```

### Hover Glow
```html
<ion-card class="hover-glow">
  Brilla con el color primario
</ion-card>
```

### Hover Brighten
```html
<img class="hover-brighten" src="...">
```

### Cards Interactivas (auto hover)
```html
<ion-card class="card-interactive">
  Incluye hover automático
</ion-card>
```

### Combinar efectos
```html
<ion-card class="hover-lift hover-glow">
  Se eleva Y brilla
</ion-card>
```

---

## 5. Loading States

### Overlay de Carga
```html
<div class="loading-overlay" *ngIf="isLoading">
  <ion-spinner color="primary"></ion-spinner>
</div>
```

```typescript
export class MyPage {
  isLoading = false;

  async loadData() {
    this.isLoading = true;
    try {
      await this.dataService.fetchData();
    } finally {
      this.isLoading = false;
    }
  }
}
```

### Loading con mensaje
```html
<div class="loading-overlay" *ngIf="isLoading">
  <div style="text-align: center; color: white;">
    <ion-spinner color="primary"></ion-spinner>
    <p style="margin-top: 16px;">Cargando mascotas...</p>
  </div>
</div>
```

---

## 🎯 Ejemplos de Páginas Completas

### Página de Home con todo integrado

```typescript
// home.page.ts
export class HomePage implements OnInit {
  loading = true;
  pets: Pet[] = [];

  constructor(
    private petService: PetService,
    private themeService: ThemeService
  ) {}

  async ngOnInit() {
    await this.loadPets();
  }

  async loadPets() {
    this.loading = true;
    try {
      this.pets = await this.petService.getAll();
    } finally {
      this.loading = false;
    }
  }

  async onRefresh(event: any) {
    await this.loadPets();
    event.target.complete();
  }
}
```

```html
<!-- home.page.html -->
<ion-header>
  <ion-toolbar>
    <ion-title>Mascotas</ion-title>
    <ion-buttons slot="end">
      <app-theme-toggle></app-theme-toggle>
    </ion-buttons>
  </ion-toolbar>
</ion-header>

<ion-content>
  <ion-refresher slot="fixed" (ionRefresh)="onRefresh($event)">
    <ion-refresher-content></ion-refresher-content>
  </ion-refresher>

  <!-- Skeleton mientras carga -->
  <div *ngIf="loading" class="pet-grid">
    <ion-card *ngFor="let i of [1,2,3,4,5,6]">
      <div class="skeleton skeleton-thumbnail"></div>
      <ion-card-header>
        <div class="skeleton skeleton-text skeleton-text-lg"></div>
        <div class="skeleton skeleton-text"></div>
      </ion-card-header>
      <ion-card-content>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text"></div>
      </ion-card-content>
    </ion-card>
  </div>

  <!-- Contenido real con animaciones -->
  <div *ngIf="!loading" class="pet-grid">
    <ion-card 
      *ngFor="let pet of pets; let i = index"
      class="card-interactive animate-slide-up"
      [class.animate-delay-100]="i % 3 === 0"
      [class.animate-delay-200]="i % 3 === 1"
      [class.animate-delay-300]="i % 3 === 2"
      [routerLink]="['/detalle', pet.id]"
    >
      <img [src]="pet.imageUrl" [alt]="pet.nombre">
      <ion-card-header>
        <ion-card-title>{{ pet.nombre }}</ion-card-title>
        <ion-card-subtitle>{{ pet.raza }}</ion-card-subtitle>
      </ion-card-header>
      <ion-card-content>
        <p>{{ pet.edad }} años • {{ pet.sexo }}</p>
      </ion-card-content>
    </ion-card>
  </div>

  <!-- Empty state -->
  <div *ngIf="!loading && pets.length === 0" class="empty-state animate-fade-in">
    <ion-icon name="paw" size="large"></ion-icon>
    <p>No hay mascotas disponibles</p>
  </div>
</ion-content>
```

```scss
// home.page.scss
.pet-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  padding: 16px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--ion-color-medium);
  
  ion-icon {
    font-size: 80px;
    margin-bottom: 16px;
    opacity: 0.5;
  }
}
```

---

## 🎨 Tips y Best Practices

### 1. Skeleton Screens
- ✅ Usa skeleton que coincida con el layout final
- ✅ Mantén la misma estructura (no confundas al usuario)
- ✅ Usa anchos variables para texto (70%, 50%, etc.)
- ❌ No uses skeleton para carga instantánea (< 200ms)

### 2. Animaciones
- ✅ Usa animaciones sutiles (0.3s - 0.5s)
- ✅ Respeta `prefers-reduced-motion`
- ✅ No animes TODO, solo elementos importantes
- ❌ Evita animaciones largas (> 1s) en interacciones

### 3. Dark Mode
- ✅ Usa variables CSS (`var(--ion-color-primary)`)
- ✅ Prueba ambos modos en desarrollo
- ✅ Asegúrate de buen contraste en ambos modos
- ❌ No uses colores hardcodeados

### 4. Performance
- ✅ Usa `transform` y `opacity` para animaciones (GPU)
- ✅ Añade `will-change` solo cuando sea necesario
- ✅ Lazy load componentes pesados
- ❌ No animes `width`, `height`, `left`, `top` (layout reflow)

---

## 📱 Testing

### Checklist antes de deployment

- [ ] Theme toggle funciona en todas las páginas
- [ ] Skeleton screens se muestran correctamente
- [ ] Animaciones son suaves (60 FPS)
- [ ] Dark mode se ve bien en toda la app
- [ ] Funciona en iOS y Android
- [ ] Respeta `prefers-reduced-motion`
- [ ] No hay memory leaks al cambiar tema repetidamente

---

## 🆘 Troubleshooting

### El theme toggle no aparece
**Solución:** Asegúrate de importar `SharedComponentsModule` en tu página:
```typescript
import { SharedComponentsModule } from '../components/shared-components.module';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    SharedComponentsModule // ← Añadir esto
  ]
})
```

### Las animaciones no funcionan
**Solución:** Verifica que `global.scss` esté importado en `angular.json`.

### El skeleton no se anima
**Solución:** Verifica que las variables CSS estén definidas en `theme/variables.scss`.

---

## 📚 Recursos Adicionales

- [Documentación completa](./MEJORAS_UX_IMPLEMENTADAS.md)
- [Mejoras sugeridas](./MEJORAS_SUGERIDAS.md)
- [Ionic Documentation](https://ionicframework.com/docs)

---

**¿Preguntas?** Revisa la documentación o crea un issue en el repositorio.
