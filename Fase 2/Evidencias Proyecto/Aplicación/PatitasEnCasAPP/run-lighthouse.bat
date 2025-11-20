@echo off
echo ========================================
echo    LIGHTHOUSE AUDIT - PatitasEnCasAPP
echo ========================================
echo.
echo Tu aplicacion esta corriendo en: http://localhost:8080
echo.
echo INSTRUCCIONES:
echo.
echo 1. Se abrira Google Chrome automaticamente
echo 2. Presiona F12 para abrir DevTools
echo 3. Ve a la pestana "Lighthouse"
echo 4. Selecciona las categorias:
echo    - Performance
echo    - Accessibility
echo    - Best Practices
echo    - SEO
echo    - PWA
echo 5. Selecciona "Mobile" como dispositivo
echo 6. Click en "Analyze page load"
echo 7. Espera los resultados (puede tardar 1-2 minutos)
echo 8. Click en "Download report" para exportar
echo.
echo ========================================
echo.
pause

REM Abrir Chrome con la URL
start chrome http://localhost:8080

echo.
echo Chrome se ha abierto. Sigue las instrucciones de arriba.
echo.
echo Cuando termines, presiona cualquier tecla para continuar...
pause > nul
