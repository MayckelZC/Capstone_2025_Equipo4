import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { PerfilPage } from './perfil.page';
import { TestProvidersModule } from '../../../../../test-helpers/test-providers.module';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { of } from 'rxjs';
import { Adopcion } from '@models/Adopcion';

describe('PerfilPage', () => {
    let component: PerfilPage;
    let fixture: ComponentFixture<PerfilPage>;
    let router: jasmine.SpyObj<Router>;
    let authService: jasmine.SpyObj<AuthService>;

    const mockUser = {
        uid: 'test-user-id',
        email: 'test@example.com',
        nombreCompleto: 'Test User',
        nombreUsuario: 'testuser',
        telefono: '+56912345678',
        direccion: 'Test Address',
        region: 'RM',
        ciudad: 'Santiago',
        roles: ['user'],
        isBlocked: false,
        createdAt: new Date()
    };

    const mockPets: Adopcion[] = [
        {
            id: 'pet-1',
            nombre: 'Max',
            tipoMascota: 'Perro',
            status: 'available',
            creadorId: 'test-user-id'
        } as Adopcion,
        {
            id: 'pet-2',
            nombre: 'Michi',
            tipoMascota: 'Gato',
            status: 'adopted',
            creadorId: 'test-user-id'
        } as Adopcion
    ];

    beforeEach(async () => {
        const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        const authServiceSpy = jasmine.createSpyObj('AuthService', [
            'getCurrentUser', 'isEmailVerified'
        ]);
        authServiceSpy.getCurrentUser.and.returnValue(Promise.resolve(mockUser));

        const mockParamMap = {
            get: (key: string) => key === 'id' ? 'test-user-id' : null
        };

        const activatedRoute = {
            snapshot: { paramMap: mockParamMap },
            paramMap: of(mockParamMap)
        };

        await TestBed.configureTestingModule({
            imports: [TestProvidersModule],
            declarations: [PerfilPage],
            providers: [
                { provide: Router, useValue: routerSpy },
                { provide: AuthService, useValue: authServiceSpy },
                { provide: ActivatedRoute, useValue: activatedRoute }
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
        }).compileComponents();

        fixture = TestBed.createComponent(PerfilPage);
        component = fixture.componentInstance;
        router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
        authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

        component.user = mockUser as any;
        component.userId = 'test-user-id';
    });

    describe('Component Creation', () => {
        it('should create', () => {
            expect(component).toBeTruthy();
        });

        it('should have loading true initially', () => {
            const newComponent = TestBed.createComponent(PerfilPage).componentInstance;
            expect(newComponent.loading).toBeTrue();
        });
    });

    describe('isOwnProfile', () => {
        it('should set isOwnProfile to true when viewing own profile', fakeAsync(() => {
            authService.getCurrentUser.and.returnValue(Promise.resolve(mockUser));
            component.userId = 'test-user-id';
            component.checkIfOwnProfile();
            tick();
            expect(component.isOwnProfile).toBeTrue();
        }));

        it('should set isOwnProfile to false when viewing another user', fakeAsync(() => {
            authService.getCurrentUser.and.returnValue(Promise.resolve(mockUser));
            component.userId = 'different-user-id';
            component.checkIfOwnProfile();
            tick();
            expect(component.isOwnProfile).toBeFalse();
        }));
    });

    describe('Navigation', () => {
        it('should navigate to pet details', () => {
            component.goToPetDetails('pet-1');
            expect(router.navigate).toHaveBeenCalledWith(['/pets/detalle', 'pet-1']);
        });
    });

    describe('WhatsApp Link', () => {
        it('should generate correct WhatsApp link', () => {
            const link = component.getWhatsAppLink('+56912345678');
            expect(link).toContain('wa.me');
            expect(link).toContain('56912345678');
        });

        it('should clean phone number for WhatsApp', () => {
            const link = component.getWhatsAppLink('+56 9 1234 5678');
            expect(link).not.toContain(' ');
        });
    });

    describe('Role Colors', () => {
        it('should return correct color for admin', () => {
            expect(component.getRoleColor('admin')).toBe('danger');
        });

        it('should return correct color for organization', () => {
            expect(component.getRoleColor('organization')).toBe('tertiary');
        });

        it('should return correct color for veterinarian', () => {
            expect(component.getRoleColor('veterinarian')).toBe('success');
        });

        it('should return primary for regular user', () => {
            expect(component.getRoleColor('user')).toBe('primary');
        });
    });

    describe('Role Icons', () => {
        it('should return shield icon for admin', () => {
            expect(component.getRoleIcon('admin')).toBe('shield');
        });

        it('should return business icon for organization', () => {
            expect(component.getRoleIcon('organization')).toBe('business');
        });

        it('should return medkit icon for veterinarian', () => {
            expect(component.getRoleIcon('veterinarian')).toBe('medkit');
        });

        it('should return person icon for regular user', () => {
            expect(component.getRoleIcon('user')).toBe('person');
        });
    });

    describe('Pet Filtering', () => {
        it('should filter pets by search term', () => {
            component.petSearchTerm = 'Max';
            const filtered = component.getFilteredPets(mockPets);
            expect(filtered.length).toBe(1);
            expect(filtered[0].nombre).toBe('Max');
        });

        it('should return all pets when no search term', () => {
            component.petSearchTerm = '';
            const filtered = component.getFilteredPets(mockPets);
            expect(filtered.length).toBe(2);
        });

        it('should filter case-insensitively', () => {
            component.petSearchTerm = 'max';
            const filtered = component.getFilteredPets(mockPets);
            expect(filtered.length).toBe(1);
        });
    });

    describe('TrackBy', () => {
        it('should return pet id for trackBy', () => {
            const result = component.trackPetById(0, mockPets[0]);
            expect(result).toBe('pet-1');
        });
    });

    describe('Contact Methods', () => {
        it('should toggle contact details', () => {
            component.showContactDetails = false;
            component.toggleContactDetails();
            expect(component.showContactDetails).toBeTrue();

            component.toggleContactDetails();
            expect(component.showContactDetails).toBeFalse();
        });
    });

    describe('Join Date', () => {
        it('should format join date correctly', () => {
            const date = new Date('2024-01-15');
            const result = component.getJoinDate(date);
            expect(result).toContain('2024');
        });

        it('should handle Firestore timestamp', () => {
            const firestoreTimestamp = { toDate: () => new Date('2024-01-15') };
            const result = component.getJoinDate(firestoreTimestamp);
            expect(result).toContain('2024');
        });
    });

    describe('Response Time', () => {
        it('should return a response time string', () => {
            const result = component.getResponseTime();
            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });
    });
});
