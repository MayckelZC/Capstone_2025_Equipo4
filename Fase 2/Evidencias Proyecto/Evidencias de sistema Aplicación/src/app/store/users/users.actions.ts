import { createAction, props } from '@ngrx/store';
import { User, PublicUserProfile, UserStatistics, UserReference } from './users.state';
import { AppNotification, UserPreferences } from '../app.state';

// Acciones de autenticación
export const login = createAction(
  '[Auth] Login',
  props<{ email: string; password: string }>()
);

export const loginSuccess = createAction(
  '[Auth] Login Success',
  props<{ user: User; token: string }>()
);

export const loginFailure = createAction(
  '[Auth] Login Failure',
  props<{ error: string }>()
);

export const register = createAction(
  '[Auth] Register',
  props<{ 
    email: string; 
    password: string; 
    displayName: string;
    firstName?: string;
    lastName?: string;
  }>()
);

export const registerSuccess = createAction(
  '[Auth] Register Success',
  props<{ user: User; token: string }>()
);

export const registerFailure = createAction(
  '[Auth] Register Failure',
  props<{ error: string }>()
);

export const logout = createAction('[Auth] Logout');

export const logoutComplete = createAction('[Auth] Logout Complete');

// Acciones de usuario actual
export const loadCurrentUser = createAction('[User] Load Current User');

export const loadCurrentUserSuccess = createAction(
  '[User] Load Current User Success',
  props<{ user: User }>()
);

export const loadCurrentUserFailure = createAction(
  '[User] Load Current User Failure',
  props<{ error: string }>()
);

export const updateCurrentUser = createAction(
  '[User] Update Current User',
  props<{ updates: Partial<User> }>()
);

export const updateCurrentUserSuccess = createAction(
  '[User] Update Current User Success',
  props<{ user: User }>()
);

export const updateCurrentUserFailure = createAction(
  '[User] Update Current User Failure',
  props<{ error: string }>()
);

// Acciones de perfil
export const uploadAvatar = createAction(
  '[User] Upload Avatar',
  props<{ file: File }>()
);

export const uploadAvatarSuccess = createAction(
  '[User] Upload Avatar Success',
  props<{ avatarUrl: string }>()
);

export const uploadAvatarFailure = createAction(
  '[User] Upload Avatar Failure',
  props<{ error: string }>()
);

export const updateProfile = createAction(
  '[User] Update Profile',
  props<{ profile: Partial<User> }>()
);

export const updateProfileSuccess = createAction(
  '[User] Update Profile Success',
  props<{ user: User }>()
);

export const updateProfileFailure = createAction(
  '[User] Update Profile Failure',
  props<{ error: string }>()
);

// Acciones de preferencias
export const updatePreferences = createAction(
  '[User] Update Preferences',
  props<{ preferences: Partial<UserPreferences> }>()
);

export const updatePreferencesSuccess = createAction(
  '[User] Update Preferences Success',
  props<{ preferences: UserPreferences }>()
);

export const updatePreferencesFailure = createAction(
  '[User] Update Preferences Failure',
  props<{ error: string }>()
);

// Acciones de verificación
export const verifyEmail = createAction('[User] Verify Email');

export const verifyEmailSuccess = createAction('[User] Verify Email Success');

export const verifyEmailFailure = createAction(
  '[User] Verify Email Failure',
  props<{ error: string }>()
);

export const verifyPhone = createAction(
  '[User] Verify Phone',
  props<{ phoneNumber: string }>()
);

export const verifyPhoneCode = createAction(
  '[User] Verify Phone Code',
  props<{ code: string }>()
);

export const verifyPhoneSuccess = createAction('[User] Verify Phone Success');

export const verifyPhoneFailure = createAction(
  '[User] Verify Phone Failure',
  props<{ error: string }>()
);

export const submitIdentityVerification = createAction(
  '[User] Submit Identity Verification',
  props<{ documents: File[] }>()
);

export const identityVerificationSuccess = createAction(
  '[User] Identity Verification Success'
);

export const identityVerificationFailure = createAction(
  '[User] Identity Verification Failure',
  props<{ error: string }>()
);

// Acciones de referencias
export const addReference = createAction(
  '[User] Add Reference',
  props<{ reference: Omit<UserReference, 'id' | 'verified' | 'verifiedAt'> }>()
);

export const addReferenceSuccess = createAction(
  '[User] Add Reference Success',
  props<{ reference: UserReference }>()
);

export const addReferenceFailure = createAction(
  '[User] Add Reference Failure',
  props<{ error: string }>()
);

export const updateReference = createAction(
  '[User] Update Reference',
  props<{ referenceId: string; updates: Partial<UserReference> }>()
);

