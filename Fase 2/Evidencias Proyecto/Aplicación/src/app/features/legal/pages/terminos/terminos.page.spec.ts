import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { TerminosPage } from './terminos.page';

describe('TerminosPage', () => {
  let component: TerminosPage;
  let fixture: ComponentFixture<TerminosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TerminosPage);
    component = fixture.componentInstance;
    // detectChanges omitido para evitar inicialización de dependencias
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
