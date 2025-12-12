import { TestBed } from '@angular/core/testing';
import { ExportService } from './export.service';
import { ErrorHandlerService } from './error-handler.service';
import { LoggerService } from '@core/services/logger.service';
import { AppointmentCard, MedicalRecord } from '../models/veterinarian.interfaces';

describe('ExportService', () => {
  let service: ExportService;
  let errorHandler: jasmine.SpyObj<ErrorHandlerService>;
  let logger: jasmine.SpyObj<LoggerService>;

  const mockAppointments: AppointmentCard[] = [
    {
      id: '1',
      petId: 'pet1',
      petName: 'Firulais',
      ownerId: 'owner1',
      ownerName: 'Juan Perez',
      date: new Date('2024-01-15T10:00:00'),
      reason: 'Chequeo',
      status: 'pending',
      priority: 'medium'
    },
    {
      id: '2',
      petId: 'pet2',
      petName: 'Max',
      ownerId: 'owner2',
      ownerName: 'Maria Lopez',
      date: new Date('2024-01-16T14:00:00'),
      reason: 'Vacunacion',
      status: 'completed',
      priority: 'high'
    }
  ];

  const mockRecords: MedicalRecord[] = [
    {
      id: 'rec1',
      petId: 'pet1',
      petName: 'Firulais',
      date: new Date('2024-01-15'),
      type: 'vaccination',
      description: 'Vacuna antirabica',
      veterinarianId: 'vet1',
      veterinarianName: 'Dr. Garcia'
    }
  ];

  beforeEach(() => {
    const errorHandlerSpy = jasmine.createSpyObj('ErrorHandlerService', [
      'showSuccessToast',
      'showErrorToast'
    ]);

    const loggerSpy = jasmine.createSpyObj('LoggerService', [
      'info', 'error', 'warn', 'debug'
    ]);

    TestBed.configureTestingModule({
      providers: [
        ExportService,
        { provide: ErrorHandlerService, useValue: errorHandlerSpy },
        { provide: LoggerService, useValue: loggerSpy }
      ]
    });

    service = TestBed.inject(ExportService);
    errorHandler = TestBed.inject(ErrorHandlerService) as jasmine.SpyObj<ErrorHandlerService>;
    logger = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('exportAppointmentsToCSV', () => {
    it('should export appointments to CSV', async () => {
      spyOn(document, 'createElement').and.callThrough();

      await service.exportAppointmentsToCSV(mockAppointments, 'test');

      expect(errorHandler.showSuccessToast).toHaveBeenCalled();
    });

    it('should handle empty appointments array', async () => {
      const emptyData: AppointmentCard[] = [];

      await service.exportAppointmentsToCSV(emptyData);

      expect(errorHandler.showSuccessToast).toHaveBeenCalled();
    });

    it('should use default filename when not provided', async () => {
      await service.exportAppointmentsToCSV(mockAppointments);

      expect(errorHandler.showSuccessToast).toHaveBeenCalled();
    });
  });

  describe('exportMedicalRecordsToCSV', () => {
    it('should export medical records to CSV', async () => {
      await service.exportMedicalRecordsToCSV(mockRecords, 'medical_test');

      expect(errorHandler.showSuccessToast).toHaveBeenCalled();
    });

    it('should handle empty records array', async () => {
      await service.exportMedicalRecordsToCSV([]);

      expect(errorHandler.showSuccessToast).toHaveBeenCalled();
    });
  });

  describe('exportStatisticsToCSV', () => {
    it('should export statistics to CSV', async () => {
      const stats = [
        { label: 'Total Citas', value: 100 },
        { label: 'Completadas', value: 80 },
        { label: 'Pendientes', value: 20 }
      ];

      await service.exportStatisticsToCSV(stats, 'stats_test');

      expect(errorHandler.showSuccessToast).toHaveBeenCalled();
    });

    it('should handle mixed value types', async () => {
      const stats = [
        { label: 'Numero', value: 42 },
        { label: 'Texto', value: 'test value' }
      ];

      await service.exportStatisticsToCSV(stats);

      expect(errorHandler.showSuccessToast).toHaveBeenCalled();
    });
  });

  describe('convertToCSV', () => {
    it('should convert 2D array to CSV format', () => {
      const data = [
        ['Header1', 'Header2'],
        ['Value1', 'Value2']
      ];

      const result = service.convertToCSV(data);

      expect(result).toContain('Header1');
      expect(result).toContain('Value1');
    });

    it('should handle special characters', () => {
      const data = [
        ['Name', 'Description'],
        ['Test, with comma', 'Has "quotes"']
      ];

      const result = service.convertToCSV(data);

      expect(result).toBeDefined();
    });

    it('should handle empty data', () => {
      const result = service.convertToCSV([]);

      expect(result).toBe('');
    });
  });

  describe('translateStatus', () => {
    it('should translate pending status', () => {
      expect(service.translateStatus('pending')).toBe('Pendiente');
    });

    it('should translate confirmed status', () => {
      expect(service.translateStatus('confirmed')).toBe('Confirmada');
    });

    it('should translate completed status', () => {
      expect(service.translateStatus('completed')).toBe('Completada');
    });

    it('should translate cancelled status', () => {
      expect(service.translateStatus('cancelled')).toBe('Cancelada');
    });

    it('should return original for unknown status', () => {
      expect(service.translateStatus('unknown')).toBe('unknown');
    });
  });

  describe('translatePriority', () => {
    it('should translate low priority', () => {
      expect(service.translatePriority('low')).toBe('Baja');
    });

    it('should translate medium priority', () => {
      expect(service.translatePriority('medium')).toBe('Media');
    });

    it('should translate high priority', () => {
      expect(service.translatePriority('high')).toBe('Alta');
    });

    it('should return original for unknown priority', () => {
      expect(service.translatePriority('unknown')).toBe('unknown');
    });
  });

  describe('translateRecordType', () => {
    it('should translate vaccination type', () => {
      expect(service.translateRecordType('vaccination')).toBe('Vacunacion');
    });

    it('should translate consultation type', () => {
      expect(service.translateRecordType('consultation')).toBe('Consulta');
    });

    it('should translate surgery type', () => {
      expect(service.translateRecordType('surgery')).toBe('Cirugia');
    });

    it('should return original for unknown type', () => {
      expect(service.translateRecordType('unknown')).toBe('unknown');
    });
  });

  describe('exportMultiSheetReport', () => {
    it('should export complete report with all data', async () => {
      const stats = [{ label: 'Total', value: 100 }];

      await service.exportMultiSheetReport(
        mockAppointments,
        mockRecords,
        stats,
        'complete_report'
      );

      expect(errorHandler.showSuccessToast).toHaveBeenCalled();
    });

    it('should use default filename', async () => {
      await service.exportMultiSheetReport(
        mockAppointments,
        mockRecords,
        []
      );

      expect(errorHandler.showSuccessToast).toHaveBeenCalled();
    });
  });
});
