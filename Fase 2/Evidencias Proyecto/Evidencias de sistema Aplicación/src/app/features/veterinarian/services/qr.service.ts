import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { firstValueFrom } from 'rxjs';
import { LoggerService } from '@core/services/logger.service';

export interface QRCheckInData {
    appointmentId: string;
    petId: string;
    petName: string;
    ownerEmail: string;
    date: string;
    time: string;
    timestamp: number;
    signature: string;
}

@Injectable({
    providedIn: 'root'
})
export class QrService {
    private readonly SECRET_KEY = 'patitas_qr_v1';

    constructor(
        private firestore: AngularFirestore,
        private logger: LoggerService
    ) { }

    /**
     * Generar datos para código QR de una cita
     */
    generateQRData(appointment: any): string {
        const data: QRCheckInData = {
            appointmentId: appointment.id,
            petId: appointment.petId,
            petName: appointment.petName,
            ownerEmail: appointment.userEmail,
            date: new Date(appointment.date).toISOString().split('T')[0],
            time: new Date(appointment.date).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            }),
            timestamp: Date.now(),
            signature: this.generateSignature(appointment.id)
        };

        return btoa(JSON.stringify(data));
    }

    /**
     * Decodificar y validar QR escaneado
     */
    async decodeAndValidateQR(qrContent: string): Promise<{ valid: boolean; data?: QRCheckInData; error?: string }> {
        try {
            const decoded = JSON.parse(atob(qrContent)) as QRCheckInData;

            // Validar firma
            const expectedSignature = this.generateSignature(decoded.appointmentId);
            if (decoded.signature !== expectedSignature) {
                return { valid: false, error: 'Código QR inválido' };
            }

            // Verificar que la cita existe
            const appointmentDoc = await firstValueFrom(
                this.firestore.collection('veterinaryAppointments').doc(decoded.appointmentId).get()
            );

            if (!appointmentDoc.exists) {
                return { valid: false, error: 'Cita no encontrada' };
            }

            const appointment: any = appointmentDoc.data();

            // Verificar que la cita es para hoy
            const qrDate = new Date(decoded.date);
            const today = new Date();
            if (qrDate.toDateString() !== today.toDateString()) {
                return { valid: false, error: 'El código QR no es válido para hoy' };
            }

            // Verificar que no esté ya completada
            if (appointment.status === 'completada') {
                return { valid: false, error: 'Esta cita ya fue completada' };
            }

            return { valid: true, data: decoded };
        } catch (error) {
            this.logger.error('Error decoding QR:', error);
            return { valid: false, error: 'No se pudo leer el código QR' };
        }
    }

    /**
     * Realizar check-in de cita
     */
    async performCheckIn(appointmentId: string): Promise<boolean> {
        try {
            await this.firestore.collection('veterinaryAppointments').doc(appointmentId).update({
                status: 'en_consulta',
                checkedInAt: new Date(),
                checkedInVia: 'qr'
            });

            this.logger.info(`Check-in realizado para cita ${appointmentId}`);
            return true;
        } catch (error) {
            this.logger.error('Error performing check-in:', error);
            return false;
        }
    }

    /**
     * Generar firma para verificación
     */
    private generateSignature(appointmentId: string): string {
        // Firma simple basada en el ID y la clave secreta
        const data = `${appointmentId}-${this.SECRET_KEY}`;
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }
}
