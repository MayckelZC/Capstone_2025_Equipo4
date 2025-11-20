# Instrucciones para Lighthouse Audit - PatitasEnCasAPP

## Opción 1: Chrome DevTools (Recomendado - Más Fácil) 🔍

### Paso 1: Servir la Aplicación Build
```powershell
# Instalar http-server globalmente (solo una vez)
npm install -g http-server

# Servir el build de producción
cd www
http-server -p 8080
```

### Paso 2: Abrir en Chrome
1. Abre Google Chrome
2. Navega a: `http://localhost:8080`
3. Presiona `F12` para abrir DevTools
4. Ve a la pestaña **"Lighthouse"** (puede estar en el menú >> More tools)

### Paso 3: Configurar y Ejecutar
1. **Selecciona categorías:**
   - ✅ Performance
   - ✅ Accessibility
   - ✅ Best Practices
   - ✅ SEO
   - ✅ Progressive Web App (PWA)

2. **Selecciona dispositivo:**
   - 📱 Mobile (recomendado para apps Ionic)
   - 💻 Desktop

3. Click en **"Analyze page load"**

### Paso 4: Revisar Resultados
- **Performance**: >90 (Objetivo)
- **Accessibility**: >90 (Objetivo)
- **Best Practices**: >90 (Objetivo)
- **SEO**: >85 (Objetivo)
- **PWA**: >80 (Objetivo)

### Paso 5: Exportar Reporte
1. Click en el ícono de **Download report** (⬇️)
2. Guarda como: `lighthouse-report-PatitasEnCasAPP.html`
3. Incluye este reporte en tu presentación

---

## Opción 2: Lighthouse CLI (Línea de Comandos) 💻

### Instalación
```powershell
npm install -g lighthouse
```

### Ejecutar Audit
```powershell
# Primero, servir la aplicación
cd www
http-server -p 8080

# En otra terminal, ejecutar Lighthouse
lighthouse http://localhost:8080 --output html --output-path ./lighthouse-report.html --chrome-flags="--headless"
```

### Con más opciones
```powershell
# Audit completo para móvil
lighthouse http://localhost:8080 ^
  --output html ^
  --output json ^
  --output-path ./lighthouse-mobile ^
  --emulated-form-factor=mobile ^
  --throttling.cpuSlowdownMultiplier=4

# Audit para desktop
lighthouse http://localhost:8080 ^
  --output html ^
  --output-path ./lighthouse-desktop ^
  --emulated-form-factor=desktop ^
  --preset=desktop
```

---

## Opción 3: Lighthouse CI (Automatizado) 🤖

### Instalación
```powershell
npm install -g @lhci/cli
```

### Configuración
Crear archivo `lighthouserc.json` en la raíz del proyecto:

```json
{
  "ci": {
    "collect": {
      "startServerCommand": "cd www && http-server -p 8080",
      "url": ["http://localhost:8080"],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.9}],
        "categories:accessibility": ["warn", {"minScore": 0.9}],
        "categories:best-practices": ["warn", {"minScore": 0.9}],
        "categories:seo": ["warn", {"minScore": 0.85}]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

### Ejecutar
```powershell
lhci autorun
```

---

## Opción 4: Firebase Hosting + Lighthouse 🔥

Si tu app está desplegada en Firebase:

```powershell
# Desplegar a Firebase
firebase deploy --only hosting

# Ejecutar Lighthouse en la URL desplegada
lighthouse https://tu-app.web.app --output html --output-path ./lighthouse-production.html
```

---

## Interpretación de Resultados

### 🟢 Performance (Rendimiento)
- **First Contentful Paint (FCP)**: < 1.8s (bueno)
- **Largest Contentful Paint (LCP)**: < 2.5s (bueno)
- **Total Blocking Time (TBT)**: < 200ms (bueno)
- **Cumulative Layout Shift (CLS)**: < 0.1 (bueno)
- **Speed Index**: < 3.4s (bueno)

### 🟢 Accessibility (Accesibilidad)
- Contraste de colores adecuado
- Etiquetas ARIA correctas
- Navegación por teclado funcional
- Textos alternativos en imágenes

### 🟢 Best Practices (Mejores Prácticas)
- HTTPS habilitado
- Sin errores de consola
- Imágenes con aspect ratio correcto
- APIs modernas

### 🟢 SEO
- Meta tags presentes
- Títulos descriptivos
- Estructura HTML semántica
- Sitemap.xml

### 🟢 PWA (Progressive Web App)
- Service Worker instalado
- Manifest.json configurado
- Funciona offline
- Instalable

---

## Mejoras Comunes para Ionic/Angular

### 1. Optimizar Imágenes
```typescript
// En angular.json, agregar optimización
"optimization": {
  "scripts": true,
  "styles": true,
  "fonts": true
}
```

### 2. Lazy Loading (Ya implementado ✅)
```typescript
// Tus rutas ya usan loadChildren
{
  path: 'home',
  loadChildren: () => import('./pages/home/home.module').then(m => m.HomePageModule)
}
```

### 3. Reducir Bundle Size
```powershell
# Analizar bundle
npx webpack-bundle-analyzer www/stats.json
```

### 4. Preload Estratégico
```typescript
// En app-routing.module.ts
import { PreloadAllModules } from '@angular/router';

RouterModule.forRoot(routes, {
  preloadingStrategy: PreloadAllModules
})
```

---

## Checklist para Presentación

- [ ] Ejecutar Lighthouse en modo Mobile
- [ ] Ejecutar Lighthouse en modo Desktop
- [ ] Capturar screenshot de resultados
- [ ] Exportar reporte HTML
- [ ] Documentar métricas principales
- [ ] Identificar áreas de mejora
- [ ] Incluir en presentación PowerPoint

---

## Comandos Rápidos

```powershell
# Build + Lighthouse en un solo flujo
npx ng build --configuration production
cd www
http-server -p 8080 &
lighthouse http://localhost:8080 --output html --output-path ../lighthouse-report.html --view
```

---

## Troubleshooting

### Error: "Chrome no encontrado"
```powershell
# Especificar ruta de Chrome
lighthouse http://localhost:8080 --chrome-path="C:\Program Files\Google\Chrome\Application\chrome.exe"
```

### Error: "Puerto 8080 en uso"
```powershell
# Usar otro puerto
http-server -p 8081
lighthouse http://localhost:8081
```

### Warning: Budget excedido
```
Warning: bundle initial exceeded maximum budget. Budget 2.10 MB was not met by 331.67 kB
```
**Solución**: Revisar angular.json y aumentar budgets o optimizar imports.

---

## Recursos Adicionales

- [Lighthouse Documentation](https://developer.chrome.com/docs/lighthouse)
- [Web.dev Measure](https://web.dev/measure/)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [Firebase Performance Monitoring](https://firebase.google.com/docs/perf-mon)

---

**Fecha de generación**: 10 de Noviembre, 2025  
**Proyecto**: PatitasEnCasAPP  
**Build**: Production (www/)
