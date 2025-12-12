import { BehaviorSubject, of } from 'rxjs';

// Minimal mock for AngularFireAuth used in many specs
export const mockAngularFireAuth = {
  authState: new BehaviorSubject(null),
  user: new BehaviorSubject(null),
  idToken: of(null),
  idTokenResult: of(null),
  credential: of(null),
  signInWithEmailAndPassword: (_: string, __: string) => Promise.resolve({ user: { uid: 'test-uid', email: 'test@example.com', emailVerified: true, sendEmailVerification: () => Promise.resolve() } }),
  createUserWithEmailAndPassword: (_: string, __: string) => Promise.resolve({ user: { uid: 'test-uid', email: 'test@example.com', sendEmailVerification: () => Promise.resolve() } }),
  signOut: () => Promise.resolve(),
  sendPasswordResetEmail: (_: string) => Promise.resolve(),
  setPersistence: (_: string) => Promise.resolve(),
  currentUser: Promise.resolve(null)
};

// Minimal mock for AngularFirestore
export const mockAngularFirestore = {
  collection: (path: string) => ({
    valueChanges: () => of([]),
    snapshotChanges: () => of([]),
    get: () => of({ empty: true, docs: [], size: 0 }),
    doc: (id?: string) => ({
      valueChanges: () => of(null),
      snapshotChanges: () => of({ payload: { exists: false, data: () => null, id: id || 'test-id' } }),
      set: () => Promise.resolve(),
      update: () => Promise.resolve(),
      delete: () => Promise.resolve(),
      get: () => of({ exists: false, data: (): any => null })
    }),
    add: () => Promise.resolve({ id: 'new-doc-id' })
  }),
  doc: (path: string) => ({
    valueChanges: () => of(null),
    snapshotChanges: () => of({ payload: { exists: false, data: () => null } }),
    set: () => Promise.resolve(),
    update: () => Promise.resolve(),
    get: () => of({ exists: false, data: (): any => null })
  }),
  createId: () => 'test-id'
};

// Minimal mock for AngularFireStorage
export const mockAngularFireStorage = {
  ref: (path: string) => ({
    getDownloadURL: () => of('https://example.com/dummy.jpg'),
    delete: () => of(undefined),
    listAll: () => of({ items: [], prefixes: [] })
  }),
  upload: (_path: string, _data: any) => Promise.resolve({ ref: { getDownloadURL: () => Promise.resolve('https://example.com/dummy.jpg') } }),
  refFromURL: (_url: string) => ({
    getDownloadURL: () => of('https://example.com/dummy.jpg'),
    delete: () => of(undefined)
  })
};

// Minimal mock for Ionic ModalController
export const mockModalController = {
  create: (opts?: any) => Promise.resolve({
    present: () => Promise.resolve(),
    dismiss: () => Promise.resolve(),
    onDidDismiss: () => Promise.resolve({ data: null })
  }),
  dismiss: () => Promise.resolve()
};

// Minimal mock for Ionic AlertController
export const mockAlertController = {
  create: (opts?: any) => Promise.resolve({
    present: () => Promise.resolve(),
    dismiss: () => Promise.resolve(),
    onDidDismiss: () => Promise.resolve({ data: null })
  })
};

// Minimal mock for Ionic ToastController
export const mockToastController = {
  create: (opts?: any) => Promise.resolve({
    present: () => Promise.resolve(),
    dismiss: () => Promise.resolve(),
    onDidDismiss: () => Promise.resolve()
  })
};

// Minimal mock for Ionic LoadingController
export const mockLoadingController = {
  create: (opts?: any) => Promise.resolve({
    present: () => Promise.resolve(),
    dismiss: () => Promise.resolve()
  })
};

// Minimal mock for Ionic MenuController
export const mockMenuController = {
  enable: () => Promise.resolve(),
  isEnabled: () => Promise.resolve(true),
  open: () => Promise.resolve(),
  close: () => Promise.resolve(),
  toggle: () => Promise.resolve()
};

// Minimal mock for Ionic NavController
export const mockNavController = {
  navigateForward: () => Promise.resolve(true),
  navigateBack: () => Promise.resolve(true),
  navigateRoot: () => Promise.resolve(true),
  back: () => Promise.resolve()
};

// Minimal mock for Ionic Platform
export const mockPlatform = {
  ready: () => Promise.resolve(),
  is: (_platformName: string) => false,
  width: () => 1024,
  height: () => 768,
  backButton: { subscribeWithPriority: () => { } }
};

// Minimal mock for ActivatedRoute
export const mockActivatedRoute = {
  snapshot: {
    paramMap: {
      get: (_: string): any => null,
      has: (_: string): boolean => false,
      getAll: (_: string): string[] => []
    },
    queryParams: {},
    params: {}
  },
  queryParams: of({}),
  params: of({}),
  paramMap: of({ get: (_: string) => null, has: (_: string) => false })
};

// Mock for Router
export const mockRouter = {
  navigate: () => Promise.resolve(true),
  navigateByUrl: () => Promise.resolve(true),
  events: of(null),
  url: '/'
};

// Mock for Store (NgRx)
export const mockStore = {
  select: () => of(null),
  dispatch: () => { },
  pipe: () => of(null)
};
