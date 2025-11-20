import { Component, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '../../../models/user';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.page.html',
  styleUrls: ['./users.page.scss'],
})
export class UsersPage implements OnDestroy {
  users$: Observable<User[]>;
  filteredUsers: User[] = [];
  searchTerm: string = '';
  currentFilter: string = 'all'; // 'all', 'admins', 'blocked'
  currentSort: string = 'nameAsc'; // 'nameAsc', 'nameDesc', 'emailAsc', 'emailDesc'
  isMultiSelectActive: boolean = false;
  selectedUsers: { [uid: string]: boolean } = {};
  limit: number = 15;
  lastUser: any = null;

  private usersSubscription: Subscription;

  constructor(private firestore: AngularFirestore, private alertController: AlertController, private router: Router, private toastService: ToastService) {
    this.fetchUsers();
  }

  fetchUsers(infiniteScroll?: any) {
    this.users$ = this.firestore.collection<User>('users', ref => {
      let query: any = ref;

      if (this.currentFilter === 'admins') {
        query = query.where('isAdmin', '==', true);
      } else if (this.currentFilter === 'blocked') {
        query = query.where('isBlocked', '==', true);
      }

      switch (this.currentSort) {
        case 'nameAsc':
          query = query.orderBy('nombreCompleto', 'asc');
          break;
        case 'nameDesc':
          query = query.orderBy('nombreCompleto', 'desc');
          break;
        case 'emailAsc':
          query = query.orderBy('email', 'asc');
          break;
        case 'emailDesc':
          query = query.orderBy('email', 'desc');
          break;
      }

      if (this.lastUser) {
        query = query.startAfter(this.lastUser);
      }

      return query.limit(this.limit);
    }).valueChanges({ idField: 'uid' }).pipe(
      map(users => users.map(user => ({
        ...user,
        createdAt: (user.createdAt as any)?.toDate()
      })))
    );

    this.usersSubscription = this.users$.subscribe(users => {
      if (infiniteScroll) {
        this.filteredUsers = [...this.filteredUsers, ...users];
        infiniteScroll.target.complete();
        if (users.length < this.limit) {
          infiniteScroll.target.disabled = true;
        }
      } else {
        this.applySearchFilter(users);
      }
      this.lastUser = users[users.length - 1];
    });
  }

  applySearchFilter(users: User[]) {
    if (this.searchTerm) {
      this.filteredUsers = users.filter(user =>
        user.nombreCompleto.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    } else {
      this.filteredUsers = users;
    }
  }

  applyFiltersAndSort() {
    this.lastUser = null;
    this.fetchUsers();
  }

  loadMore(event: any) {
    this.fetchUsers(event);
  }

  createUser() {
    this.router.navigate(['/admin/users/create']);
  }

  editUser(uid: string) {
    this.router.navigate(['/admin/users/edit', uid]);
  }

  toggleMultiSelect(uid?: string) {
    if (uid && !this.isMultiSelectActive) {
      this.isMultiSelectActive = true;
      this.selectedUsers[uid] = true;
    } else {
      this.isMultiSelectActive = false;
      this.selectedUsers = {};
    }
  }

  selectUser(uid: string, isSelected: boolean) {
    this.selectedUsers[uid] = isSelected;
  }

  isUserSelected(uid: string): boolean {
    return this.isMultiSelectActive && this.selectedUsers[uid];
  }

  countSelectedUsers(): number {
    return Object.values(this.selectedUsers).filter(Boolean).length;
  }

  async presentBatchActionAlert(action: 'block' | 'unblock' | 'delete') {
    const selectedCount = this.countSelectedUsers();
    if (selectedCount === 0) {
      this.toastService.presentToast('No hay usuarios seleccionados.', 'warning', 'alert-circle-outline');
      return;
    }

    let header, message, handler;

    switch (action) {
      case 'block':
        header = 'Bloquear Usuarios';
        message = `¿Estás seguro de que deseas bloquear a los ${selectedCount} usuarios seleccionados?`;
        handler = () => this.blockSelectedUsers();
        break;
      case 'unblock':
        header = 'Desbloquear Usuarios';
        message = `¿Estás seguro de que deseas desbloquear a los ${selectedCount} usuarios seleccionados?`;
        handler = () => this.unblockSelectedUsers();
        break;
      case 'delete':
        header = 'Eliminar Usuarios';
        message = `¿Estás seguro de que deseas eliminar a los ${selectedCount} usuarios seleccionados? Esta acción no se puede deshacer.`;
        handler = () => this.deleteSelectedUsers();
        break;
    }

    const alert = await this.alertController.create({
      header,
      message,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Aceptar', handler },
      ],
    });
    await alert.present();
  }

