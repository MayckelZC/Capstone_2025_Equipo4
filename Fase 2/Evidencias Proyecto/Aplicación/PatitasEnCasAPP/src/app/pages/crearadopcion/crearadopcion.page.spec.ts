import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CrearadopcionPage } from './crearadopcion.page';
import { TestProvidersModule } from 'src/test-helpers/test-providers.module';

describe('CrearadopcionPage', () => {
  let component: CrearadopcionPage;
  let fixture: ComponentFixture<CrearadopcionPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestProvidersModule],
      declarations: [CrearadopcionPage]
    }).compileComponents();

    fixture = TestBed.createComponent(CrearadopcionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
