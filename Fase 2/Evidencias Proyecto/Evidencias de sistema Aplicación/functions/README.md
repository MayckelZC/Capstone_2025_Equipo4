# Cloud Functions para PatitasEnCasAPP

Este directorio contiene las Firebase Cloud Functions que manejan el envío automático de emails durante el proceso de adopción.

## 📧 Funciones Implementadas

### 1. `onAdoptionRequestCreated`
**Trigger:** Cuando se crea un documento en `adoption-requests`  
**Acción:** Envía un email al dueño de la mascota notificándole que alguien está interesado en adoptarla.

### 2. `onAdoptionRequestRejected`
**Trigger:** Cuando una solicitud cambia su estado a `rejected`  
**Acción:** Envía un email al solicitante informándole que su solicitud no fue aprobada.

### 3. `onAdoptionCompleted`
**Trigger:** Cuando una solicitud cambia su estado a `completed`  
**Acción:** Envía emails tanto al adoptante (felicitándolo por su nueva mascota) como al dueño anterior (agradeciéndole por facilitar la adopción).

## 🚀 Instalación y Configuración

### 1. Instalar dependencias

```bash
cd functions
npm install
```

### 2. Configurar credenciales de email

Las funciones usan Gmail por defecto. Para configurar tus credenciales:

#### Opción A: Usar Gmail con App Password (Recomendado)

1. Ve a tu [cuenta de Google](https://myaccount.google.com/)
2. Ve a **Seguridad** > **Verificación en dos pasos** (debes activarla)
3. Ve a **Contraseñas de aplicaciones**
4. Genera una nueva contraseña de aplicación para "Correo"
5. Configura en Firebase:

```bash
firebase functions:config:set email.user="tu-email@gmail.com"
firebase functions:config:set email.password="tu-app-password-generado"
firebase functions:config:set email.from="PatitasEnCasAPP <noreply@patitasencas.app>"
firebase functions:config:set app.url="https://patitasencas.app"
```

#### Opción B: Usar otro servicio de email (SendGrid, Mailgun, etc.)

Edita `src/email-config.ts` y cambia el transporter:

```typescript
return nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: emailConfig.password // Tu API key de SendGrid
  }
});
```

### 3. Verificar configuración

```bash
# Ver la configuración actual
firebase functions:config:get

# Debería mostrar algo como:
# {
#   "email": {
#     "user": "tu-email@gmail.com",
#     "password": "xxxx",
#     "from": "PatitasEnCasAPP <noreply@patitasencas.app>"
#   },
#   "app": {
#     "url": "https://patitasencas.app"
#   }
# }
```

### 4. Probar localmente (Opcional)

```bash
# Descargar la configuración para emuladores
firebase functions:config:get > .runtimeconfig.json

# Iniciar emuladores
npm run serve
```

### 5. Desplegar a producción

```bash
# Compilar TypeScript
npm run build

# Desplegar solo las funciones
firebase deploy --only functions

# O desplegar funciones específicas
firebase deploy --only functions:onAdoptionRequestCreated
```

## 🧪 Pruebas

### Probar envío de email manualmente

Puedes crear un documento de prueba en Firestore para disparar las funciones:

```javascript
// En la consola de Firebase o tu app
db.collection('adoption-requests').add({
  petId: 'test-pet-id',
  applicantId: 'test-user-id',
  applicantName: 'Juan Pérez',
  status: 'pending',
  requestDate: new Date(),
  creatorId: 'owner-user-id'  // El dueño de la mascota
});
```

### Ver logs

```bash
# Ver logs en tiempo real
firebase functions:log

# Filtrar por función específica
firebase functions:log --only onAdoptionRequestCreated
```

## 📝 Estructura de Archivos

```
functions/
├── src/
│   ├── index.ts           # Funciones principales
│   └── email-config.ts    # Configuración y templates de email
├── .eslintrc.js          # Configuración de linting
├── .gitignore
├── package.json
└── tsconfig.json
```

## 🎨 Personalizar Templates de Email

Los templates HTML están en `src/email-config.ts`. Puedes personalizarlos editando el objeto `emailTemplates`:

```typescript
export const emailTemplates = {
  adoptionRequestCreated: (data) => ({
    subject: `Nueva solicitud para ${data.petName}`,
    html: `
      <!-- Tu HTML personalizado aquí -->
    `
  }),
  // ...
};
```

## 🐛 Troubleshooting

### Error: "Email transporter not configured"
- Verifica que hayas configurado las variables de entorno con `firebase functions:config:set`
- En desarrollo local, asegúrate de tener el archivo `.runtimeconfig.json`

### Los emails no llegan
1. Verifica los logs: `firebase functions:log`
2. Revisa tu carpeta de spam
3. Verifica que la App Password de Gmail sea correcta
4. Asegúrate de que el email del usuario esté configurado en Firestore

### Error de compilación TypeScript
```bash
cd functions
npm install
npm run build
```

## 💰 Costos

Firebase Functions tiene un plan gratuito generoso:
- **2 millones de invocaciones/mes** gratis
- **400,000 GB-segundos** de tiempo de cómputo gratis
- **200,000 CPU-segundos** gratis

Para una app con tráfico moderado, es probable que te mantengas en el plan gratuito.

## 🔐 Seguridad

- ✅ Las credenciales de email están en Firebase Config (no en el código)
- ✅ Las funciones solo se ejecutan en eventos específicos de Firestore
- ✅ Validación de datos antes de enviar emails
- ✅ Manejo de errores para evitar crasheos

## 📚 Recursos

- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Nodemailer Documentation](https://nodemailer.com/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)

---

**¿Necesitas ayuda?** Abre un issue en el repositorio del proyecto.
