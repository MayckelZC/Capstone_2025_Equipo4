import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReportModalPage } from './report-modal.page';
import { TestProvidersModule } from 'src/test-helpers/test-providers.module';

describe('ReportModalPage', () => {
  let component: ReportModalPage;
  let fixture: ComponentFixture<ReportModalPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestProvidersModule],
      declarations: [ReportModalPage]
    }).compileComponents();

    fixture = TestBed.createComponent(ReportModalPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
