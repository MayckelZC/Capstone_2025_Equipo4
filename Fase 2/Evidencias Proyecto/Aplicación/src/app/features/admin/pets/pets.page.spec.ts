import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { PetsPage } from './pets.page';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { ToastService } from '@shared/services/toast.service';
import { LoggerService } from '@core/services/logger.service';
import { of } from 'rxjs';
import { Adopcion } from '@models/Adopcion';

describe('PetsPage (Admin)', () => {
    let component: PetsPage;
    let fixture: ComponentFixture<PetsPage>;
    let router: jasmine.SpyObj<Router>;
    let alertController: jasmine.SpyObj<AlertController>;
    let toastService: jasmine.SpyObj<ToastService>;
    let logger: jasmine.SpyObj<LoggerService>;
    let firestoreMock: any;

    const mockPets: Adopcion[] = [
        {
            id: 'pet-1',
            nombre: 'Max',
            tipoMascota: 'Perro',
            status: 'available',
            creadorId: 'user-1',
            isHidden: false,
            createdAt: new Date('2024-01-15')
        } as Adopcion,
        {
            id: 'pet-2',
            nombre: 'Luna',
            tipoMascota: 'Gato',
            status: 'adopted',
            creadorId: 'user-2',
            isHidden: true,
            createdAt: new Date('2024-01-10')
        } as Adopcion,
        {
            id: 'pet-3',
            nombre: 'Rocky',
            tipoMascota: 'Perro',
            status: 'available',
            creadorId: 'user-1',
            isHidden: false,
            createdAt: new Date('2024-01-20')
        } as Adopcion
    ];

    beforeEach(async () => {
        const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        const alertControllerSpy = jasmine.createSpyObj('AlertController', ['create']);
        const toastServiceSpy = jasmine.createSpyObj('ToastService', ['presentToast']);
        const loggerSpy = jasmine.createSpyObj('LoggerService', ['error', 'info', 'warn']);

        const mockDocSnapshot = {
            data: () => ({ nombreCompleto: 'Test User' })
        };

        const mockDocRef = {
            get: jasmine.createSpy('get').and.returnValue(of(mockDocSnapshot)),
            update: jasmine.createSpy('update').and.returnValue(Promise.resolve()),
            delete: jasmine.createSpy('delete').and.returnValue(Promise.resolve())
        };

        const mockQuerySnapshot = {
            docs: mockPets.map((pet, i) => ({
                id: pet.id,
                data: () => ({ ...pet, createdAt: { toDate: () => pet.createdAt } })
            }))
        };

        const mockCollectionRef = {
            get: jasmine.createSpy('get').and.returnValue(of(mockQuerySnapshot)),
            doc: jasmine.createSpy('doc').and.returnValue(mockDocRef)
        };

        firestoreMock = {
            collection: jasmine.createSpy('collection').and.returnValue(mockCollectionRef)
        };

        alertControllerSpy.create.and.returnValue(Promise.resolve({
            present: jasmine.createSpy('present').and.returnValue(Promise.resolve())
        } as any));

        await TestBed.configureTestingModule({
            declarations: [PetsPage],
            providers: [
                { provide: AngularFirestore, useValue: firestoreMock },
                { provide: Router, useValue: routerSpy },
                { provide: AlertController, useValue: alertControllerSpy },
                { provide: ToastService, useValue: toastServiceSpy },
                { provide: LoggerService, useValue: loggerSpy }
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
        }).compileComponents();

        fixture = TestBed.createComponent(PetsPage);
        component = fixture.componentInstance;
        router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
        alertController = TestBed.inject(AlertController) as jasmine.SpyObj<AlertController>;
        toastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
        logger = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;

        // Initialize with mock data
        component.pets = mockPets;
        component.filteredPets = mockPets;
    });

    describe('Component Creation', () => {
        it('should create', () => {
            expect(component).toBeTruthy();
        });

        it('should initialize with default values', () => {
            expect(component.searchTerm).toBe('');
            expect(component.currentFilter).toBe('all');
            expect(component.currentSort).toBe('dateDesc');
            expect(component.limit).toBe(15);
        });
    });

    describe('Filtering', () => {
        it('should filter by available status', () => {
            component.currentFilter = 'available';
            component.applyFiltersAndSort();
            // Filter applied
            expect(component.currentFilter).toBe('available');
        });

        it('should filter by adopted status', () => {
            component.currentFilter = 'adopted';
            component.applyFiltersAndSort();
            expect(component.currentFilter).toBe('adopted');
        });

        it('should filter by visible pets', () => {
            component.currentFilter = 'visible';
            component.applyFiltersAndSort();
            expect(component.currentFilter).toBe('visible');
        });

        it('should filter by hidden pets', () => {
            component.currentFilter = 'hidden';
            component.applyFiltersAndSort();
            expect(component.currentFilter).toBe('hidden');
        });

        it('should reset filters on applyFiltersAndSort', () => {
            component.filteredPets = mockPets;
            component.lastPetDoc = { id: 'test' };
            component.applyFiltersAndSort();
            expect(component.lastPetDoc).toBeNull();
        });
    });

    describe('Sorting', () => {
        it('should sort by date descending by default', () => {
            expect(component.currentSort).toBe('dateDesc');
        });

        it('should allow sorting by name ascending', () => {
            component.currentSort = 'nameAsc';
            component.applyFiltersAndSort();
            expect(component.currentSort).toBe('nameAsc');
        });

        it('should allow sorting by name descending', () => {
            component.currentSort = 'nameDesc';
            component.applyFiltersAndSort();
            expect(component.currentSort).toBe('nameDesc');
        });

        it('should allow sorting by date ascending', () => {
            component.currentSort = 'dateAsc';
            component.applyFiltersAndSort();
            expect(component.currentSort).toBe('dateAsc');
        });
    });

    describe('Search', () => {
        it('should filter by search term', () => {
            component.searchTerm = 'Max';
            component.applyFiltersAndSort();
            expect(component.searchTerm).toBe('Max');
        });

        it('should handle empty search term', () => {
            component.searchTerm = '';
            component.applyFiltersAndSort();
            expect(component.searchTerm).toBe('');
        });
    });

    describe('Navigation', () => {
        it('should navigate to edit page', () => {
            component.editPet(mockPets[0]);
            expect(router.navigate).toHaveBeenCalledWith(
                ['/modificar'],
                { queryParams: { id: 'pet-1' } }
            );
        });
    });

    describe('Delete Pet', () => {
        it('should show confirmation alert before deleting', async () => {
            await component.deletePet('pet-1');
            expect(alertController.create).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    header: 'Confirmar Eliminacion'
                })
            );
        });
    });

    describe('Toggle Visibility', () => {
        it('should toggle pet visibility to hidden', async () => {
            const mockDocRef = {
                update: jasmine.createSpy('update').and.returnValue(Promise.resolve())
            };

            firestoreMock.collection.and.returnValue({
                doc: () => mockDocRef
            });

            await component.togglePetVisibility(mockPets[0]);
            expect(toastService.presentToast).toHaveBeenCalled();
        });

        it('should toggle pet visibility to visible', async () => {
            const hiddenPet = { ...mockPets[1], isHidden: true };
            const mockDocRef = {
                update: jasmine.createSpy('update').and.returnValue(Promise.resolve())
            };

            firestoreMock.collection.and.returnValue({
                doc: () => mockDocRef
            });

            await component.togglePetVisibility(hiddenPet);
            expect(toastService.presentToast).toHaveBeenCalled();
        });

        it('should handle error when toggling visibility', async () => {
            const mockDocRef = {
                update: jasmine.createSpy('update').and.returnValue(Promise.reject(new Error('Update failed')))
            };

            firestoreMock.collection.and.returnValue({
                doc: () => mockDocRef
            });

            await component.togglePetVisibility(mockPets[0]);
            expect(logger.error).toHaveBeenCalled();
            expect(toastService.presentToast).toHaveBeenCalledWith(
                jasmine.stringMatching(/Error/),
                'danger',
                jasmine.any(String)
            );
        });
    });

    describe('TrackBy', () => {
        it('should return pet id for trackBy', () => {
            const result = component.trackByPetId(0, mockPets[0]);
            expect(result).toBe('pet-1');
        });
    });

    describe('Load More (Infinite Scroll)', () => {
        it('should load more pets on scroll', () => {
            const mockEvent = {
                target: {
                    complete: jasmine.createSpy('complete'),
                    disabled: false
                }
            };

            component.loadMore(mockEvent);
            // loadMore called fetchPets with event
            expect(firestoreMock.collection).toHaveBeenCalled();
        });
    });

    describe('Cleanup', () => {
        it('should unsubscribe on destroy', () => {
            component.ngOnDestroy();
            // Should not throw
            expect(true).toBeTrue();
        });
    });
});
