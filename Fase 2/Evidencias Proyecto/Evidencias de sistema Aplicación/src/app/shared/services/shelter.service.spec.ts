import { TestBed } from '@angular/core/testing';
import { ShelterService } from './shelter.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { of } from 'rxjs';
import { Shelter } from '@models/Shelter';

describe('ShelterService', () => {
    let service: ShelterService;
    let firestoreMock: any;

    const mockShelters: Shelter[] = [
        { id: 'shelter-1', nombre: 'Refugio 1', direccion: 'Calle 1', telefono: '123456' } as Shelter,
        { id: 'shelter-2', nombre: 'Refugio 2', direccion: 'Calle 2', telefono: '654321' } as Shelter
    ];

    beforeEach(() => {
        const mockDocRef = {
            valueChanges: jasmine.createSpy('valueChanges').and.returnValue(of(mockShelters[0])),
            update: jasmine.createSpy('update').and.returnValue(Promise.resolve()),
            delete: jasmine.createSpy('delete').and.returnValue(Promise.resolve())
        };

        const mockCollectionRef = {
            valueChanges: jasmine.createSpy('valueChanges').and.returnValue(of(mockShelters)),
            add: jasmine.createSpy('add').and.returnValue(Promise.resolve({ id: 'new-shelter' })),
            doc: jasmine.createSpy('doc').and.returnValue(mockDocRef)
        };

        firestoreMock = {
            collection: jasmine.createSpy('collection').and.returnValue(mockCollectionRef)
        };

        TestBed.configureTestingModule({
            providers: [
                ShelterService,
                { provide: AngularFirestore, useValue: firestoreMock }
            ]
        });

        service = TestBed.inject(ShelterService);
    });

    describe('Service Creation', () => {
        it('should be created', () => {
            expect(service).toBeTruthy();
        });
    });

    describe('getShelters', () => {
        it('should return all shelters', (done) => {
            service.getShelters().subscribe(shelters => {
                expect(shelters).toBeDefined();
                expect(shelters.length).toBe(2);
                done();
            });
        });

        it('should query shelters collection', (done) => {
            service.getShelters().subscribe(() => {
                expect(firestoreMock.collection).toHaveBeenCalledWith('shelters');
                done();
            });
        });
    });

    describe('addShelter', () => {
        it('should add a new shelter', async () => {
            const newShelter = { nombre: 'Nuevo Refugio', direccion: 'Nueva Calle' } as Omit<Shelter, 'id'>;
            const result = await service.addShelter(newShelter);

            expect(result).toBeDefined();
            expect(firestoreMock.collection).toHaveBeenCalledWith('shelters');
        });
    });

    describe('getShelter', () => {
        it('should get shelter by id', (done) => {
            service.getShelter('shelter-1').subscribe(shelter => {
                expect(shelter).toBeDefined();
                done();
            });
        });

        it('should query correct document', (done) => {
            service.getShelter('shelter-1').subscribe(() => {
                expect(firestoreMock.collection).toHaveBeenCalledWith('shelters');
                done();
            });
        });
    });

    describe('updateShelter', () => {
        it('should update a shelter', async () => {
            await service.updateShelter('shelter-1', { nombre: 'Updated Name' });
            expect(firestoreMock.collection).toHaveBeenCalledWith('shelters');
        });
    });

    describe('deleteShelter', () => {
        it('should delete a shelter', async () => {
            await service.deleteShelter('shelter-1');
            expect(firestoreMock.collection).toHaveBeenCalledWith('shelters');
        });
    });
});