export const deleteReference = createAction(
  '[User] Delete Reference',
  props<{ referenceId: string }>()
);

// Acciones de notificaciones
export const loadNotifications = createAction('[User] Load Notifications');

export const loadNotificationsSuccess = createAction(
  '[User] Load Notifications Success',
  props<{ notifications: AppNotification[] }>()
);

export const loadNotificationsFailure = createAction(
  '[User] Load Notifications Failure',
  props<{ error: string }>()
);

export const markNotificationAsRead = createAction(
  '[User] Mark Notification as Read',
  props<{ notificationId: string }>()
);

export const markAllNotificationsAsRead = createAction(
  '[User] Mark All Notifications as Read'
);

export const deleteNotification = createAction(
  '[User] Delete Notification',
  props<{ notificationId: string }>()
);

export const clearAllNotifications = createAction('[User] Clear All Notifications');

// Acciones de estadísticas
export const loadUserStatistics = createAction('[User] Load User Statistics');

export const loadUserStatisticsSuccess = createAction(
  '[User] Load User Statistics Success',
  props<{ statistics: UserStatistics }>()
);

export const loadUserStatisticsFailure = createAction(
  '[User] Load User Statistics Failure',
  props<{ error: string }>()
);

// Acciones de otros usuarios
export const loadUsers = createAction(
  '[Users] Load Users',
  props<{ filters?: any }>()
);

export const loadUsersSuccess = createAction(
  '[Users] Load Users Success',
  props<{ users: PublicUserProfile[] }>()
);

export const loadUsersFailure = createAction(
  '[Users] Load Users Failure',
  props<{ error: string }>()
);

export const searchUsers = createAction(
  '[Users] Search Users',
  props<{ query: string }>()
);

export const searchUsersSuccess = createAction(
  '[Users] Search Users Success',
  props<{ users: PublicUserProfile[]; query: string }>()
);

export const searchUsersFailure = createAction(
  '[Users] Search Users Failure',
  props<{ error: string }>()
);

export const selectUser = createAction(
  '[Users] Select User',
  props<{ userId: string }>()
);

export const clearSelectedUser = createAction('[Users] Clear Selected User');

export const loadUserDetails = createAction(
  '[Users] Load User Details',
  props<{ userId: string }>()
);

export const loadUserDetailsSuccess = createAction(
  '[Users] Load User Details Success',
  props<{ user: User }>()
);

export const loadUserDetailsFailure = createAction(
  '[Users] Load User Details Failure',
  props<{ error: string }>()
);

// Acciones de interacciones entre usuarios
export const blockUser = createAction(
  '[Users] Block User',
  props<{ userId: string }>()
);

export const unblockUser = createAction(
  '[Users] Unblock User',
  props<{ userId: string }>()
);

export const reportUser = createAction(
  '[Users] Report User',
  props<{ userId: string; reason: string; details: string }>()
);

export const rateUser = createAction(
  '[Users] Rate User',
  props<{ userId: string; rating: number; review?: string }>()
);

export const rateUserSuccess = createAction(
  '[Users] Rate User Success',
  props<{ userId: string; rating: number }>()
);

export const rateUserFailure = createAction(
  '[Users] Rate User Failure',
  props<{ error: string }>()
);

// Acciones de mensajería
export const sendMessage = createAction(
  '[Users] Send Message',
  props<{ recipientId: string; message: string; petId?: string }>()
);

export const sendMessageSuccess = createAction(
  '[Users] Send Message Success',
  props<{ conversationId: string }>()
);

export const sendMessageFailure = createAction(
  '[Users] Send Message Failure',
  props<{ error: string }>()
);

// Acciones de configuración de cuenta
export const changePassword = createAction(
  '[User] Change Password',
  props<{ currentPassword: string; newPassword: string }>()
);

export const changePasswordSuccess = createAction('[User] Change Password Success');

export const changePasswordFailure = createAction(
  '[User] Change Password Failure',
  props<{ error: string }>()
);

export const deleteAccount = createAction(
  '[User] Delete Account',
  props<{ password: string; reason?: string }>()
);

export const deleteAccountSuccess = createAction('[User] Delete Account Success');

export const deleteAccountFailure = createAction(
  '[User] Delete Account Failure',
  props<{ error: string }>()
);

// Acciones de sesión
export const extendSession = createAction('[User] Extend Session');

export const sessionExpired = createAction('[User] Session Expired');

export const refreshToken = createAction('[User] Refresh Token');

export const refreshTokenSuccess = createAction(
  '[User] Refresh Token Success',
  props<{ token: string }>()
);

export const refreshTokenFailure = createAction(
  '[User] Refresh Token Failure',
  props<{ error: string }>()
);