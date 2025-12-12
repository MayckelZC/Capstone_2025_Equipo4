/**
 * Configuración de email para las notificaciones de adopción
 * 
 * Para configurar en Firebase:
 * firebase functions:config:set email.user="tu-email@gmail.com"
 * firebase functions:config:set email.password="tu-app-password"
 * firebase functions:config:set email.from="PatitasEnCasAPP <noreply@patitasencas.app>"
 * firebase functions:config:set app.url="https://patitasencas.app"
 */
          body { font - family: Arial, sans - serif; line - height: 1.6; color: #333; }
          .container { max - width: 600px; margin: 0 auto; padding: 20px; }
          .header {
  background: linear - gradient(135deg, #10B981 0 %, #059669 100 %);
  color: white; padding: 30px; text - align: center; border - radius: 10px 10px 0 0;
}
          .content { background: #f9fafb; padding: 30px; border - radius: 0 0 10px 10px; }
          .button {
  display: inline - block; padding: 12px 24px; background: #10B981;
  color: white; text - decoration: none; border - radius: 6px; margin: 20px 0;
}
          .footer { text - align: center; margin - top: 30px; color: #6b7280; font - size: 14px; }
          .celebration { font - size: 48px; text - align: center; margin: 20px 0; }
          .tips { background: #dcfce7; padding: 15px; border - radius: 6px; margin: 15px 0; }
          h1 { margin: 0; font - size: 24px; }
          h2 { color: #059669; }
</style>
  </head>
  < body >
  <div class="container" >
    <div class="header" >
      <h1>¡Adopción Completada! 🎉</h1>
        </div>
        < div class="content" >
          ${
            data.isAdopter ? `
              <div class="celebration">🐾❤️🏠</div>
              <p>¡Felicidades <strong>${data.recipientName}</strong>!</p>
              
              <p>Has completado exitosamente la adopción de <strong>${data.petName}</strong>. 
              ¡Ahora es oficialmente parte de tu familia!</p>
              
              <div class="tips">
                <h2>Consejos importantes:</h2>
                <ul>
                  <li><strong>Salud:</strong> Mantén al día sus vacunas y desparasitaciones</li>
                  <li><strong>Veterinario:</strong> Programa visitas regulares para chequeos</li>
                  <li><strong>Alimentación:</strong> Proporciona una dieta balanceada y agua fresca</li>
                  <li><strong>Ejercicio:</strong> Asegúrate de que tenga actividad física diaria</li>
                  <li><strong>Amor:</strong> Dale mucho cariño y paciencia durante la adaptación</li>
                </ul>
              </div>
              
              <p>Recuerda que nuestra plataforma también incluye un módulo veterinario donde puedes:</p>
              <ul>
                <li>Agendar citas con veterinarios</li>
                <li>Llevar el registro de vacunas</li>
                <li>Guardar su historial médico</li>
              </ul>
              
              <center>
                <a href="${data.appUrl}/veterinarian" class="button">
                  Explorar Módulo Veterinario
                </a>
              </center>
            ` : `
              <p>Hola <strong>${data.recipientName}</strong>,</p>
              
              <p>¡La adopción de <strong>${data.petName}</strong> se ha completado exitosamente!</p>
              
              <p>Gracias por usar PatitasEnCasAPP para facilitar esta adopción responsable. 
              Gracias a ti, ${data.petName} ha encontrado un hogar amoroso.</p>
              
              <p>Tu contribución ayuda a crear un mundo mejor para las mascotas. ¡Sigue usando nuestra plataforma 
              para ayudar a más animales a encontrar su hogar!</p>
              
              <center>
                <a href="${data.appUrl}/home" class="button">
                  Ver Más Mascotas
                </a>
              </center>
            `}

<p>¡Gracias por ser parte de PatitasEnCasAPP! 🐾</p>
  </div>
  < div class="footer" >
    <p>Este es un email automático de PatitasEnCasAPP </p>
      < p > Ayudando a mascotas a encontrar un hogar 🏠❤️</p>
        </div>
        </div>
        </body>
        </html>
          `,
    }),
};
