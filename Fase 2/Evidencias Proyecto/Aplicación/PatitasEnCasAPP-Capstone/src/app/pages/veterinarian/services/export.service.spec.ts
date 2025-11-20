import { TestBed } from '@angular/core/testing';
import { ExportService } from './export.service';
import { ErrorHandlerService } from './error-handler.service';
import { AppointmentCard } from '../models/veterinarian.interfaces';

describe('ExportService', () => {
  let service: ExportService;
  let errorHandler: jasmine.SpyObj<ErrorHandlerService>;

  beforeEach(() => {
    const errorHandlerSpy = jasmine.createSpyObj('ErrorHandlerService', [
      'showSuccessToast',
      'showErrorToast'
    ]);

    TestBed.configureTestingModule({
      providers: [
        ExportService,
        { provide: ErrorHandlerService, useValue: errorHandlerSpy }
      ]
    });

    service = TestBed.inject(ExportService);
    errorHandler = TestBed.inject(ErrorHandlerService) as jasmine.SpyObj<ErrorHandlerService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should export appointments to CSV', async () => {
    const mockAppointments: AppointmentCard[] = [
      {
        id: '1',
        petId: 'pet1',
        petName: 'Firulais',
        ownerId: 'owner1',
        ownerName: 'Juan Pérez',
        date: new Date('2024-01-15T10:00:00'),
        reason: 'Chequeo',
        status: 'pending',
        priority: 'medium'
      }
    ];

    spyOn(document, 'createElement').and.callThrough();
    
    await service.exportAppointmentsToCSV(mockAppointments, 'test');

    expect(errorHandler.showSuccessToast).toHaveBeenCalled();
  });

  it('should handle export errors gracefully', async () => {
    const invalidData: any = null;

    await service.exportAppointmentsToCSV(invalidData);

    expect(errorHandler.showErrorToast).toHaveBeenCalled();
  });
});
