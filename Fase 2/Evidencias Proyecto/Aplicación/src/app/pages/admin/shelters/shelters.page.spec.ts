import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SheltersPage } from './shelters.page';
import { TestProvidersModule } from 'src/test-helpers/test-providers.module';

describe('SheltersPage', () => {
  let component: SheltersPage;
  let fixture: ComponentFixture<SheltersPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestProvidersModule],
      declarations: [SheltersPage]
    }).compileComponents();

    fixture = TestBed.createComponent(SheltersPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
