# Script PowerShell para ejecutar Lighthouse Audit en PatitasEnCasAPP
# Autor: Sistema de Testing Automático
# Fecha: 10 de Noviembre, 2025

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   LIGHTHOUSE AUDIT - PatitasEnCasAPP   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si el servidor está corriendo
Write-Host "Verificando servidor en http://localhost:8080..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Servidor está corriendo" -ForegroundColor Green
} catch {
    Write-Host "❌ Servidor NO está corriendo" -ForegroundColor Red
    Write-Host "Ejecuta primero:" -ForegroundColor Yellow
    Write-Host "  cd www" -ForegroundColor White
    Write-Host "  http-server -p 8080" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "OPCIÓN 1: Lighthouse en Chrome DevTools" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Se abrirá Chrome en http://localhost:8080" -ForegroundColor White
Write-Host "2. Presiona F12 para abrir DevTools" -ForegroundColor White
Write-Host "3. Ve a la pestaña 'Lighthouse'" -ForegroundColor White
Write-Host "4. Selecciona:" -ForegroundColor White
Write-Host "   ✅ Performance" -ForegroundColor Gray
Write-Host "   ✅ Accessibility" -ForegroundColor Gray
Write-Host "   ✅ Best Practices" -ForegroundColor Gray
Write-Host "   ✅ SEO" -ForegroundColor Gray
Write-Host "   ✅ PWA" -ForegroundColor Gray
Write-Host "5. Device: 📱 Mobile" -ForegroundColor White
Write-Host "6. Click 'Analyze page load'" -ForegroundColor White
Write-Host "7. Exporta el reporte con el botón ⬇️" -ForegroundColor White
Write-Host ""

$choice = Read-Host "¿Abrir Chrome ahora? (S/N)"

if ($choice -eq "S" -or $choice -eq "s") {
    Write-Host ""
    Write-Host "🚀 Abriendo Chrome..." -ForegroundColor Green
    Start-Process "chrome" "http://localhost:8080"
    Write-Host ""
    Write-Host "✅ Chrome abierto. Sigue las instrucciones." -ForegroundColor Green
    Write-Host ""
    Write-Host "Presiona Enter cuando hayas terminado el análisis..." -ForegroundColor Yellow
    Read-Host
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESULTADOS ESPERADOS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Performance:      >90 (Excelente)" -ForegroundColor White
Write-Host "♿ Accessibility:    >90 (Excelente)" -ForegroundColor White
Write-Host "✅ Best Practices:   >90 (Excelente)" -ForegroundColor White
Write-Host "🔍 SEO:              >85 (Bueno)" -ForegroundColor White
Write-Host "📱 PWA:              >80 (Bueno)" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 TIPS:" -ForegroundColor Yellow
Write-Host "- Toma screenshots de los resultados" -ForegroundColor Gray
Write-Host "- Exporta el reporte HTML" -ForegroundColor Gray
Write-Host "- Guárdalo en la carpeta del proyecto" -ForegroundColor Gray
Write-Host "- Inclúyelo en tu presentación" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ Proceso completado!" -ForegroundColor Green
Write-Host ""
