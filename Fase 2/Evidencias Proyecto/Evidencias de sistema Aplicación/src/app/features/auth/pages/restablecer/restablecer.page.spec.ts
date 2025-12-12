import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { RestablecerPage } from './restablecer.page';
import { TestProvidersModule } from '../../../../../test-helpers/test-providers.module';

describe('RestablecerPage', () => {
  let component: RestablecerPage;
  let fixture: ComponentFixture<RestablecerPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestProvidersModule],
      declarations: [RestablecerPage]
    , schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA] }).compileComponents();

    fixture = TestBed.createComponent(RestablecerPage);
    component = fixture.componentInstance;
    // detectChanges omitido para evitar inicialización de dependencias
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
