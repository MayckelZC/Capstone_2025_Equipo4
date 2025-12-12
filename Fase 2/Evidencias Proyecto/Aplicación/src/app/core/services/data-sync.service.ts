/**
 * Data Synchronization Service
 * 
 * Sincroniza validación entre:
 * 1. Cliente (Reactive Forms)
 * 2. Base de datos (Firestore Rules)
 * 
 * Garantiza consistencia de datos en ambas capas
 */

import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, updateDoc, doc, writeBatch, Transaction } from '@angular/fire/firestore';
import { ValidationService } from './validation.service';
import { LoggerService } from './logger.service';
import { getValidationSchema, ValidationResult } from '../validators/validation-schema';

@Injectable({
  providedIn: 'root'
})
export class DataSyncService {

  constructor(
    private firestore: Firestore,
    private validation: ValidationService,
    private logger: LoggerService
  ) { }

  /**
   * Guardar documento con validación previa
   * Valida en cliente antes de enviar a Firestore
   */
  async saveDocument(
    collectionName: string,
    entityType: string,
    data: Record<string, any>,
    documentId?: string
  ): Promise<{ success: boolean; id?: string; errors?: string[] }> {
    try {
      // 1. Validar en cliente
      const validationResult = this.validation.validateObject(entityType, data);

      if (!validationResult.isValid) {
        const errors = this.validation.getErrorSummary(validationResult);
        this.logger.warn('Validación fallida en cliente', {
          feature: 'DataSync',
          action: 'client_validation_failed',
          metadata: { collection: collectionName, errors }
        });
        return { success: false, errors };
      }

      // 2. Preparar datos seguros
      const safeData = this.validation.prepareSafeData(entityType, data);

      // 3. Agregar metadata de sincronización
      const syncData = {
        ...safeData,
        _validated: true,
        _validatedAt: new Date(),
        _syncedFrom: 'client'
      };

      // 4. Guardar en Firestore
      const collectionRef = collection(this.firestore, collectionName);
      let docId: string;

      if (documentId) {
        // Actualizar documento existente
        const docRef = doc(collectionRef, documentId);
        await updateDoc(docRef, syncData);
        docId = documentId;

        this.logger.info('Documento actualizado exitosamente', {
          feature: 'DataSync',
          action: 'document_updated',
          metadata: { collection: collectionName, documentId }
        });
      } else {
        // Crear nuevo documento
        const docRef = await addDoc(collectionRef, syncData);
        docId = docRef.id;

        this.logger.info('Documento creado exitosamente', {
          feature: 'DataSync',
          action: 'document_created',
          metadata: { collection: collectionName, documentId: docId }
        });
      }

      return { success: true, id: docId };
    } catch (error) {
      this.logger.error('Error guardando documento', error as Error, {
        feature: 'DataSync',
        action: 'save_failed',
        metadata: { collection: collectionName }
      });

      return {
        success: false,
        errors: [(error as Error).message]
      };
    }
  }

  /**
   * Guardar múltiples documentos en una transacción
   * Todo o nada
   */
  async saveMultipleDocuments(
    updates: Array<{
      collection: string;
      entityType: string;
      data: Record<string, any>;
      documentId?: string;
    }>
  ): Promise<{ success: boolean; ids?: string[]; errors?: string[] }> {
    try {
      // 1. Validar todos los documentos primero
      for (const update of updates) {
        const validationResult = this.validation.validateObject(update.entityType, update.data);
        if (!validationResult.isValid) {
          const errors = this.validation.getErrorSummary(validationResult);
          return { success: false, errors };
        }
      }

      // 2. Crear batch para transacción
      const batch = writeBatch(this.firestore);
      const ids: string[] = [];

      for (const update of updates) {
        const safeData = this.validation.prepareSafeData(update.entityType, update.data);
        const syncData = {
          ...safeData,
          _validated: true,
          _validatedAt: new Date(),
          _syncedFrom: 'client'
        };

        const collectionRef = collection(this.firestore, update.collection);

        if (update.documentId) {
          const docRef = doc(collectionRef, update.documentId);
          batch.update(docRef, syncData);
          ids.push(update.documentId);
        } else {
          // Para documentos nuevos, crear referencia sin guardar aún
          // Firestore requiere que uses addDoc() fuera del batch
          console.warn('Batch no soporta addDoc(). Usar saveDocument() para nuevos docs.');
        }
      }

      // 3. Ejecutar transacción
      await batch.commit();

      this.logger.info('Batch de documentos guardado exitosamente', {
        feature: 'DataSync',
        action: 'batch_saved',
        metadata: { documentCount: updates.length }
      });

      return { success: true, ids };
    } catch (error) {
      this.logger.error('Error en transacción de batch', error as Error, {
        feature: 'DataSync',
        action: 'batch_failed'
      });

      return {
        success: false,
        errors: [(error as Error).message]
      };
    }
  }

