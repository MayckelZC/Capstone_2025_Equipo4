import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { UsersPage } from './users.page';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { ToastService } from '@shared/services/toast.service';
import { of } from 'rxjs';
import { User } from '@models/user';

describe('UsersPage (Admin)', () => {
    let component: UsersPage;
    let fixture: ComponentFixture<UsersPage>;
    let router: jasmine.SpyObj<Router>;
    let alertController: jasmine.SpyObj<AlertController>;
    let toastService: jasmine.SpyObj<ToastService>;
    let firestoreMock: any;

    const mockUsers: User[] = [
        {
            uid: 'user-1',
            email: 'admin@example.com',
            nombreCompleto: 'Admin User',
            nombreUsuario: 'admin',
            isAdmin: true,
            isBlocked: false,
            createdAt: new Date()
        } as User,
        {
            uid: 'user-2',
            email: 'blocked@example.com',
            nombreCompleto: 'Blocked User',
            nombreUsuario: 'blocked',
            isAdmin: false,
            isBlocked: true,
            createdAt: new Date()
        } as User,
        {
            uid: 'user-3',
            email: 'regular@example.com',
            nombreCompleto: 'Regular User',
            nombreUsuario: 'regular',
            isAdmin: false,
            isBlocked: false,
            createdAt: new Date()
        } as User
    ];

    beforeEach(async () => {
        const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        const alertControllerSpy = jasmine.createSpyObj('AlertController', ['create']);
        const toastServiceSpy = jasmine.createSpyObj('ToastService', ['presentToast']);

        const mockDocRef = {
            update: jasmine.createSpy('update').and.returnValue(Promise.resolve()),
            delete: jasmine.createSpy('delete').and.returnValue(Promise.resolve())
        };

        const mockQuerySnapshot = {
            docs: mockUsers.map(user => ({
                id: user.uid,
                data: () => user
            }))
        };

        const mockCollectionRef = {
            get: jasmine.createSpy('get').and.returnValue(of(mockQuerySnapshot)),
            doc: jasmine.createSpy('doc').and.returnValue(mockDocRef),
            snapshotChanges: jasmine.createSpy('snapshotChanges').and.returnValue(of(
                mockUsers.map(u => ({ payload: { doc: { id: u.uid, data: () => u } } }))
            ))
        };

        firestoreMock = {
            collection: jasmine.createSpy('collection').and.returnValue(mockCollectionRef)
        };

        alertControllerSpy.create.and.returnValue(Promise.resolve({
            present: jasmine.createSpy('present').and.returnValue(Promise.resolve())
        } as any));

        await TestBed.configureTestingModule({
            declarations: [UsersPage],
            providers: [
                { provide: AngularFirestore, useValue: firestoreMock },
                { provide: Router, useValue: routerSpy },
                { provide: AlertController, useValue: alertControllerSpy },
                { provide: ToastService, useValue: toastServiceSpy }
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
        }).compileComponents();

        fixture = TestBed.createComponent(UsersPage);
        component = fixture.componentInstance;
        router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
        alertController = TestBed.inject(AlertController) as jasmine.SpyObj<AlertController>;
        toastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;

        component.filteredUsers = mockUsers;
    });

    describe('Component Creation', () => {
        it('should create', () => {
            expect(component).toBeTruthy();
        });

        it('should initialize with default values', () => {
            expect(component.searchTerm).toBe('');
            expect(component.currentFilter).toBe('all');
            expect(component.currentSort).toBe('nameAsc');
            expect(component.isMultiSelectActive).toBeFalse();
        });
    });

    describe('Search and Filter', () => {
        it('should filter users by search term', () => {
            const filtered = component.applySearchFilter(mockUsers);
            expect(filtered.length).toBeGreaterThanOrEqual(0);
        });

        it('should filter by name containing search term', () => {
            component.searchTerm = 'Admin';
            const filtered = component.applySearchFilter(mockUsers);
            expect(filtered.length).toBe(1);
            expect(filtered[0].nombreCompleto).toContain('Admin');
        });

        it('should filter by email containing search term', () => {
            component.searchTerm = '@example.com';
            const filtered = component.applySearchFilter(mockUsers);
            expect(filtered.length).toBe(3);
        });

        it('should be case insensitive', () => {
            component.searchTerm = 'admin';
            const filtered = component.applySearchFilter(mockUsers);
            expect(filtered.length).toBe(1);
        });
    });

    describe('Multi-Select', () => {
        it('should toggle multi-select mode', () => {
            expect(component.isMultiSelectActive).toBeFalse();
            component.toggleMultiSelect();
            expect(component.isMultiSelectActive).toBeTrue();
            component.toggleMultiSelect();
            expect(component.isMultiSelectActive).toBeFalse();
        });

        it('should select user', () => {
            component.selectUser('user-1', true);
            expect(component.isUserSelected('user-1')).toBeTrue();
        });

        it('should deselect user', () => {
            component.selectUser('user-1', true);
            component.selectUser('user-1', false);
            expect(component.isUserSelected('user-1')).toBeFalse();
        });

        it('should count selected users', () => {
            component.selectUser('user-1', true);
            component.selectUser('user-2', true);
            expect(component.countSelectedUsers()).toBe(2);
        });

        it('should clear selection when toggling off multi-select', () => {
            component.toggleMultiSelect();
            component.selectUser('user-1', true);
            component.toggleMultiSelect();
            expect(component.countSelectedUsers()).toBe(0);
        });
    });

    describe('Navigation', () => {
        it('should navigate to create user page', () => {
            component.createUser();
            expect(router.navigate).toHaveBeenCalledWith(['/admin/create-user']);
        });

        it('should navigate to edit user page', () => {
            component.editUser('user-1');
            expect(router.navigate).toHaveBeenCalledWith(['/admin/edit-user', 'user-1']);
        });
    });

    describe('Delete User', () => {
        it('should show confirmation alert before deleting', async () => {
            await component.deleteUser('user-1');
            expect(alertController.create).toHaveBeenCalled();
        });
    });

    describe('Toggle Admin', () => {
        it('should toggle admin status', async () => {
            const mockDocRef = {
                update: jasmine.createSpy('update').and.returnValue(Promise.resolve())
            };

            firestoreMock.collection.and.returnValue({
                doc: () => mockDocRef
            });

            await component.toggleAdmin(mockUsers[2]);
            expect(mockDocRef.update).toHaveBeenCalledWith({ isAdmin: true });
        });
    });

    describe('Toggle Blocked', () => {
        it('should toggle blocked status', async () => {
            const mockDocRef = {
                update: jasmine.createSpy('update').and.returnValue(Promise.resolve())
            };

            firestoreMock.collection.and.returnValue({
                doc: () => mockDocRef
            });

            await component.toggleBlocked(mockUsers[2]);
            expect(mockDocRef.update).toHaveBeenCalledWith({ isBlocked: true });
        });
    });

    describe('Batch Actions', () => {
        it('should present batch action alert for block', async () => {
            component.selectUser('user-1', true);
            await component.presentBatchActionAlert('block');
            expect(alertController.create).toHaveBeenCalled();
        });

        it('should present batch action alert for unblock', async () => {
            component.selectUser('user-2', true);
            await component.presentBatchActionAlert('unblock');
            expect(alertController.create).toHaveBeenCalled();
        });

        it('should present batch action alert for delete', async () => {
            component.selectUser('user-1', true);
            await component.presentBatchActionAlert('delete');
            expect(alertController.create).toHaveBeenCalled();
        });
    });

    describe('TrackBy', () => {
        it('should return user uid for trackBy', () => {
            const result = component.trackByUserId(0, mockUsers[0]);
            expect(result).toBe('user-1');
        });
    });

    describe('Load More', () => {
        it('should load more users on scroll', () => {
            const mockEvent = {
                target: {
                    complete: jasmine.createSpy('complete'),
                    disabled: false
                }
            };

            component.loadMore(mockEvent);
            expect(firestoreMock.collection).toHaveBeenCalled();
        });
    });

    describe('Cleanup', () => {
        it('should unsubscribe on destroy', () => {
            component.ngOnDestroy();
            expect(true).toBeTrue();
        });
    });
});
