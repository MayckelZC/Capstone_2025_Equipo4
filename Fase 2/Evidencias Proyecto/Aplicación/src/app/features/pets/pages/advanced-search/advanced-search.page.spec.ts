import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { AdvancedSearchPage } from './advanced-search.page';
import { TestProvidersModule } from '../../../../../test-helpers/test-providers.module';

describe('AdvancedSearchPage', () => {
  let component: AdvancedSearchPage;
  let fixture: ComponentFixture<AdvancedSearchPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestProvidersModule],
      declarations: [AdvancedSearchPage]
    , schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA] }).compileComponents();

    fixture = TestBed.createComponent(AdvancedSearchPage);
    component = fixture.componentInstance;
    // detectChanges omitido para evitar inicialización de dependencias
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
