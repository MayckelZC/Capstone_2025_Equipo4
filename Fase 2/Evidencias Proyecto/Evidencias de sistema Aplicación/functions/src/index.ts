/**
 * Cloud Functions para PatitasEnCasAPP
 * 
 * Estas funciones se ejecutan automáticamente en respuesta a eventos de Firestore
 * y envían emails a los usuarios en momentos clave del proceso de adopción.
 */

import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { createEmailTransporter, emailTemplates, getAppConfig } from "./email-config";

// Inicializar Firebase Admin
admin.initializeApp();

/**
 * 1. TRIGGER: Nueva solicitud de adopción creada
 * 
 * Se ejecuta cuando se crea un nuevo documento en la colección 'adoption-requests'
 * Envía un email al dueño de la mascota notificándole de la nueva solicitud
 */
export const onAdoptionRequestCreated = functions.firestore
    .document("adoption-requests/{requestId}")
    .onCreate(async (snapshot: functions.firestore.DocumentSnapshot, context: functions.EventContext) => {
        const requestData = snapshot.data();
        const transporter = createEmailTransporter();

        // Si no hay configuración de email, solo logueamos
        if (!transporter) {
            console.log("Email transporter not configured. Skipping email notification.");
            return null;
        }

        try {
            // 1. Obtener datos de la mascota
            const petDoc = await admin.firestore().doc(`mascotas/${requestData.petId}`).get();
            if (!petDoc.exists) {
                console.error("Pet not found:", requestData.petId);
                return null;
            }
            const petData = petDoc.data();

            // 2. Obtener datos del dueño de la mascota
            const ownerId = petData?.creadorId || requestData.creatorId;
            if (!ownerId) {
                console.error("Owner ID not found in pet data");
                return null;
            }

            const ownerDoc = await admin.firestore().doc(`users/${ownerId}`).get();
            if (!ownerDoc.exists) {
                console.error("Owner not found:", ownerId);
                return null;
            }
            const ownerData = ownerDoc.data();

            // 3. Verificar que el dueño tenga email
            if (!ownerData?.email) {
                console.log("Owner does not have an email address");
                return null;
            }

            // 4. Preparar el email
            const appConfig = getAppConfig();
            const emailContent = emailTemplates.adoptionRequestCreated({
                ownerName: ownerData.nombreCompleto || ownerData.nombre || "Usuario",
                petName: petData?.nombre || "tu mascota",
                applicantName: requestData.applicantName || "Un usuario",
                requestId: context.params.requestId,
                appUrl: appConfig.url,
            });

            // 5. Enviar el email
            await transporter.sendMail({
                from: functions.config().email?.from || "PatitasEnCasAPP <noreply@patitasencas.app>",
                to: ownerData.email,
                subject: emailContent.subject,
                html: emailContent.html,
            });

            console.log(`Adoption request notification email sent to ${ownerData.email}`);
            return null;
        } catch (error) {
            console.error("Error sending adoption request email:", error);
            // No lanzamos error para no bloquear la creación de la solicitud
            return null;
        }
    });

/**
 * 2. TRIGGER: Solicitud de adopción rechazada
 * 
 * Se ejecuta cuando una solicitud cambia su estado a 'rejected'
 * Envía un email al solicitante informándole del rechazo
 */
export const onAdoptionRequestRejected = functions.firestore
    .document("adoption-requests/{requestId}")
    .onUpdate(async (change: functions.Change<functions.firestore.DocumentSnapshot>, context: functions.EventContext) => {
        const beforeData = change.before.data();
        const afterData = change.after.data();
        const transporter = createEmailTransporter();

        // Solo ejecutar si cambió a 'rejected' y no era 'rejected' antes
        if (beforeData.status !== "rejected" && afterData.status === "rejected") {
            if (!transporter) {
                console.log("Email transporter not configured. Skipping email notification.");
                return null;
            }

            try {
                // 1. Obtener datos de la mascota
                const petDoc = await admin.firestore().doc(`mascotas/${afterData.petId}`).get();
                if (!petDoc.exists) {
                    console.error("Pet not found:", afterData.petId);
                    return null;
                }
                const petData = petDoc.data();

                // 2. Obtener datos del solicitante
                const applicantDoc = await admin.firestore().doc(`users/${afterData.applicantId}`).get();
                if (!applicantDoc.exists) {
                    console.error("Applicant not found:", afterData.applicantId);
                    return null;
                }
                const applicantData = applicantDoc.data();

                // 3. Verificar que el solicitante tenga email
                if (!applicantData?.email) {
                    console.log("Applicant does not have an email address");
                    return null;
                }

                // 4. Preparar el email
                const appConfig = getAppConfig();
                const emailContent = emailTemplates.adoptionRequestRejected({
                    applicantName: applicantData.nombreCompleto || applicantData.nombre || "Usuario",
                    petName: petData?.nombre || "la mascota",
                    appUrl: appConfig.url,
                });

                // 5. Enviar el email
                await transporter.sendMail({
                    from: functions.config().email?.from || "PatitasEnCasAPP <noreply@patitasencas.app>",
                    to: applicantData.email,
                    subject: emailContent.subject,
                    html: emailContent.html,
                });

                console.log(`Rejection notification email sent to ${applicantData.email}`);
                return null;
            } catch (error) {
                console.error("Error sending rejection email:", error);
                return null;
            }
        }

        return null;
    });

