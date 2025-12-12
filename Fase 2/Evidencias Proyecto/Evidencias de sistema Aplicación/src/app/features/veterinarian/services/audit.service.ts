import { Injectable } from '@angular/core';
import { LoggerService } from '@core/services/logger.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '@core/services/auth.service';

export interface AuditEntry {
  id?: string;
  recordId: string;
  recordType: 'medical-record' | 'appointment' | 'patient';
  action: 'created' | 'updated' | 'deleted' | 'viewed';
  userId!: string;
  userName: string;
  userRole: string;
  timestamp: Date;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    location?: string;
  };
  petId?: string;
  petName?: string;
}

export interface MedicalRecordHistory {
  id?: string;
  originalRecordId: string;
  version: number;
  petId!: string;
  petName: string;
  veterinarianId: string;
  veterinarianName: string;
  date: Date;
  type: string;
  diagnosis: string;
  treatment: string;
  notes?: string;
  vaccines?: string[];
  weight?: number;
  temperature?: number;
  nextAppointment?: Date;
  modifiedBy: string;
  modifiedAt: Date;
  changeReason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuditService {

  constructor(
    private firestore: AngularFirestore,
    private authService: AuthService
  ) {}

  /**
   * Registrar acción en el audit trail
   */
  async logAuditEntry(entry: Omit<AuditEntry, 'id' | 'userId' | 'userName' | 'userRole' | 'timestamp'>): Promise<void> {
    try {
      const user = await this.authService.getCurrentUser();
      if (!user) return;

      const userDoc = await this.firestore.doc(`users/${user.uid}`).get().toPromise();
      const userData = userDoc?.data() as any;

      const auditEntry: AuditEntry = {
        ...entry,
        userId: user.uid,
        userName: userData?.displayName || user.email || 'Unknown',
        userRole: userData?.role || 'user',
        timestamp: new Date(),
        metadata: {
          userAgent: navigator.userAgent
        }
      };

      await this.firestore.collection('audit-trail').add(auditEntry);
    } catch (error) {
      this.logger.error('Error logging audit entry:', error);
      // No lanzar error para no interrumpir la operación principal
    }
  }

  /**
   * Guardar versión histórica de registro médico
   */
  async saveMedicalRecordHistory(
    originalRecord: any,
    recordId: string,
    changeReason?: string
  ): Promise<void> {
    try {
      const user = await this.authService.getCurrentUser();
      if (!user) return;

      // Obtener versión actual
      const historyDocs = await this.firestore
        .collection('medical-records-history', ref =>
          ref.where('originalRecordId', '==', recordId)
            .orderBy('version', 'desc')
            .limit(1)
        )
        .get()
        .toPromise();

      const currentVersion = historyDocs && !historyDocs.empty
        ? (historyDocs.docs[0].data() as MedicalRecordHistory).version
        : 0;

      const historyEntry: MedicalRecordHistory = {
        originalRecordId: recordId,
        version: currentVersion + 1,
        petId: originalRecord.petId,
        petName: originalRecord.petName,
        veterinarianId: originalRecord.veterinarianId,
        veterinarianName: originalRecord.veterinarianName,
        date: originalRecord.date,
        type: originalRecord.type,
        diagnosis: originalRecord.diagnosis,
        treatment: originalRecord.treatment,
        notes: originalRecord.notes,
        vaccines: originalRecord.vaccines,
        weight: originalRecord.weight,
        temperature: originalRecord.temperature,
        nextAppointment: originalRecord.nextAppointment,
        modifiedBy: user.uid,
        modifiedAt: new Date(),
        changeReason
      };

      await this.firestore.collection('medical-records-history').add(historyEntry);

      // Registrar en audit trail
      await this.logAuditEntry({
        recordId,
        recordType: 'medical-record',
        action: 'updated',
        petId: originalRecord.petId,
        petName: originalRecord.petName
      });
    } catch (error) {
      this.logger.error('Error saving medical record history:', error);
    }
  }

  /**
   * Obtener historial de un registro médico
   */
  getMedicalRecordHistory(recordId: string): Observable<MedicalRecordHistory[]> {
    return this.firestore
      .collection<MedicalRecordHistory>('medical-records-history', ref =>
        ref.where('originalRecordId', '==', recordId)
          .orderBy('version', 'desc')
      )
      .valueChanges({ idField: 'id' })
      .pipe(
        map(history => history.map(h => ({
          ...h,
          date: this.toDate(h.date),
          modifiedAt: this.toDate(h.modifiedAt),
          nextAppointment: h.nextAppointment ? this.toDate(h.nextAppointment) : undefined
        })))
      );
  }

  /**
   * Obtener audit trail de un registro
   */
  getAuditTrail(recordId: string, recordType?: string): Observable<AuditEntry[]> {
    return this.firestore
      .collection<AuditEntry>('audit-trail', ref => {
        let query: any = ref.where('recordId', '==', recordId);
        if (recordType) {
          query = query.where('recordType', '==', recordType);
        }
        return query.orderBy('timestamp', 'desc').limit(50);
      })
      .valueChanges({ idField: 'id' })
      .pipe(
        map(entries => entries.map(entry => ({
          ...entry,
          timestamp: this.toDate(entry.timestamp)
        })))
      );
  }

  /**
   * Obtener audit trail por usuario
   */
  getUserAuditTrail(userId: string, limit: number = 100): Observable<AuditEntry[]> {
    return this.firestore
      .collection<AuditEntry>('audit-trail', ref =>
        ref.where('userId', '==', userId)
          .orderBy('timestamp', 'desc')
          .limit(limit)
      )
      .valueChanges({ idField: 'id' })
      .pipe(
        map(entries => entries.map(entry => ({
          ...entry,
          timestamp: this.toDate(entry.timestamp)
        })))
      );
  }

  /**
   * Obtener audit trail por mascota
   */
  getPetAuditTrail(petId: string): Observable<AuditEntry[]> {
    return this.firestore
      .collection<AuditEntry>('audit-trail', ref =>
        ref.where('petId', '==', petId)
          .orderBy('timestamp', 'desc')
      )
      .valueChanges({ idField: 'id' })
      .pipe(
        map(entries => entries.map(entry => ({
          ...entry,
          timestamp: this.toDate(entry.timestamp)
        })))
      );
  }

  /**
   * Registrar cambios específicos
   */
  async logChanges(
    recordId: string,
    recordType: 'medical-record' | 'appointment' | 'patient',
    oldData: any,
    newData: any,
    petId?: string,
    petName?: string
  ): Promise<void> {
    const changes: { field: string; oldValue: any; newValue: any }[] = [];

    // Comparar campos y detectar cambios
    const allKeys = new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]);
    
