import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PetsService } from './pets.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { PetImageService } from './pet-image.service';
import { of } from 'rxjs';

// Mock para documentos de Firestore
const createMockDoc = (data: any, exists = true) => ({
    payload: {
        doc: {
            data: () => data,
            id: data?.id || 'test-pet-id'
        },
        exists,
        data: () => data,
        id: data?.id || 'test-pet-id'
    }
});

// Mock para snapshot de documentos
const createMockSnapshot = (data: any, exists = true) => ({
    exists,
    data: () => data,
    id: data?.id || 'test-pet-id'
});

// Mock flexible para colecciones
const createMockCollection = (docs: any[] = []) => ({
    snapshotChanges: jasmine.createSpy('snapshotChanges').and.returnValue(
        of(docs.map(d => createMockDoc(d)))
    ),
    valueChanges: jasmine.createSpy('valueChanges').and.returnValue(of(docs)),
    get: jasmine.createSpy('get').and.returnValue(of({
        empty: docs.length === 0,
        docs: docs.map(d => ({ data: () => d, id: d.id })),
        size: docs.length
    })),
    doc: jasmine.createSpy('doc').and.callFake((id: string) => ({
        get: jasmine.createSpy('get').and.returnValue(of(createMockSnapshot(docs.find(d => d.id === id) || null, !!docs.find(d => d.id === id)))),
        snapshotChanges: jasmine.createSpy('snapshotChanges').and.returnValue(
            of(createMockDoc(docs.find(d => d.id === id) || null, !!docs.find(d => d.id === id)))
        ),
        update: jasmine.createSpy('update').and.returnValue(Promise.resolve()),
        delete: jasmine.createSpy('delete').and.returnValue(Promise.resolve())
    })),
    add: jasmine.createSpy('add').and.returnValue(Promise.resolve({ id: 'new-pet-id' }))
});

