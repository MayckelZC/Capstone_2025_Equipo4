@echo off
REM Script de configuración rápida para Firebase Functions
REM Execute: configure-functions.bat

echo ========================================
echo  Configuración de Firebase Functions
echo  PatitasEnCasAPP - Email Notifications
echo ========================================
echo.

echo Este script te ayudará a configurar las variables necesarias para las Cloud Functions.
echo.

REM Solicitar credenciales de email
set /p EMAIL_USER="Ingresa tu email de Gmail: "
set /p EMAIL_PASSWORD="Ingresa tu App Password de Gmail: "
set /p EMAIL_FROM="Email 'from' (ej: PatitasEnCasAPP ^<noreply@patitasencas.app^>): "
set /p APP_URL="URL de tu aplicación (ej: https://patitasencas.app): "

echo.
echo Configurando variables en Firebase Functions...
echo.

REM Configurar en Firebase
firebase functions:config:set email.user="%EMAIL_USER%"
firebase functions:config:set email.password="%EMAIL_PASSWORD%"
firebase functions:config:set email.from="%EMAIL_FROM%"
firebase functions:config:set app.url="%APP_URL%"

echo.
echo ✅ Configuración completada!
echo.
echo Para ver la configuración actual ejecuta:
echo   firebase functions:config:get
echo.
echo Para desplegarfunciones ejecuta:
echo   cd functions
echo   npm run build
echo   firebase deploy --only functions
echo.
pause