    allKeys.forEach(key => {
      if (oldData[key] !== newData[key]) {
        changes.push({
          field: key,
          oldValue: oldData[key],
          newValue: newData[key]
        });
      }
    });

    if (changes.length > 0) {
      await this.logAuditEntry({
        recordId,
        recordType,
        action: 'updated',
        changes,
        petId,
        petName
      });
    }
  }

  /**
   * Registrar visualización de registro
   */
  async logRecordView(
    recordId: string,
    recordType: 'medical-record' | 'appointment' | 'patient',
    petId?: string,
    petName?: string
  ): Promise<void> {
    await this.logAuditEntry({
      recordId,
      recordType,
      action: 'viewed',
      petId,
      petName
    });
  }

  /**
   * Registrar creación de registro
   */
  async logRecordCreation(
    recordId: string,
    recordType: 'medical-record' | 'appointment' | 'patient',
    petId?: string,
    petName?: string
  ): Promise<void> {
    await this.logAuditEntry({
      recordId,
      recordType,
      action: 'created',
      petId,
      petName
    });
  }

  /**
   * Registrar eliminación de registro
   */
  async logRecordDeletion(
    recordId: string,
    recordType: 'medical-record' | 'appointment' | 'patient',
    petId?: string,
    petName?: string
  ): Promise<void> {
    await this.logAuditEntry({
      recordId,
      recordType,
      action: 'deleted',
      petId,
      petName
    });
  }

  /**
   * Obtener estadísticas de auditoría
   */
  async getAuditStatistics(startDate: Date, endDate: Date): Promise<{
    totalActions: number;
    actionsByType: Record<string, number>;
    actionsByUser: Record<string, number>;
    topUsers: { userName: string; count: number }[];
  }> {
    try {
      const entries = await this.firestore
        .collection<AuditEntry>('audit-trail', ref =>
          ref.where('timestamp', '>=', startDate)
            .where('timestamp', '<=', endDate)
        )
        .get()
        .toPromise();

      const actionsByType: Record<string, number> = {};
      const actionsByUser: Record<string, number> = {};

      entries?.docs.forEach(doc => {
        const data = doc.data() as AuditEntry;
        
        // Por tipo de acción
        const action = data.action;
        actionsByType[action] = (actionsByType[action] || 0) + 1;

        // Por usuario
        const user = data.userName;
        actionsByUser[user] = (actionsByUser[user] || 0) + 1;
      });

      const topUsers = Object.entries(actionsByUser)
        .map(([userName, count]) => ({ userName, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        totalActions: entries?.size || 0,
        actionsByType,
        actionsByUser,
        topUsers
      };
    } catch (error) {
      this.logger.error('Error getting audit statistics:', error);
      return {
        totalActions: 0,
        actionsByType: {},
        actionsByUser: {},
        topUsers: []
      };
    }
  }

  /**
   * Convertir timestamp de Firestore a Date
   */
  private toDate(value: any): Date {
    if (value instanceof Date) {
      return value;
    }
    if (value?.toDate) {
      return value.toDate();
    }
    if (value?.seconds) {
      return new Date(value.seconds * 1000);
    }
    return new Date(value);
  }
}
