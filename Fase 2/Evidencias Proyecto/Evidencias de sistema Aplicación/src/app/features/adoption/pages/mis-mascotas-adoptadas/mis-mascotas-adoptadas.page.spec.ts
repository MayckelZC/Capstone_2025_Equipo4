import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MisMascotasAdoptadasPage } from './mis-mascotas-adoptadas.page';
import { AuthService } from '@core/services/auth.service';
import { AdoptionService } from '@features/adoption/services/adoption.service';
import { ToastService } from '@shared/services/toast.service';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { of } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('MisMascotasAdoptadasPage', () => {
  let component: MisMascotasAdoptadasPage;
  let fixture: ComponentFixture<MisMascotasAdoptadasPage>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let adoptionServiceSpy: jasmine.SpyObj<AdoptionService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let modalControllerSpy: jasmine.SpyObj<ModalController>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    adoptionServiceSpy = jasmine.createSpyObj('AdoptionService', ['getMascotasAdoptadas']);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['presentToast']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    modalControllerSpy = jasmine.createSpyObj('ModalController', ['create']);

    authServiceSpy.getCurrentUser.and.returnValue(Promise.resolve({ uid: 'test-user-id' } as any));
    adoptionServiceSpy.getMascotasAdoptadas.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      declarations: [MisMascotasAdoptadasPage],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: AdoptionService, useValue: adoptionServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ModalController, useValue: modalControllerSpy }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(MisMascotasAdoptadasPage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

