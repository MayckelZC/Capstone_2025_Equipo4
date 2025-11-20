# 🚨 PASOS CRÍTICOS PARA ANDROID STUDIO

## ⚠️ IMPORTANTE: La app antigua `io.ionic.starter` debe eliminarse completamente

Los logs muestran que el sistema Android todavía está intentando acceder a `io.ionic.starter`. Esto causa conflictos con el nuevo package `com.mayckel.patitasencasapp`.

---

## 📱 PASO 1: Eliminar la App Antigua del Dispositivo/Emulador

### Opción A: Desde el Dispositivo/Emulador
1. Abre el cajón de aplicaciones
2. Busca "PatitasEnCasAPP" o cualquier app con ícono de Ionic
3. Mantén presionado y selecciona "Desinstalar"
4. **Confirma la desinstalación**

### Opción B: Desde Android Studio
1. En Android Studio, ve a: **Run** > **Edit Configurations**
2. En la ventana que se abre, busca la sección **General**
3. En **Installation Options**, selecciona:
   - ☑ **"Always install with package manager"**
4. Aplica y cierra

Luego, desde la terminal de Android Studio (View > Tool Windows > Terminal):
```bash
# Para emulador
adb -e uninstall io.ionic.starter

# Para dispositivo físico
adb -d uninstall io.ionic.starter
```

---

## 🔧 PASO 2: Limpiar Android Studio

### 2.1 Invalidar Caché (CRÍTICO)
1. **File** > **Invalidate Caches...**
2. Marca todas las opciones:
   - ☑ Clear file system cache and Local History
   - ☑ Clear VCS Log caches and indexes
   - ☑ Clear downloaded shared indexes
3. Click en **"Invalidate and Restart"**
4. **Espera a que Android Studio reinicie completamente**

### 2.2 Limpiar el Proyecto
Después del reinicio:
1. **Build** > **Clean Project**
2. Espera a que termine (verás en la barra inferior)
3. **Build** > **Rebuild Project**
4. Espera a que termine (puede tardar 2-3 minutos)

---

## 📦 PASO 3: Verificar Configuración de Gradle

### 3.1 Sync Gradle
1. Click en el ícono de elefante 🐘 en la barra superior ("Sync Project with Gradle Files")
2. O presiona: **Ctrl+Shift+O** (Windows) / **Cmd+Shift+O** (Mac)
3. Espera a que termine la sincronización

### 3.2 Verificar Build Variants
1. Ve a: **View** > **Tool Windows** > **Build Variants**
2. Asegúrate que esté en **"debug"** para pruebas

---

## ▶️ PASO 4: Ejecutar la Aplicación

### 4.1 Seleccionar Dispositivo
1. En la barra superior, selecciona tu emulador/dispositivo
2. Si no aparece, inicia tu emulador desde AVD Manager

### 4.2 Ejecutar
1. Click en el botón **Run** ▶️ (verde)
2. O presiona **Shift+F10**

### 4.3 Observar la Instalación
En la ventana **Run** (parte inferior), deberías ver:
```
Installing APK: /path/to/app-debug.apk
Success
Launching 'MainActivity'
Success
```

---

## 🔍 PASO 5: Verificar en Logcat

### 5.1 Abrir Logcat
1. **View** > **Tool Windows** > **Logcat**
2. En el filtro, selecciona tu dispositivo

### 5.2 Filtrar por Package
En el campo de búsqueda de Logcat, escribe:
```
package:com.mayckel.patitasencasapp
```

### 5.3 Buscar Errores
- ❌ Si ves: `io.ionic.starter` → La app antigua no se desinstaló correctamente
- ✅ Si ves: `com.mayckel.patitasencasapp` → Todo bien
- ❌ Si ves: `Cannot find module` → Hay un problema con el build

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Problema 1: "Channel is unrecoverably broken"
**Solución:**
```bash
# En terminal de Android Studio
adb kill-server
adb start-server
adb devices
```
Luego reinicia el emulador.

