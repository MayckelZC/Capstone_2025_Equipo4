import { createReducer, on } from '@ngrx/store';
import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { 
  PublicUserProfile, 
  UserState, 
  initialUserState, 
  initialCurrentUserState, 
  initialUsersState 
} from './users.state';
import { LoadingState } from '../app.state';
import * as UserActions from './users.actions';

// Entity adapter para manejo de usuarios
export const userAdapter: EntityAdapter<PublicUserProfile> = createEntityAdapter<PublicUserProfile>({
  selectId: (user: PublicUserProfile) => user.id,
  sortComparer: (a: PublicUserProfile, b: PublicUserProfile) => 
    a.displayName.localeCompare(b.displayName)
});

// Reducer de usuario actual
const currentUserReducer = createReducer(
  initialCurrentUserState,

  // Autenticación
  on(UserActions.login, (state) => ({
    ...state,
    loading: LoadingState.LOADING,
    error: null
  })),

  on(UserActions.loginSuccess, (state, { user, token }) => ({
    ...state,
    loading: LoadingState.LOADED,
    error: null,
    user,
    isAuthenticated: true
  })),

  on(UserActions.loginFailure, (state, { error }) => ({
    ...state,
    loading: LoadingState.ERROR,
    error,
    isAuthenticated: false
  })),

  on(UserActions.logout, (state) => ({
    ...initialCurrentUserState,
    loading: LoadingState.LOADED
  })),

  // Carga de usuario actual
  on(UserActions.loadCurrentUser, (state) => ({
    ...state,
    loading: LoadingState.LOADING,
    error: null
  })),

  on(UserActions.loadCurrentUserSuccess, (state, { user }) => ({
    ...state,
    loading: LoadingState.LOADED,
    error: null,
    user,
    isAuthenticated: true
  })),

  on(UserActions.loadCurrentUserFailure, (state, { error }) => ({
    ...state,
    loading: LoadingState.ERROR,
    error
  })),

  // Actualización de perfil
  on(UserActions.updateCurrentUser, (state) => ({
    ...state,
    loading: LoadingState.LOADING,
    error: null
  })),

  on(UserActions.updateCurrentUserSuccess, (state, { user }) => ({
    ...state,
    loading: LoadingState.LOADED,
    error: null,
    user
  })),

  on(UserActions.updateCurrentUserFailure, (state, { error }) => ({
    ...state,
    loading: LoadingState.ERROR,
    error
  })),

  // Notificaciones
  on(UserActions.loadNotificationsSuccess, (state, { notifications }) => ({
    ...state,
    notifications,
    unreadNotificationCount: notifications.filter(n => !n.read).length
  })),

  on(UserActions.markNotificationAsRead, (state, { notificationId }) => ({
    ...state,
    notifications: state.notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    ),
    unreadNotificationCount: Math.max(0, state.unreadNotificationCount - 1)
  })),

  on(UserActions.markAllNotificationsAsRead, (state) => ({
    ...state,
    notifications: state.notifications.map(n => ({ ...n, read: true })),
    unreadNotificationCount: 0
  })),

  // Estadísticas
  on(UserActions.loadUserStatisticsSuccess, (state, { statistics }) => ({
    ...state,
    statistics
  }))
);

// Reducer de otros usuarios
const usersReducer = createReducer(
  initialUsersState,

  on(UserActions.loadUsers, (state) => ({
    ...state,
    loading: LoadingState.LOADING,
    error: null
  })),

  on(UserActions.loadUsersSuccess, (state, { users }) => 
    userAdapter.setAll(users, {
      ...state,
      loading: LoadingState.LOADED,
      error: null
    })
  ),

  on(UserActions.loadUsersFailure, (state, { error }) => ({
    ...state,
    loading: LoadingState.ERROR,
    error
  })),

  on(UserActions.selectUser, (state, { userId }) => ({
    ...state,
    selectedUserId: userId
  })),

  on(UserActions.clearSelectedUser, (state) => ({
    ...state,
    selectedUserId: null,
    selectedUserDetails: null
  })),

  on(UserActions.searchUsersSuccess, (state, { users, query }) => 
    userAdapter.upsertMany(users, {
      ...state,
      searchResults: users.map(u => u.id),
      searchQuery: query
    })
  )
);

// Reducer principal combinado
export const userReducer = createReducer(
  initialUserState,

  // Manejar acciones de usuario actual
  on(UserActions.login, 
     UserActions.loginSuccess, 
     UserActions.loginFailure,
     UserActions.logout,
     UserActions.loadCurrentUser,
     UserActions.loadCurrentUserSuccess,
     UserActions.loadCurrentUserFailure,
     UserActions.updateCurrentUser,
     UserActions.updateCurrentUserSuccess,
     UserActions.updateCurrentUserFailure,
     UserActions.loadNotificationsSuccess,
     UserActions.markNotificationAsRead,
     UserActions.markAllNotificationsAsRead,
     UserActions.loadUserStatisticsSuccess,
     (state, action) => ({
    ...state,
    current: currentUserReducer(state.current, action)
  })),

  // Manejar acciones de otros usuarios
  on(UserActions.loadUsers,
     UserActions.loadUsersSuccess,
     UserActions.loadUsersFailure,
     UserActions.selectUser,
     UserActions.clearSelectedUser,
     UserActions.searchUsersSuccess,
     (state, action) => ({
    ...state,
    users: usersReducer(state.users, action)
  }))
);

// Selectores del entity adapter
export const {
  selectIds,
  selectEntities,
  selectAll,
  selectTotal,
} = userAdapter.getSelectors();