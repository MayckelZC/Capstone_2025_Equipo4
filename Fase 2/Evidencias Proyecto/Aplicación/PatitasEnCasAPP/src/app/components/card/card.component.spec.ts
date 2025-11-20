import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { CardComponent } from './card.component';
import { AuthService } from 'src/app/services/auth.service';
import { of } from 'rxjs';

describe('CardComponent', () => {
  let component: CardComponent;
  let fixture: ComponentFixture<CardComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(waitForAsync(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    authServiceSpy.getCurrentUser.and.returnValue(Promise.resolve({ uid: 'test-user-id' } as any));

    TestBed.configureTestingModule({
      declarations: [ CardComponent ],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CardComponent);
    component = fixture.componentInstance;
    
    // Inicializar inputs requeridos
    component.nombre = 'Test Pet';
    component.tipoMascota = 'Perro';
    component.etapaVida = 'Adulto';
    component.sexo = 'Macho';
    component.tamano = 'Mediano';
    component.esterilizado = true;
    component.location = 'Santiago';
    component.descripcion = 'Test description';
    component.urlImagen = 'https://example.com/image.jpg';
    component.adopcionId = 'test-id';
    component.status = 'available';
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
