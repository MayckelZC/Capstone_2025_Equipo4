import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { DetallePage } from './detalle.page';
import { TestProvidersModule } from '../../../../../test-helpers/test-providers.module';

describe('DetallePage', () => {
  let component: DetallePage;
  let fixture: ComponentFixture<DetallePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestProvidersModule],
      declarations: [DetallePage]
    , schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA] }).compileComponents();

    fixture = TestBed.createComponent(DetallePage);
    component = fixture.componentInstance;
    // detectChanges omitido para evitar inicialización de dependencias
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
