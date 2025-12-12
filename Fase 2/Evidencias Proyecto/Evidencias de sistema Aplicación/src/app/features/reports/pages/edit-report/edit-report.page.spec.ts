import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditReportPage } from './edit-report.page';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { FormBuilder } from '@angular/forms';
import { ToastService } from '@shared/services/toast.service';
import { of } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('EditReportPage', () => {
  let component: EditReportPage;
  let fixture: ComponentFixture<EditReportPage>;
  let firestoreSpy: jasmine.SpyObj<AngularFirestore>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const activatedRouteSpy = {
      params: of({ id: 'test-id' }),
      snapshot: { params: { id: 'test-id' } }
    };

    firestoreSpy = jasmine.createSpyObj('AngularFirestore', ['collection', 'doc']);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['presentToast']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    firestoreSpy.doc.and.returnValue({
      valueChanges: () => of({}),
      update: () => Promise.resolve(),
      get: () => of({ exists: true, data: () => ({}) })
    } as any);

    await TestBed.configureTestingModule({
      declarations: [EditReportPage],
      providers: [
        FormBuilder,
        { provide: ActivatedRoute, useValue: activatedRouteSpy },
        { provide: AngularFirestore, useValue: firestoreSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: Router, useValue: routerSpy }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(EditReportPage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