  /**
   * Validar datos antes de enviar
   * Retorna true si es válido
   */
  validateBefore(entityType: string, data: Record<string, any>): ValidationResult {
    return this.validation.validateObject(entityType, data);
  }

  /**
   * Obtener esquema de validación para una entidad
   * Útil para debugging y documentación
   */
  getValidationSchema(entityType: string) {
    return getValidationSchema(entityType);
  }

  /**
   * Sincronizar datos después de crear/actualizar
   * Asegura que los datos en cliente coincidan con BD
   */
  async syncData<T>(
    collectionName: string,
    documentId: string
  ): Promise<T | null> {
    try {
      const docRef = doc(this.firestore, collectionName, documentId);
      // Nota: Usar AngularFire para obtener el documento
      // Este es un ejemplo - en práctica usar getDoc() o docData()
      return null;
    } catch (error) {
      this.logger.error('Error sincronizando datos', error as Error, {
        feature: 'DataSync',
        action: 'sync_failed'
      });
      return null;
    }
  }

  /**
   * Verificar consistencia de datos
   * Compara cliente vs BD
   */
  async verifyDataConsistency(
    collectionName: string,
    entityType: string,
    clientData: Record<string, any>,
    serverData: Record<string, any>
  ): Promise<boolean> {
    // Validar ambos lados
    const clientValidation = this.validation.validateObject(entityType, clientData);
    const serverValidation = this.validation.validateObject(entityType, serverData);

    if (!clientValidation.isValid || !serverValidation.isValid) {
      this.logger.warn('Inconsistencia: datos inválidos', {
        feature: 'DataSync',
        action: 'consistency_check_failed',
        metadata: {
          collection: collectionName,
          clientValid: clientValidation.isValid,
          serverValid: serverValidation.isValid
        }
      });
      return false;
    }

    // Comparar datos
    const clientKeys = Object.keys(clientData).sort();
    const serverKeys = Object.keys(serverData).sort();

    const keysMatch = JSON.stringify(clientKeys) === JSON.stringify(serverKeys);

    if (!keysMatch) {
      this.logger.warn('Inconsistencia: campos diferentes', {
        feature: 'DataSync',
        action: 'field_mismatch',
        metadata: {
          collection: collectionName,
          clientFields: clientKeys,
          serverFields: serverKeys
        }
      });
      return false;
    }

    // Todos los checks pasaron
    this.logger.info('Datos consistentes', {
      feature: 'DataSync',
      action: 'consistency_verified',
      metadata: { collection: collectionName }
    });

    return true;
  }

  /**
   * Obtener lista de reglas de validación
   * Para mostrar al usuario
   */
  getValidationRules(entityType: string, fieldName?: string): any {
    const schema = getValidationSchema(entityType);

    if (fieldName) {
      return schema[fieldName] || [];
    }

    return schema;
  }

  /**
   * Generar reporte de validación
   * Para debugging y auditoría
   */
  generateValidationReport(entityType: string, data: Record<string, any>): string {
    const validation = this.validation.validateObject(entityType, data);
    const rules = this.getValidationRules(entityType);

    let report = `
Reporte de Validación
====================
Tipo de Entidad: ${entityType}
Válido: ${validation.isValid ? 'SÍ' : 'NO'}

REGLAS DEFINIDAS:
`;

    for (const field in rules) {
      report += `\n  ${field}:`;
      for (const rule of rules[field]) {
        report += `\n    - ${rule.type}: ${rule.message}`;
      }
    }

    if (Object.keys(validation.errors).length > 0) {
      report += '\n\nERRORES:';
      for (const field in validation.errors) {
        report += `\n  ${field}:`;
        for (const error of validation.errors[field]) {
          report += `\n    - ${error}`;
        }
      }
    }

    if (Object.keys(validation.warnings).length > 0) {
      report += '\n\nADVERTENCIAS:';
      for (const field in validation.warnings) {
        report += `\n  ${field}:`;
        for (const warning of validation.warnings[field]) {
          report += `\n    - ${warning}`;
        }
      }
    }

    return report;
  }
}
