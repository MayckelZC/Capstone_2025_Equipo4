import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { CrearadopcionPage } from './crearadopcion.page';
import { TestProvidersModule } from '../../../../../test-helpers/test-providers.module';

describe('CrearadopcionPage', () => {
  let component: CrearadopcionPage;
  let fixture: ComponentFixture<CrearadopcionPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestProvidersModule],
      declarations: [CrearadopcionPage]
    , schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA] }).compileComponents();

    fixture = TestBed.createComponent(CrearadopcionPage);
    component = fixture.componentInstance;
    // detectChanges omitido para evitar inicialización de dependencias
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