  async blockSelectedUsers() {
    const uids = Object.keys(this.selectedUsers).filter(uid => this.selectedUsers[uid]);
    const batch = this.firestore.firestore.batch();
    uids.forEach(uid => {
      const userRef = this.firestore.collection('users').doc(uid).ref;
      batch.update(userRef, { isBlocked: true });
    });
    await batch.commit();
    this.toastService.presentToast(`${uids.length} usuarios bloqueados.`, 'success', 'checkmark-circle-outline');
    this.toggleMultiSelect();
  }

  async unblockSelectedUsers() {
    const uids = Object.keys(this.selectedUsers).filter(uid => this.selectedUsers[uid]);
    const batch = this.firestore.firestore.batch();
    uids.forEach(uid => {
      const userRef = this.firestore.collection('users').doc(uid).ref;
      batch.update(userRef, { isBlocked: false });
    });
    await batch.commit();
    this.toastService.presentToast(`${uids.length} usuarios desbloqueados.`, 'success', 'checkmark-circle-outline');
    this.toggleMultiSelect();
  }

  async deleteSelectedUsers() {
    const uids = Object.keys(this.selectedUsers).filter(uid => this.selectedUsers[uid]);
    const batch = this.firestore.firestore.batch();
    uids.forEach(uid => {
      const userRef = this.firestore.collection('users').doc(uid).ref;
      batch.delete(userRef);
    });
    await batch.commit();
    this.toastService.presentToast(`${uids.length} usuarios eliminados.`, 'success', 'checkmark-circle-outline');
    this.toggleMultiSelect();
  }

  async deleteUser(uid: string) {
    const alert = await this.alertController.create({
      header: 'Confirmar Eliminación',
      message: '¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Eliminar',
          handler: async () => {
            await this.firestore.collection('users').doc(uid).delete();
            // Note: This only deletes the Firestore document. Firebase Auth user needs to be deleted separately (e.g., via Cloud Functions).
            this.toastService.presentToast('Usuario eliminado correctamente.', 'success', 'checkmark-circle-outline');
          },
        },
      ],
    });
    await alert.present();
  }

  async toggleAdmin(user: User) {
    const newAdminStatus = !user.isAdmin;
    await this.firestore.collection('users').doc(user.uid).update({ isAdmin: newAdminStatus });
    this.toastService.presentToast(`Usuario ${user.nombreCompleto} ${newAdminStatus ? 'ahora es administrador.' : 'ya no es administrador.'}`, 'success', 'checkmark-circle-outline');
  }

  async toggleBlocked(user: User) {
    const newBlockedStatus = !user.isBlocked;
    await this.firestore.collection('users').doc(user.uid).update({ isBlocked: newBlockedStatus });
    this.toastService.presentToast(`Usuario ${user.nombreCompleto} ${newBlockedStatus ? 'ha sido bloqueado.' : 'ha sido desbloqueado.'}`, 'success', 'checkmark-circle-outline');
  }

  ngOnDestroy() {
    if (this.usersSubscription) {
      this.usersSubscription.unsubscribe();
    }
  }
}
