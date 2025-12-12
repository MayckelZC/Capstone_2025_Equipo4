import { ComponentFixture, TestBed, waitForAsync, fakeAsync, tick } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { CardComponent } from './card.component';
import { AuthService } from '@core/services/auth.service';
import { By } from '@angular/platform-browser';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('CardComponent', () => {
  let component: CardComponent;
  let fixture: ComponentFixture<CardComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const defaultInputs = {
    nombre: 'Test Pet',
    tipoMascota: 'Perro',
    etapaVida: 'Adulto',
    sexo: 'Macho',
    tamano: 'Mediano',
    esterilizado: true,
    vacuna: true,
    desparasitado: true,
    location: 'Santiago',
    descripcion: 'Test description',
    urlImagen: 'https://example.com/image.jpg',
    adopcionId: 'test-id',
    status: 'available',
    creadorId: 'creator-id',
    isFavorite: false,
    isVerified: false
  };

  beforeEach(waitForAsync(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    authServiceSpy.getCurrentUser.and.returnValue(Promise.resolve({ uid: 'test-user-id' } as any));

    TestBed.configureTestingModule({
      declarations: [CardComponent],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: AuthService, useValue: authServiceSpy }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(CardComponent);
    component = fixture.componentInstance;

    // Inicializar inputs requeridos
    Object.assign(component, defaultInputs);
  }));

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with correct default signal values', () => {
      expect(component.imageLoading()).toBeTrue();
      expect(component.isOwner()).toBeFalse();
      expect(component.daysAgo()).toBe(0);
    });
  });

  describe('Signals', () => {
    it('should update imageLoading signal on image load', () => {
      component.onImageLoad();
      expect(component.imageLoading()).toBeFalse();
    });

    it('should update imageLoading signal on image error', () => {
      const mockEvent = { target: { src: '' } };
      component.handleImageError(mockEvent);
      expect(component.imageLoading()).toBeFalse();
    });

    it('should set correct placeholder on image error for dog', () => {
      component.tipoMascota = 'perro';
      const mockEvent = { target: { src: '' } };
      component.handleImageError(mockEvent);
      expect(mockEvent.target.src).toContain('pixelart-dog.png');
    });

    it('should set correct placeholder on image error for cat', () => {
      component.tipoMascota = 'gato';
      const mockEvent = { target: { src: '' } };
      component.handleImageError(mockEvent);
      expect(mockEvent.target.src).toContain('pixelart-cat.png');
    });
  });

  describe('isOwner computed', () => {
    it('should set isOwner to true when current user is creator', fakeAsync(() => {
      authServiceSpy.getCurrentUser.and.returnValue(Promise.resolve({ uid: 'creator-id' } as any));
      component.creadorId = 'creator-id';
      component.ngOnInit();
      tick();
      expect(component.isOwner()).toBeTrue();
    }));

    it('should set isOwner to false when current user is not creator', fakeAsync(() => {
      authServiceSpy.getCurrentUser.and.returnValue(Promise.resolve({ uid: 'other-user' } as any));
      component.creadorId = 'creator-id';
      component.ngOnInit();
      tick();
      expect(component.isOwner()).toBeFalse();
    }));

    it('should set isOwner to false when no user', fakeAsync(() => {
      authServiceSpy.getCurrentUser.and.returnValue(Promise.resolve(null));
      component.ngOnInit();
      tick();
      expect(component.isOwner()).toBeFalse();
    }));

    it('should set isOwner to false on auth error', fakeAsync(() => {
      authServiceSpy.getCurrentUser.and.returnValue(Promise.reject(new Error('Auth error')));
      component.ngOnInit();
      tick();
      expect(component.isOwner()).toBeFalse();
    }));
  });

  describe('daysAgo computed', () => {
    it('should calculate days ago correctly for today', () => {
      component.createdAt = new Date();
      component.ngOnChanges({ createdAt: { currentValue: component.createdAt } as any });
      expect(component.daysAgo()).toBe(0);
      expect(component.daysAgoText()).toBe('Hoy');
    });

    it('should calculate days ago correctly for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      component.createdAt = yesterday;
      component.ngOnChanges({ createdAt: { currentValue: component.createdAt } as any });
      expect(component.daysAgo()).toBe(1);
      expect(component.daysAgoText()).toBe('Ayer');
    });

    it('should show days for recent posts', () => {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - 3);
      component.createdAt = daysAgo;
      component.ngOnChanges({ createdAt: { currentValue: component.createdAt } as any });
      expect(component.daysAgoText()).toBe('Hace 3 días');
    });

    it('should show weeks for older posts', () => {
      const weeksAgo = new Date();
      weeksAgo.setDate(weeksAgo.getDate() - 14);
      component.createdAt = weeksAgo;
      component.ngOnChanges({ createdAt: { currentValue: component.createdAt } as any });
      expect(component.daysAgoText()).toContain('semanas');
    });

    it('should handle Firestore timestamps', () => {
      const firestoreTimestamp = { seconds: Date.now() / 1000 };
      component.createdAt = firestoreTimestamp as any;
      component.ngOnChanges({ createdAt: { currentValue: component.createdAt } as any });
      expect(component.daysAgo()).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Event Emitters', () => {
    it('should emit detailsClicked on onDetailsClick', () => {
      spyOn(component.detailsClicked, 'emit');
      component.onDetailsClick();
      expect(component.detailsClicked.emit).toHaveBeenCalled();
    });

    it('should emit toggleFavoriteEvent with adopcionId on onToggleFavorite', () => {
      spyOn(component.toggleFavoriteEvent, 'emit');
      component.onToggleFavorite();
      expect(component.toggleFavoriteEvent.emit).toHaveBeenCalledWith('test-id');
    });

    it('should emit reportEvent with adopcionId on onReport', () => {
      spyOn(component.reportEvent, 'emit');
      component.onReport();
      expect(component.reportEvent.emit).toHaveBeenCalledWith('test-id');
    });

    it('should emit confirmHandoverEvent with adopcionId on onConfirmHandover', () => {
      spyOn(component.confirmHandoverEvent, 'emit');
      component.onConfirmHandover();
      expect(component.confirmHandoverEvent.emit).toHaveBeenCalledWith('test-id');
    });
  });

  describe('Status methods', () => {
    it('should return correct color for available status', () => {
      expect(component.getStatusColor('available')).toBe('success');
    });

    it('should return correct color for in_process status', () => {
      expect(component.getStatusColor('in_process')).toBe('warning');
    });

    it('should return correct color for adopted status', () => {
      expect(component.getStatusColor('adopted')).toBe('medium');
    });

    it('should return light for unknown status', () => {
      expect(component.getStatusColor('unknown')).toBe('light');
    });

    it('should translate available status', () => {
      expect(component.getTranslatedStatus('available')).toBe('Disponible');
    });

    it('should translate in_process status', () => {
      expect(component.getTranslatedStatus('in_process')).toBe('En Proceso');
    });

    it('should translate adopted status', () => {
      expect(component.getTranslatedStatus('adopted')).toBe('Adoptado');
    });

    it('should return Desconocido for unknown status', () => {
      expect(component.getTranslatedStatus('unknown')).toBe('Desconocido');
    });
  });

  describe('ngOnChanges', () => {
    it('should reset imageLoading when urlImagen changes', () => {
      component.imageLoading.set(false);
      component.ngOnChanges({
        urlImagen: {
          currentValue: 'new-url.jpg',
          previousValue: 'old-url.jpg',
          firstChange: false,
          isFirstChange: () => false
        }
      });
      expect(component.imageLoading()).toBeTrue();
    });

    it('should not reset imageLoading on first change', () => {
      component.imageLoading.set(false);
      component.ngOnChanges({
        urlImagen: {
          currentValue: 'new-url.jpg',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        }
      });
      expect(component.imageLoading()).toBeFalse();
    });

    it('should recalculate daysAgo when createdAt changes', () => {
      const newDate = new Date();
      newDate.setDate(newDate.getDate() - 5);
      component.createdAt = newDate;
      component.ngOnChanges({ createdAt: { currentValue: newDate } as any });
      expect(component.daysAgo()).toBe(5);
    });
  });
});

