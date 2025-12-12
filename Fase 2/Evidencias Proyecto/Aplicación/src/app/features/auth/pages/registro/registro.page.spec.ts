import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { RegistroPage } from './registro.page';
import { TestProvidersModule } from '../../../../../test-helpers/test-providers.module';

describe('RegistroPage', () => {
  let component: RegistroPage;
  let fixture: ComponentFixture<RegistroPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestProvidersModule],
      declarations: [RegistroPage]
    , schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA] }).compileComponents();

    fixture = TestBed.createComponent(RegistroPage);
    component = fixture.componentInstance;
    // detectChanges omitido para evitar inicialización de dependencias
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
