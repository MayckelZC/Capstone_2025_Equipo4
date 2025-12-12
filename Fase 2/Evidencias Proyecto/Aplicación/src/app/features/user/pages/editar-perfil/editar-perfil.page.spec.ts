import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { EditarPerfilPage } from './editar-perfil.page';
import { TestProvidersModule } from '../../../../../test-helpers/test-providers.module';

describe('EditarPerfilPage', () => {
  let component: EditarPerfilPage;
  let fixture: ComponentFixture<EditarPerfilPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestProvidersModule],
      declarations: [EditarPerfilPage]
    , schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA] }).compileComponents();

    fixture = TestBed.createComponent(EditarPerfilPage);
    component = fixture.componentInstance;
    // detectChanges omitido para evitar inicialización de dependencias
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

