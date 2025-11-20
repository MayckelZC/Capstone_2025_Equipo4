# Script de Verificación Pre-Ejecución
# Ejecuta este script antes de abrir Android Studio
# PowerShell script

Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  VERIFICACIÓN PRE-EJECUCIÓN - PatitasEnCasAPP Android" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "`n"

$allOk = $true

# 1. Verificar que existe el directorio www
Write-Host "📁 Verificando directorio www..." -NoNewline
if (Test-Path "www") {
    Write-Host " ✅ OK" -ForegroundColor Green
} else {
    Write-Host " ❌ FALTA" -ForegroundColor Red
    Write-Host "   → Ejecuta: ionic build --prod" -ForegroundColor Yellow
    $allOk = $false
}

# 2. Verificar que existe index.html
Write-Host "📄 Verificando www/index.html..." -NoNewline
if (Test-Path "www\index.html") {
    Write-Host " ✅ OK" -ForegroundColor Green
} else {
    Write-Host " ❌ FALTA" -ForegroundColor Red
    $allOk = $false
}

# 3. Verificar que no hay rutas absolutas en main.js
Write-Host "🔍 Verificando rutas absolutas en build..." -NoNewline
$mainJsFiles = Get-ChildItem "www\main.*.js" -ErrorAction SilentlyContinue
if ($mainJsFiles) {
    $mainJs = $mainJsFiles | Get-Content -Raw
    if ($mainJs -match "C:/Users/") {
        Write-Host " ❌ ERROR" -ForegroundColor Red
        Write-Host "   → Hay rutas absolutas de Windows en el código" -ForegroundColor Yellow
        Write-Host "   → Ejecuta: Remove-Item www -Recurse -Force; ionic build --prod" -ForegroundColor Yellow
        $allOk = $false
    } else {
        Write-Host " ✅ OK" -ForegroundColor Green
    }
} else {
    Write-Host " ❌ No encontrado" -ForegroundColor Red
    $allOk = $false
}

# 4. Verificar package ID en strings.xml
Write-Host "📦 Verificando package ID..." -NoNewline
if (Test-Path "android\app\src\main\res\values\strings.xml") {
    $strings = Get-Content "android\app\src\main\res\values\strings.xml" -Raw
    if ($strings -match "io.ionic.starter") {
        Write-Host " ❌ ANTIGUO" -ForegroundColor Red
        Write-Host "   → Todavía hay referencias a io.ionic.starter" -ForegroundColor Yellow
        $allOk = $false
    } elseif ($strings -match "com.mayckel.patitasencasapp") {
        Write-Host " ✅ OK" -ForegroundColor Green
    } else {
        Write-Host " ⚠️ DESCONOCIDO" -ForegroundColor Yellow
        $allOk = $false
    }
} else {
    Write-Host " ❌ Archivo no encontrado" -ForegroundColor Red
    $allOk = $false
}

# 5. Verificar MainActivity en ubicación correcta
Write-Host "🏗️  Verificando MainActivity..." -NoNewline
if (Test-Path "android\app\src\main\java\com\mayckel\patitasencasapp\MainActivity.java") {
    Write-Host " ✅ OK" -ForegroundColor Green
} else {
    Write-Host " ❌ NO ENCONTRADO" -ForegroundColor Red
    Write-Host "   → Debe estar en: android\app\src\main\java\com\mayckel\patitasencasapp\" -ForegroundColor Yellow
    $allOk = $false
}

# 6. Verificar que no existe el directorio antiguo
Write-Host "🗑️  Verificando directorio antiguo..." -NoNewline
if (Test-Path "android\app\src\main\java\io\ionic\starter") {
    Write-Host " ⚠️ EXISTE (debe eliminarse)" -ForegroundColor Yellow
    Write-Host "   → Ejecuta: Remove-Item android\app\src\main\java\io -Recurse -Force" -ForegroundColor Yellow
    $allOk = $false
} else {
    Write-Host " ✅ OK (eliminado)" -ForegroundColor Green
}

# 7. Verificar capacitor.config.ts
Write-Host "⚙️  Verificando capacitor.config.ts..." -NoNewline
if (Test-Path "capacitor.config.ts") {
    $config = Get-Content "capacitor.config.ts" -Raw
    if ($config -match "com.mayckel.patitasencasapp") {
        Write-Host " ✅ OK" -ForegroundColor Green
    } else {
        Write-Host " ⚠️ Revisar appId" -ForegroundColor Yellow
        $allOk = $false
    }
} else {
    Write-Host " ❌ No encontrado" -ForegroundColor Red
    $allOk = $false
}

# 8. Verificar que android/app/build no existe (debe regenerarse)
Write-Host "🔨 Verificando limpieza de build..." -NoNewline
if (Test-Path "android\app\build") {
    Write-Host " ⚠️ Existe (recomendado eliminar)" -ForegroundColor Yellow
    Write-Host "   → Ejecuta: Remove-Item android\app\build -Recurse -Force" -ForegroundColor Yellow
} else {
    Write-Host " ✅ OK (limpio)" -ForegroundColor Green
}

# Resultado final
Write-Host "`n"
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan

if ($allOk) {
    Write-Host "  ✅ TODO ESTÁ LISTO PARA ANDROID STUDIO" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "`n"
    Write-Host "Próximos pasos:" -ForegroundColor Yellow
    Write-Host "1. Abre Android Studio: npx cap open android" -ForegroundColor White
    Write-Host "2. Desinstala la app antigua (io.ionic.starter)" -ForegroundColor White
    Write-Host "3. File → Invalidate Caches → Invalidate and Restart" -ForegroundColor White
    Write-Host "4. Build → Clean Project" -ForegroundColor White
    Write-Host "5. Build → Rebuild Project" -ForegroundColor White
    Write-Host "6. Run ▶️" -ForegroundColor White
    Write-Host "`n"
    Write-Host "📖 Ver: PASOS_ANDROID_STUDIO.md para instrucciones detalladas" -ForegroundColor Cyan
} else {
    Write-Host "  ⚠️ HAY PROBLEMAS QUE NECESITAN CORRECCIÓN" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "`n"
    Write-Host "Por favor, corrige los problemas marcados arriba antes de continuar." -ForegroundColor Yellow
    Write-Host "`n"
    Write-Host "Comandos rápidos de corrección:" -ForegroundColor Cyan
    Write-Host "  # Limpiar y reconstruir todo" -ForegroundColor White
    Write-Host "  Remove-Item www, android\app\build -Recurse -Force" -ForegroundColor Gray
    Write-Host "  ionic build --prod" -ForegroundColor Gray
    Write-Host "  npx cap sync android" -ForegroundColor Gray
    Write-Host "`n"
    Write-Host "  # Ejecutar este script de nuevo" -ForegroundColor White
    Write-Host "  .\verificar-android.ps1" -ForegroundColor Gray
}

Write-Host "`n"
