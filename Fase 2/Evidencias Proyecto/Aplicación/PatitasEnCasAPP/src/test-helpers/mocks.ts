import { BehaviorSubject, of } from 'rxjs';

// Minimal mock for AngularFireAuth used in many specs
export const mockAngularFireAuth = {
  authState: new BehaviorSubject(null),
  user: new BehaviorSubject(null),
  idToken: of(null),
  idTokenResult: of(null),
  credential: of(null),
  signInWithEmailAndPassword: (_: string, __: string) => Promise.resolve({ user: null }),
  signOut: () => Promise.resolve()
};

// Minimal mock for AngularFirestore
export const mockAngularFirestore = {
  collection: (path: string) => ({
    valueChanges: () => of([]),
    snapshotChanges: () => of([]),
    doc: (id?: string) => ({
      valueChanges: () => of(null),
      set: () => Promise.resolve(),
      update: () => Promise.resolve(),
      delete: () => Promise.resolve(),
      get: () => Promise.resolve({ exists: false, data: () => null })
    })
  }),
  doc: (path: string) => ({
    valueChanges: () => of(null),
    set: () => Promise.resolve(),
    update: () => Promise.resolve()
  }),
  createId: () => 'test-id'
};

// Minimal mock for AngularFireStorage
export const mockAngularFireStorage = {
  ref: (path: string) => ({
    getDownloadURL: () => of('https://example.com/dummy.jpg')
  }),
  upload: (_path: string, _data: any) => Promise.resolve({ ref: { getDownloadURL: () => Promise.resolve('https://example.com/dummy.jpg') } })
};

// Minimal mock for Ionic ModalController
export const mockModalController = {
  create: (opts?: any) => Promise.resolve({
    present: () => Promise.resolve(),
    onDidDismiss: () => Promise.resolve({ data: null })
  })
};

// Minimal mock for ActivatedRoute
export const mockActivatedRoute = {
  snapshot: { paramMap: { get: (_: string) => null }, queryParams: {} },
  queryParams: of({})
};