/**
 * 3. TRIGGER: Adopción completada
 * 
 * Se ejecuta cuando una solicitud cambia su estado a 'completed'
 * Envía emails tanto al adoptante como al dueño anterior
 */
export const onAdoptionCompleted = functions.firestore
    .document("adoption-requests/{requestId}")
    .onUpdate(async (change: functions.Change<functions.firestore.DocumentSnapshot>, context: functions.EventContext) => {
        const beforeData = change.before.data();
        const afterData = change.after.data();
        const transporter = createEmailTransporter();

        // Solo ejecutar si cambió a 'completed' y no era 'completed' antes
        if (beforeData.status !== "completed" && afterData.status === "completed") {
            if (!transporter) {
                console.log("Email transporter not configured. Skipping email notification.");
                return null;
            }

            try {
                // 1. Obtener datos de la mascota
                const petDoc = await admin.firestore().doc(`mascotas/${afterData.petId}`).get();
                if (!petDoc.exists) {
                    console.error("Pet not found:", afterData.petId);
                    return null;
                }
                const petData = petDoc.data();

                // 2. Obtener datos del adoptante (nuevo dueño)
                const adopterDoc = await admin.firestore().doc(`users/${afterData.applicantId}`).get();
                const adopterData = adopterDoc.exists ? adopterDoc.data() : null;

                // 3. Obtener datos del dueño anterior
                const previousOwnerId = petData?.previousOwnerId || petData?.creadorId || afterData.creatorId;
                const ownerDoc = await admin.firestore().doc(`users/${previousOwnerId}`).get();
                const ownerData = ownerDoc.exists ? ownerDoc.data() : null;

                const appConfig = getAppConfig();

                // 4. Enviar email al adoptante
                if (adopterData?.email) {
                    const adopterEmailContent = emailTemplates.adoptionCompleted({
                        recipientName: adopterData.nombreCompleto || adopterData.nombre || "Usuario",
                        petName: petData?.nombre || "tu nueva mascota",
                        isAdopter: true,
                        appUrl: appConfig.url,
                    });

                    await transporter.sendMail({
                        from: functions.config().email?.from || "PatitasEnCasAPP <noreply@patitasencas.app>",
                        to: adopterData.email,
                        subject: adopterEmailContent.subject,
                        html: adopterEmailContent.html,
                    });

                    console.log(`Completion email sent to adopter: ${adopterData.email}`);
                }

                // 5. Enviar email al dueño anterior
                if (ownerData?.email) {
                    const ownerEmailContent = emailTemplates.adoptionCompleted({
                        recipientName: ownerData.nombreCompleto || ownerData.nombre || "Usuario",
                        petName: petData?.nombre || "la mascota",
                        isAdopter: false,
                        appUrl: appConfig.url,
                    });

                    await transporter.sendMail({
                        from: functions.config().email?.from || "PatitasEnCasAPP <noreply@patitasencas.app>",
                        to: ownerData.email,
                        subject: ownerEmailContent.subject,
                        html: ownerEmailContent.html,
                    });

                    console.log(`Completion email sent to previous owner: ${ownerData.email}`);
                }

                return null;
            } catch (error) {
                console.error("Error sending completion emails:", error);
                return null;
            }
        }

        return null;
    });

/**
 * BONUS: Función para enviar email de bienvenida cuando se registra un nuevo usuario
 * (Opcional - puedes activarla descomentándola)
 */
/*
export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  const transporter = createEmailTransporter();

  if (!transporter || !user.email) {
    return null;
  }

  try {
    const appConfig = getAppConfig();

    await transporter.sendMail({
      from: functions.config().email?.from || "PatitasEnCasAPP <noreply@patitasencas.app>",
      to: user.email,
      subject: "¡Bienvenido a PatitasEnCasAPP! 🐾",
      html: `
        <h1>¡Bienvenido a PatitasEnCasAPP!</h1>
        <p>Hola ${user.displayName || ""}!</p>
        <p>Gracias por unirte a nuestra comunidad dedicada a ayudar a las mascotas a encontrar un hogar.</p>
        <p>Puedes empezar a explorar mascotas disponibles o publicar una mascota en adopción.</p>
        <a href="${appConfig.url}/home">Ir a la aplicación</a>
      `,
    });

    console.log(`Welcome email sent to ${user.email}`);
  } catch (error) {
    console.error("Error sending welcome email:", error);
  }

  return null;
});
*/
