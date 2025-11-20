import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdvancedSearchPage } from './advanced-search.page';
import { TestProvidersModule } from 'src/test-helpers/test-providers.module';

describe('AdvancedSearchPage', () => {
  let component: AdvancedSearchPage;
  let fixture: ComponentFixture<AdvancedSearchPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestProvidersModule],
      declarations: [AdvancedSearchPage]
    }).compileComponents();

    fixture = TestBed.createComponent(AdvancedSearchPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
