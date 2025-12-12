import { TestBed } from '@angular/core/testing';
import { FavoriteService } from './favorite.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { of } from 'rxjs';
import { Favorite } from '@models/Favorite';

describe('FavoriteService', () => {
    let service: FavoriteService;
    let firestoreMock: any;

    const mockFavorites: Favorite[] = [
        { id: 'pet-1', petId: 'pet-1', createdAt: new Date() },
        { id: 'pet-2', petId: 'pet-2', createdAt: new Date() },
        { id: 'pet-3', petId: 'pet-3', createdAt: new Date() }
    ];

    beforeEach(() => {
        const mockDocRef = {
            set: jasmine.createSpy('set').and.returnValue(Promise.resolve()),
            delete: jasmine.createSpy('delete').and.returnValue(Promise.resolve())
        };

        const mockCollectionRef = {
            valueChanges: jasmine.createSpy('valueChanges').and.returnValue(of(mockFavorites)),
            doc: jasmine.createSpy('doc').and.returnValue(mockDocRef)
        };

        firestoreMock = {
            collection: jasmine.createSpy('collection').and.returnValue(mockCollectionRef)
        };

        TestBed.configureTestingModule({
            providers: [
                FavoriteService,
                { provide: AngularFirestore, useValue: firestoreMock }
            ]
        });

        service = TestBed.inject(FavoriteService);
    });

    describe('Service Creation', () => {
        it('should be created', () => {
            expect(service).toBeTruthy();
        });
    });

    describe('getFavorites', () => {
        it('should return favorites for user', (done) => {
            service.getFavorites('user-1').subscribe(favorites => {
                expect(favorites).toBeDefined();
                expect(favorites.length).toBe(3);
                done();
            });
        });

        it('should query correct collection path', () => {
            service.getFavorites('user-123').subscribe();
            expect(firestoreMock.collection).toHaveBeenCalledWith('users/user-123/favorites');
        });

        it('should return favorites with idField', (done) => {
            service.getFavorites('user-1').subscribe(favorites => {
                expect(favorites[0].id).toBeDefined();
                done();
            });
        });
    });

    describe('addFavorite', () => {
        it('should add a favorite', async () => {
            const mockDocRef = {
                set: jasmine.createSpy('set').and.returnValue(Promise.resolve())
            };

            firestoreMock.collection.and.returnValue({
                doc: () => mockDocRef
            });

            const result = await service.addFavorite('user-1', 'pet-new');
            expect(result).toBe('pet-new');
        });

        it('should use petId as document id', async () => {
            const mockDocRef = {
                set: jasmine.createSpy('set').and.returnValue(Promise.resolve())
            };

            const mockCollectionRef = {
                doc: jasmine.createSpy('doc').and.returnValue(mockDocRef)
            };

            firestoreMock.collection.and.returnValue(mockCollectionRef);

            await service.addFavorite('user-1', 'pet-123');
            expect(mockCollectionRef.doc).toHaveBeenCalledWith('pet-123');
        });

        it('should include petId and createdAt in document', async () => {
            const mockDocRef = {
                set: jasmine.createSpy('set').and.callFake((data: any) => {
                    expect(data.petId).toBe('pet-123');
                    expect(data.createdAt).toBeDefined();
                    return Promise.resolve();
                })
            };

            firestoreMock.collection.and.returnValue({
                doc: () => mockDocRef
            });

            await service.addFavorite('user-1', 'pet-123');
            expect(mockDocRef.set).toHaveBeenCalled();
        });
    });

    describe('removeFavorite', () => {
        it('should remove a favorite', async () => {
            const mockDocRef = {
                delete: jasmine.createSpy('delete').and.returnValue(Promise.resolve())
            };

            firestoreMock.collection.and.returnValue({
                doc: () => mockDocRef
            });

            await service.removeFavorite('user-1', 'pet-1');
            expect(mockDocRef.delete).toHaveBeenCalled();
        });

        it('should query correct collection path for removal', async () => {
            const mockDocRef = {
                delete: jasmine.createSpy('delete').and.returnValue(Promise.resolve())
            };

            firestoreMock.collection.and.returnValue({
                doc: () => mockDocRef
            });

            await service.removeFavorite('user-123', 'pet-456');
            expect(firestoreMock.collection).toHaveBeenCalledWith('users/user-123/favorites');
        });
    });

    describe('Error Handling', () => {
        it('should propagate errors when adding favorite fails', async () => {
            const mockDocRef = {
                set: jasmine.createSpy('set').and.returnValue(Promise.reject(new Error('Write failed')))
            };

            firestoreMock.collection.and.returnValue({
                doc: () => mockDocRef
            });

            await expectAsync(service.addFavorite('user-1', 'pet-1')).toBeRejected();
        });

        it('should propagate errors when removing favorite fails', async () => {
            const mockDocRef = {
                delete: jasmine.createSpy('delete').and.returnValue(Promise.reject(new Error('Delete failed')))
            };

            firestoreMock.collection.and.returnValue({
                doc: () => mockDocRef
            });

            await expectAsync(service.removeFavorite('user-1', 'pet-1')).toBeRejected();
        });
    });
});
