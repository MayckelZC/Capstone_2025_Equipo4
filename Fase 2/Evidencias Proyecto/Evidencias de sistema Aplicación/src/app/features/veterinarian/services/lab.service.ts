import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Observable, firstValueFrom } from 'rxjs';
import { map, finalize } from 'rxjs/operators';
import { LoggerService } from '@core/services/logger.service';
import { LabResult, LabTestResult, LabTestType, COMMON_LAB_PARAMETERS } from '../models/lab-results.interface';

@Injectable({
    providedIn: 'root'
})
export class LabService {
    private readonly COLLECTION = 'lab-results';

    constructor(
        private firestore: AngularFirestore,
        private storage: AngularFireStorage,
        private logger: LoggerService
    ) { }

    /**
     * Crear nuevo resultado de laboratorio
     */
    async createLabResult(result: Omit<LabResult, 'id' | 'createdAt'>): Promise<string> {
        try {
            const docRef = await this.firestore.collection(this.COLLECTION).add({
                ...result,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            this.logger.info(`Lab result created: ${docRef.id}`);
            return docRef.id;
        } catch (error) {
            this.logger.error('Error creating lab result:', error);
            throw error;
        }
    }

    /**
     * Obtener resultados de laboratorio por mascota
     */
    getLabResultsByPet(petId: string): Observable<LabResult[]> {
        return this.firestore.collection<LabResult>(this.COLLECTION, ref =>
            ref.where('petId', '==', petId)
                .orderBy('resultDate', 'desc')
        ).valueChanges({ idField: 'id' });
    }

    /**
     * Obtener resultados de laboratorio por cita
     */
    getLabResultsByAppointment(appointmentId: string): Observable<LabResult[]> {
        return this.firestore.collection<LabResult>(this.COLLECTION, ref =>
            ref.where('appointmentId', '==', appointmentId)
        ).valueChanges({ idField: 'id' });
    }

    /**
     * Obtener un resultado específico
     */
    async getLabResultById(id: string): Promise<LabResult | null> {
        try {
            const doc = await firstValueFrom(
                this.firestore.collection(this.COLLECTION).doc(id).get()
            );
            if (doc.exists) {
                return { id: doc.id, ...doc.data() as LabResult };
            }
            return null;
        } catch (error) {
            this.logger.error('Error getting lab result:', error);
            return null;
        }
    }

    /**
     * Actualizar resultado de laboratorio
     */
    async updateLabResult(id: string, updates: Partial<LabResult>): Promise<void> {
        try {
            await this.firestore.collection(this.COLLECTION).doc(id).update({
                ...updates,
                updatedAt: new Date()
            });
            this.logger.info(`Lab result updated: ${id}`);
        } catch (error) {
            this.logger.error('Error updating lab result:', error);
            throw error;
        }
    }

    /**
     * Eliminar resultado de laboratorio
     */
    async deleteLabResult(id: string): Promise<void> {
        try {
            await this.firestore.collection(this.COLLECTION).doc(id).delete();
            this.logger.info(`Lab result deleted: ${id}`);
        } catch (error) {
            this.logger.error('Error deleting lab result:', error);
            throw error;
        }
    }

    /**
     * Subir archivo adjunto (PDF, imagen)
     */
    async uploadAttachment(resultId: string, file: File): Promise<string> {
        const path = `lab-results/${resultId}/${Date.now()}_${file.name}`;
        const ref = this.storage.ref(path);
        const task = this.storage.upload(path, file);

        await firstValueFrom(task.snapshotChanges().pipe(finalize(() => { })));
        const downloadURL = await firstValueFrom(ref.getDownloadURL());

        // Agregar URL al resultado
        const result = await this.getLabResultById(resultId);
        if (result) {
            const attachments = result.attachments || [];
            attachments.push(downloadURL);
            await this.updateLabResult(resultId, { attachments });
        }

        return downloadURL;
    }

    /**
     * Evaluar si un valor está dentro del rango normal
     */
    evaluateResult(value: number, min: number, max: number): 'normal' | 'low' | 'high' | 'critical' {
        const criticalLow = min * 0.7;
        const criticalHigh = max * 1.3;

        if (value < criticalLow || value > criticalHigh) {
            return 'critical';
        } else if (value < min) {
            return 'low';
        } else if (value > max) {
            return 'high';
        }
        return 'normal';
    }

    /**
     * Obtener parámetros comunes por tipo de análisis
     */
    getCommonParameters(testType: LabTestType, species: 'dog' | 'cat'): Array<{ name: string; unit: string; min: number; max: number }> {
        const params: Array<{ name: string; unit: string; min: number; max: number }> = [];

        if (testType === 'hematology') {
            COMMON_LAB_PARAMETERS.hematology.parameters.forEach(p => {
                const range = species === 'dog' ? p.dogRange : p.catRange;
                params.push({ name: p.name, unit: p.unit, min: range.min, max: range.max });
            });
        } else if (testType === 'biochemistry') {
            COMMON_LAB_PARAMETERS.biochemistry.parameters.forEach(p => {
                const range = species === 'dog' ? p.dogRange : p.catRange;
                params.push({ name: p.name, unit: p.unit, min: range.min, max: range.max });
            });
        }

        return params;
    }

    /**
     * Generar resultados vacíos para un tipo de análisis
     */
    generateEmptyResults(testType: LabTestType, species: 'dog' | 'cat'): LabTestResult[] {
        const params = this.getCommonParameters(testType, species);
        return params.map(p => ({
            parameter: p.name,
            value: '',
            unit: p.unit,
            referenceRange: { min: p.min, max: p.max },
            status: 'normal' as const
        }));
    }

    /**
     * Obtener estadísticas de resultados
     */
    async getResultStats(petId: string): Promise<{ total: number; pending: number; critical: number }> {
        try {
            const snapshot = await firstValueFrom(
                this.firestore.collection(this.COLLECTION, ref =>
                    ref.where('petId', '==', petId)
                ).get()
            );

            let pending = 0;
            let critical = 0;

            snapshot.docs.forEach(doc => {
                const data = doc.data() as LabResult;
                if (data.status === 'pending' || data.status === 'in_progress') {
                    pending++;
                }
                if (data.results?.some(r => r.status === 'critical')) {
                    critical++;
                }
            });

            return { total: snapshot.docs.length, pending, critical };
        } catch (error) {
            this.logger.error('Error getting result stats:', error);
            return { total: 0, pending: 0, critical: 0 };
        }
    }
}
