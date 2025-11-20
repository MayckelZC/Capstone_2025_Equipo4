import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateArticlePage } from './create-article.page';
import { TestProvidersModule } from 'src/test-helpers/test-providers.module';

describe('CreateArticlePage', () => {
  let component: CreateArticlePage;
  let fixture: ComponentFixture<CreateArticlePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestProvidersModule],
      declarations: [CreateArticlePage]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateArticlePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