### Problema 2: Sigue apareciendo `io.ionic.starter`
**Solución:**
1. Detén el emulador completamente
2. Ve a: **Tools** > **AVD Manager**
3. Click en **▼** (menú) del emulador > **Wipe Data**
4. Confirma y reinicia el emulador
5. Vuelve a instalar la app

### Problema 3: "Failed to open APK"
**Solución:**
```bash
# En terminal del proyecto (PowerShell)
Remove-Item -Path "android\app\build" -Recurse -Force
npx cap sync android
```
Luego en Android Studio: **Build** > **Rebuild Project**

### Problema 4: La app se instala pero pantalla en blanco
**Solución:**
1. Abre Chrome en tu PC
2. Ve a: `chrome://inspect/#devices`
3. Busca tu dispositivo y la app
4. Click en **"inspect"**
5. Revisa la consola de JavaScript para errores
6. Si ves errores de módulos, ejecuta:
   ```powershell
   Remove-Item -Path "www" -Recurse -Force
   ionic build --prod
   npx cap sync android
   ```

---

## ✅ VERIFICACIÓN FINAL

La aplicación está funcionando correctamente si:
- ✅ Se instala sin errores
- ✅ El splash screen aparece
- ✅ La interfaz de usuario se muestra
- ✅ En Logcat aparece: `com.mayckel.patitasencasapp`
- ✅ No hay errores en la consola de JavaScript (Chrome inspect)

---

## 📞 Si Nada Funciona

Ejecuta en PowerShell desde el directorio del proyecto:
```powershell
# Limpieza extrema
Remove-Item -Path "www" -Recurse -Force
Remove-Item -Path "android\app\build" -Recurse -Force
Remove-Item -Path "node_modules\.cache" -Recurse -Force

# Reconstruir todo
ionic build --prod
npx cap sync android

# Verificar que no haya rutas absolutas
$mainJs = Get-ChildItem "www\main.*.js" | Get-Content -Raw
if ($mainJs -match "C:/Users/") {
    Write-Host "❌ ERROR: Hay rutas absolutas en el build" -ForegroundColor Red
} else {
    Write-Host "✅ Build correcto" -ForegroundColor Green
}
```

Luego abre Android Studio con: `npx cap open android`

---

## ✅ CHECKLIST FINAL

Antes de ejecutar en Android Studio, verifica:

- [ ] Archivo `android/app/src/main/res/values/strings.xml` tiene `com.mayckel.patitasencasapp`
- [ ] Archivo `android/app/build.gradle` tiene `com.mayckel.patitasencasapp`
- [ ] No existe directorio `android/app/src/main/java/io/ionic/starter`
- [ ] Existe archivo `android/app/src/main/java/com/mayckel/patitasencasapp/MainActivity.java`
- [ ] Directorio `android/app/build` fue eliminado
- [ ] Ejecutaste `npx cap sync android` exitosamente
- [ ] El archivo `www/main.*.js` NO contiene rutas absolutas de Windows

### Comandos de Verificación Rápida

```powershell
# Verificar que no haya rutas absolutas en el build
$mainJs = Get-ChildItem "www\main.*.js" | Get-Content -Raw
if ($mainJs -match "C:/Users/") {
    Write-Host "❌ ERROR: Rutas absolutas detectadas" -ForegroundColor Red
} else {
    Write-Host "✅ Build limpio" -ForegroundColor Green
}

# Verificar package ID en strings.xml
$strings = Get-Content "android\app\src\main\res\values\strings.xml" -Raw
if ($strings -match "io.ionic.starter") {
    Write-Host "❌ ERROR: Package antiguo detectado" -ForegroundColor Red
} else {
    Write-Host "✅ Package correcto" -ForegroundColor Green
}
```

---

**Última actualización:** 15 de Noviembre, 2025  
**Estado:** ✅ Todos los archivos corregidos - Listo para probar 🚀
