import { createSelector, createFeatureSelector } from '@ngrx/store';
import { UserState, User, PublicUserProfile } from './users.state';
import { selectIds, selectEntities, selectAll, selectTotal } from './users.reducer';

// Feature selector
export const selectUserState = createFeatureSelector<UserState>('users');

// Selectores de usuario actual
export const selectCurrentUserState = createSelector(
  selectUserState,
  (state) => state.current
);

export const selectCurrentUser = createSelector(
  selectCurrentUserState,
  (state) => state.user
);

export const selectIsAuthenticated = createSelector(
  selectCurrentUserState,
  (state) => state.isAuthenticated
);

export const selectCurrentUserLoading = createSelector(
  selectCurrentUserState,
  (state) => state.loading
);

export const selectCurrentUserError = createSelector(
  selectCurrentUserState,
  (state) => state.error
);

// Selectores de notificaciones
export const selectNotifications = createSelector(
  selectCurrentUserState,
  (state) => state.notifications
);

export const selectUnreadNotificationCount = createSelector(
  selectCurrentUserState,
  (state) => state.unreadNotificationCount
);

export const selectUnreadNotifications = createSelector(
  selectNotifications,
  (notifications) => notifications.filter(n => !n.read)
);

// Selectores de estadísticas
export const selectUserStatistics = createSelector(
  selectCurrentUserState,
  (state) => state.statistics
);

// Selectores de otros usuarios
export const selectUsersState = createSelector(
  selectUserState,
  (state) => state.users
);

export const selectAllUsers = createSelector(selectUsersState, selectAll);
export const selectUserEntities = createSelector(selectUsersState, selectEntities);
export const selectUserIds = createSelector(selectUsersState, selectIds);
export const selectTotalUsers = createSelector(selectUsersState, selectTotal);

export const selectUsersLoading = createSelector(
  selectUsersState,
  (state) => state.loading
);

export const selectUsersError = createSelector(
  selectUsersState,
  (state) => state.error
);

export const selectSelectedUserId = createSelector(
  selectUsersState,
  (state) => state.selectedUserId
);

export const selectSelectedUser = createSelector(
  selectUserEntities,
  selectSelectedUserId,
  (entities, selectedId) => selectedId ? entities[selectedId] : null
);

export const selectUserSearchResults = createSelector(
  selectUsersState,
  (state) => state.searchResults
);

export const selectSearchQuery = createSelector(
  selectUsersState,
  (state) => state.searchQuery
);

// Selectores útiles
export const selectCurrentUserId = createSelector(
  selectCurrentUser,
  (user) => user?.id || null
);

export const selectCurrentUserDisplayName = createSelector(
  selectCurrentUser,
  (user) => user?.displayName || ''
);

export const selectCurrentUserAvatar = createSelector(
  selectCurrentUser,
  (user) => user?.avatar || '/assets/imgs/default-avatar.png'
);

export const selectIsUserVerified = createSelector(
  selectCurrentUser,
  (user) => user?.verification.email && user?.verification.phone
);

export const selectUserPreferences = createSelector(
  selectCurrentUser,
  (user) => user?.preferences
);