describe('PetsService', () => {
    let service: PetsService;
    let firestore: any;
    let mockCollection: any;

    // Datos de prueba
    const mockPetAvailable = {
        id: 'pet-1',
        nombre: 'Max',
        tipoMascota: 'Perro',
        status: 'available',
        creadorId: 'user-1'
    };

    const mockPetAdopted = {
        id: 'pet-2',
        nombre: 'Luna',
        tipoMascota: 'Gato',
        status: 'adopted',
        creadorId: 'user-2'
    };

    const mockPetPending = {
        id: 'pet-3',
        nombre: 'Rocky',
        tipoMascota: 'Perro',
        status: 'pending',
        creadorId: 'user-1'
    };

    beforeEach(() => {
        mockCollection = createMockCollection([mockPetAvailable, mockPetAdopted, mockPetPending]);

        const mockFirestore = {
            collection: jasmine.createSpy('collection').and.returnValue(mockCollection)
        };

        const mockPetImageService = {
            validateImageUrl: jasmine.createSpy('validateImageUrl').and.returnValue(of(true)),
            refreshImageUrl: jasmine.createSpy('refreshImageUrl').and.returnValue(of('http://example.com/new-image.jpg'))
        };

        TestBed.configureTestingModule({
            providers: [
                PetsService,
                { provide: AngularFirestore, useValue: mockFirestore },
                { provide: PetImageService, useValue: mockPetImageService }
            ]
        });

        service = TestBed.inject(PetsService);
        firestore = TestBed.inject(AngularFirestore);
    });

    // ==========================================
    // Creación del servicio
    // ==========================================
    describe('Service Creation', () => {
        it('should be created', () => {
            expect(service).toBeTruthy();
        });
    });

    // ==========================================
    // canModifyPet
    // ==========================================
    describe('canModifyPet', () => {
        it('should return true for pets with "available" status', async () => {
            const result = await service.canModifyPet('pet-1');
            expect(result).toBeTrue();
        });

        it('should return false for pets with "adopted" status', async () => {
            const result = await service.canModifyPet('pet-2');
            expect(result).toBeFalse();
        });

        it('should return false for pets with "pending" status', async () => {
            const result = await service.canModifyPet('pet-3');
            expect(result).toBeFalse();
        });

        it('should throw error for non-existent pets', async () => {
            mockCollection.doc.and.returnValue({
                get: jasmine.createSpy('get').and.returnValue(of(createMockSnapshot(null, false)))
            });

            await expectAsync(service.canModifyPet('non-existent'))
                .toBeRejectedWithError('Mascota no encontrada');
        });
    });

    // ==========================================
    // canDeletePet
    // ==========================================
    describe('canDeletePet', () => {
        it('should return true for pets with "available" status', async () => {
            const result = await service.canDeletePet('pet-1');
            expect(result).toBeTrue();
        });

        it('should return false for pets with "adopted" status', async () => {
            const result = await service.canDeletePet('pet-2');
            expect(result).toBeFalse();
        });

        it('should return false for pets with "pending" status', async () => {
            const result = await service.canDeletePet('pet-3');
            expect(result).toBeFalse();
        });
    });

    // ==========================================
    // getAllPets
    // ==========================================
    describe('getAllPets', () => {
        it('should return all pets', (done) => {
            service.getAllPets().subscribe(pets => {
                expect(pets.length).toBe(3);
                expect(firestore.collection).toHaveBeenCalledWith('mascotas');
                done();
            });
        });

        it('should include pet id in results', (done) => {
            service.getAllPets().subscribe(pets => {
                expect(pets[0].id).toBeDefined();
                done();
            });
        });
    });

    // ==========================================
    // getPet
    // ==========================================
    describe('getPet', () => {
        it('should return a pet by id', (done) => {
            service.getPet('pet-1').subscribe(pet => {
                expect(pet).toBeDefined();
                expect(pet?.nombre).toBe('Max');
                done();
            });
        });

        it('should return undefined for non-existent pet', (done) => {
            mockCollection.doc.and.returnValue({
                snapshotChanges: jasmine.createSpy('snapshotChanges').and.returnValue(
                    of({ payload: { exists: false, data: () => null, id: 'non-existent' } })
                )
            });

            service.getPet('non-existent').subscribe(pet => {
                expect(pet).toBeUndefined();
                done();
            });
        });
    });

    // ==========================================
    // createPet
    // ==========================================
    describe('createPet', () => {
        it('should add a new pet to the collection', async () => {
            const newPet = {
                nombre: 'Buddy',
                tipoMascota: 'Perro',
                status: 'available'
            } as any;

            const result = await service.createPet(newPet);
            expect(firestore.collection).toHaveBeenCalledWith('mascotas');
            expect(mockCollection.add).toHaveBeenCalledWith(newPet);
            expect(result.id).toBe('new-pet-id');
        });
    });

    // ==========================================
    // updatePet
    // ==========================================
    describe('updatePet', () => {
        it('should update pet data', async () => {
            const updateData = { nombre: 'Max Updated' };
            const mockDocRef = {
                update: jasmine.createSpy('update').and.returnValue(Promise.resolve())
            };
            mockCollection.doc.and.returnValue(mockDocRef);

            await service.updatePet('pet-1', updateData);
            expect(mockDocRef.update).toHaveBeenCalledWith(updateData);
        });
    });

    // ==========================================
    // updatePetSafe
    // ==========================================
    describe('updatePetSafe', () => {
        it('should update pet if status is "available"', async () => {
            const mockDocRef = {
                get: jasmine.createSpy('get').and.returnValue(of(createMockSnapshot(mockPetAvailable))),
                update: jasmine.createSpy('update').and.returnValue(Promise.resolve())
            };
            mockCollection.doc.and.returnValue(mockDocRef);

            await expectAsync(service.updatePetSafe('pet-1', { nombre: 'New Name' }))
                .toBeResolved();
        });

        it('should throw error if pet is in adoption process', async () => {
            const mockDocRef = {
                get: jasmine.createSpy('get').and.returnValue(of(createMockSnapshot(mockPetPending)))
            };
            mockCollection.doc.and.returnValue(mockDocRef);

            await expectAsync(service.updatePetSafe('pet-3', { nombre: 'New Name' }))
                .toBeRejectedWithError('No se puede modificar esta mascota porque está en proceso de adopción');
        });
    });

    // ==========================================
    // deletePetSafe
    // ==========================================
    describe('deletePetSafe', () => {
        it('should delete pet if status is "available"', async () => {
            const mockDocRef = {
                get: jasmine.createSpy('get').and.returnValue(of(createMockSnapshot(mockPetAvailable))),
                delete: jasmine.createSpy('delete').and.returnValue(Promise.resolve())
            };
            mockCollection.doc.and.returnValue(mockDocRef);

            await expectAsync(service.deletePetSafe('pet-1')).toBeResolved();
            expect(mockDocRef.delete).toHaveBeenCalled();
        });

        it('should throw error if pet is adopted', async () => {
            const mockDocRef = {
                get: jasmine.createSpy('get').and.returnValue(of(createMockSnapshot(mockPetAdopted)))
            };
            mockCollection.doc.and.returnValue(mockDocRef);

            await expectAsync(service.deletePetSafe('pet-2'))
                .toBeRejectedWithError('No se puede eliminar esta mascota porque está en proceso de adopción');
        });
    });

    // ==========================================
    // getPetStatus
    // ==========================================
    describe('getPetStatus', () => {
        it('should return the pet status', async () => {
            const status = await service.getPetStatus('pet-1');
            expect(status).toBe('available');
        });
    });

    // ==========================================
    // hasPendingRequests
    // ==========================================
    describe('hasPendingRequests', () => {
        it('should return true if pending requests exist', async () => {
            firestore.collection.and.returnValue({
                get: jasmine.createSpy('get').and.returnValue(of({
                    empty: false,
                    docs: [{ data: () => ({ status: 'pending' }) }]
                }))
            });

            const result = await service.hasPendingRequests('pet-1');
            expect(result).toBeTrue();
        });

        it('should return false if no pending requests', async () => {
            firestore.collection.and.returnValue({
                get: jasmine.createSpy('get').and.returnValue(of({
                    empty: true,
                    docs: []
                }))
            });

            const result = await service.hasPendingRequests('pet-1');
            expect(result).toBeFalse();
        });
    });

    // ==========================================
    // getFilteredPets
    // ==========================================
    describe('getFilteredPets', () => {
        it('should filter pets by criteria', (done) => {
            const filters = { tipoMascota: 'Perro' };

            service.getFilteredPets(filters).subscribe(pets => {
                expect(firestore.collection).toHaveBeenCalled();
                done();
            });
        });
    });

    // ==========================================
    // getPetsBySpeciesCount
    // ==========================================
    describe('getPetsBySpeciesCount', () => {
        it('should count pets by species', (done) => {
            mockCollection.valueChanges.and.returnValue(of([
                { tipoMascota: 'Perro' },
                { tipoMascota: 'Perro' },
                { tipoMascota: 'Gato' },
                { tipoMascota: 'Conejo' }
            ]));

            service.getPetsBySpeciesCount().subscribe(counts => {
                expect(counts.dogs).toBe(2);
                expect(counts.cats).toBe(1);
                expect(counts.others).toBe(1);
                done();
            });
        });
    });

    // ==========================================
    // getCount
    // ==========================================
    describe('getCount', () => {
        it('should return total pet count', (done) => {
            mockCollection.get.and.returnValue(of({ size: 10 }));

            service.getCount().subscribe(count => {
                expect(count).toBe(10);
                done();
            });
        });
    });

    // ==========================================
    // getPetsForUser
    // ==========================================
    describe('getPetsForUser', () => {
        it('should return pets for a specific user', (done) => {
            const userPets = [mockPetAvailable, mockPetPending];
            mockCollection.snapshotChanges.and.returnValue(
                of(userPets.map(p => createMockDoc(p)))
            );

            service.getPetsForUser('user-1').subscribe(pets => {
                expect(pets.length).toBeGreaterThan(0);
                done();
            });
        });
    });
});
