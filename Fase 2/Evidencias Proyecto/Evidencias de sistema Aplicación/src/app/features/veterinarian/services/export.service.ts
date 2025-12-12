import { Injectable } from '@angular/core';
import { LoggerService } from '@core/services/logger.service';
import { AppointmentCard, MedicalRecord } from '../models/veterinarian.interfaces';
import { ErrorHandlerService } from './error-handler.service';
import { SUCCESS_MESSAGES } from '../constants/veterinarian.constants';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor(private errorHandler: ErrorHandlerService, private logger: LoggerService) { }

  /**
   * Exportar citas a CSV
   */
  async exportAppointmentsToCSV(appointments: AppointmentCard[], filename: string = 'citas'): Promise<void> {
    try {
      const headers = [
        'ID',
        'Fecha',
        'Hora',
        'Mascota',
        'Dueño',
        'Teléfono',
        'Email',
        'Motivo',
        'Estado',
        'Prioridad',
        'Veterinario',
        'Notas'
      ];

      const rows = appointments.map(apt => [
        apt.id,
        new Date(apt.date).toLocaleDateString('es-ES'),
        new Date(apt.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        apt.petName || '',
        apt.ownerName || '',
        apt.ownerPhone || '',
        apt.ownerEmail || '',
        apt.reason || '',
        this.translateStatus(apt.status),
        this.translatePriority(apt.priority),
        apt.veterinarianName || '',
        apt.notes || ''
      ]);

      const csvContent = this.convertToCSV([headers, ...rows]);
      const timestamp = new Date().toISOString().split('T')[0];
      this.downloadCSV(csvContent, `${filename}_${timestamp}.csv`);

      await this.errorHandler.showSuccessToast(SUCCESS_MESSAGES.DATA_EXPORTED);
    } catch (error) {
      this.logger.error('Error exporting appointments:', error);
      await this.errorHandler.showErrorToast('Error al exportar citas');
    }
  }

  /**
   * Exportar registros médicos a CSV
   */
  async exportMedicalRecordsToCSV(records: MedicalRecord[], filename: string = 'registros_medicos'): Promise<void> {
    try {
      const headers = [
        'ID',
        'Fecha',
        'Mascota',
        'Veterinario',
        'Tipo',
        'Diagnóstico',
        'Tratamiento',
        'Peso (kg)',
        'Temperatura (°C)',
        'Vacunas',
        'Próxima Cita',
        'Notas'
      ];

      const rows = records.map(rec => [
        rec.id,
        new Date(rec.date).toLocaleDateString('es-ES'),
        rec.petName || '',
        rec.veterinarianName || '',
        this.translateRecordType(rec.type),
        rec.diagnosis || '',
        rec.treatment || '',
        rec.weight?.toString() || '',
        rec.temperature?.toString() || '',
        rec.vaccines?.join('; ') || '',
        rec.nextAppointment ? new Date(rec.nextAppointment).toLocaleDateString('es-ES') : '',
        rec.notes || ''
      ]);

      const csvContent = this.convertToCSV([headers, ...rows]);
      const timestamp = new Date().toISOString().split('T')[0];
      this.downloadCSV(csvContent, `${filename}_${timestamp}.csv`);

      await this.errorHandler.showSuccessToast(SUCCESS_MESSAGES.DATA_EXPORTED);
    } catch (error) {
      this.logger.error('Error exporting medical records:', error);
      await this.errorHandler.showErrorToast('Error al exportar registros médicos');
    }
  }

  /**
   * Exportar reporte de estadísticas a CSV
   */
  async exportStatisticsToCSV(
    data: { label: string; value: number | string }[],
    filename: string = 'estadisticas'
  ): Promise<void> {
    try {
      const headers = ['Métrica', 'Valor'];
      const rows = data.map(item => [item.label, item.value.toString()]);

      const csvContent = this.convertToCSV([headers, ...rows]);
      const timestamp = new Date().toISOString().split('T')[0];
      this.downloadCSV(csvContent, `${filename}_${timestamp}.csv`);

      await this.errorHandler.showSuccessToast(SUCCESS_MESSAGES.DATA_EXPORTED);
    } catch (error) {
      this.logger.error('Error exporting statistics:', error);
      await this.errorHandler.showErrorToast('Error al exportar estadísticas');
    }
  }

  /**
   * Convertir array 2D a formato CSV
   */
  private convertToCSV(data: string[][]): string {
    return data.map(row =>
      row.map(cell => {
        // Escapar comillas y envolver en comillas si contiene coma, salto de línea o comilla
        const cellStr = cell?.toString() || '';
        if (cellStr.includes(',') || cellStr.includes('\n') || cellStr.includes('"')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    ).join('\n');
  }

  /**
   * Descargar archivo CSV
   */
  private downloadCSV(content: string, filename: string): void {
    // Agregar BOM UTF-8 para correcta visualización en Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Traducir estado de cita
   */
  private translateStatus(status: string): string {
    const translations: Record<string, string> = {
      'pending': 'Pendiente',
      'confirmed': 'Confirmada',
      'in_progress': 'En Progreso',
      'completed': 'Completada',
      'cancelled': 'Cancelada'
    };
    return translations[status] || status;
  }

  /**
   * Traducir prioridad
   */
  private translatePriority(priority: string): string {
    const translations: Record<string, string> = {
      'low': 'Baja',
      'medium': 'Media',
      'high': 'Alta',
      'critical': 'Crítica'
    };
    return translations[priority] || priority;
  }

  /**
   * Traducir tipo de registro médico
   */
  private translateRecordType(type: string): string {
    const translations: Record<string, string> = {
      'checkup': 'Chequeo General',
      'vaccine': 'Vacunación',
      'surgery': 'Cirugía',
      'emergency': 'Emergencia',
      'treatment': 'Tratamiento',
      'followup': 'Seguimiento'
    };
    return translations[type] || type;
  }

  /**
   * Exportar múltiples hojas en un solo archivo (como TSV con separadores)
   */
  async exportMultiSheetReport(
    appointments: AppointmentCard[],
    records: MedicalRecord[],
    statistics: { label: string; value: number | string }[],
    filename: string = 'reporte_completo'
  ): Promise<void> {
    try {
      let content = '=== ESTADÍSTICAS ===\n';
      content += this.convertToCSV([
        ['Métrica', 'Valor'],
        ...statistics.map(s => [s.label, s.value.toString()])
      ]);

      content += '\n\n=== CITAS ===\n';
      const appointmentHeaders = ['ID', 'Fecha', 'Hora', 'Mascota', 'Dueño', 'Motivo', 'Estado', 'Prioridad'];
      const appointmentRows = appointments.map(apt => [
        apt.id,
        new Date(apt.date).toLocaleDateString('es-ES'),
        new Date(apt.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        apt.petName || '',
        apt.ownerName || '',
        apt.reason || '',
        this.translateStatus(apt.status),
        this.translatePriority(apt.priority)
      ]);
      content += this.convertToCSV([appointmentHeaders, ...appointmentRows]);

      content += '\n\n=== REGISTROS MÉDICOS ===\n';
      const recordHeaders = ['ID', 'Fecha', 'Mascota', 'Tipo', 'Diagnóstico', 'Tratamiento'];
      const recordRows = records.map(rec => [
        rec.id,
        new Date(rec.date).toLocaleDateString('es-ES'),
        rec.petName || '',
        this.translateRecordType(rec.type),
        rec.diagnosis || '',
        rec.treatment || ''
      ]);
      content += this.convertToCSV([recordHeaders, ...recordRows]);

      const timestamp = new Date().toISOString().split('T')[0];
      this.downloadCSV(content, `${filename}_${timestamp}.csv`);

      await this.errorHandler.showSuccessToast('Reporte completo exportado exitosamente');
    } catch (error) {
      this.logger.error('Error exporting multi-sheet report:', error);
      await this.errorHandler.showErrorToast('Error al exportar reporte completo');
    }
  }
}
