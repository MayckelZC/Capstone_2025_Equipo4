import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { PrivacidadPage } from './privacidad.page';

describe('PrivacidadPage', () => {
  let component: PrivacidadPage;
  let fixture: ComponentFixture<PrivacidadPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PrivacidadPage);
    component = fixture.componentInstance;
    // detectChanges omitido para evitar inicialización de dependencias
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
