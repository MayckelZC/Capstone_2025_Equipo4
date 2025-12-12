// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { FIREBASE_OPTIONS } from '@angular/fire/compat';
import { mockAngularFireAuth, mockAngularFirestore, mockAngularFireStorage, mockModalController, mockActivatedRoute } from './test-helpers/mocks';
import { ActivatedRoute } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterTestingModule } from '@angular/router/testing';

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);

// Provide common modules/providers used across many specs so individual tests
// don't need to import Firebase/Ionic/Router modules each time.
getTestBed().configureTestingModule({
  imports: [
    IonicModule.forRoot(),
    RouterTestingModule,
    CommonModule,
    FormsModule
  ],
  providers: [
    // Provide FIREBASE_OPTIONS so AngularFire compat providers don't try to initialize firebase
    { provide: FIREBASE_OPTIONS, useValue: {} },
    // Some AngularFire compat factories reference the legacy token name 'angularfire2.app.options'.
    // Provide it as a string token so older factories receive a value during tests.
    { provide: 'angularfire2.app.options', useValue: {} },
    // Provide richer mocks for AngularFire compat services used across many specs.
    { provide: AngularFireAuth, useValue: mockAngularFireAuth },
    { provide: AngularFirestore, useValue: mockAngularFirestore },
    { provide: AngularFireStorage, useValue: mockAngularFireStorage },
    // Common Ionic/router mocks
    { provide: ModalController, useValue: mockModalController },
    { provide: ActivatedRoute, useValue: mockActivatedRoute }
  ]
});

// Also override providers at the TestBed level to ensure specs that initialize
// their own testing modules still receive the mocks.
const tb = getTestBed();
try {
  tb.overrideProvider(FIREBASE_OPTIONS, { useValue: {} });
  // Also override the legacy token name used by some AngularFire compat factories.
  try {
    tb.overrideProvider('angularfire2.app.options', { useValue: {} });
  } catch (e) {
    // ignore if overrideProvider doesn't accept string tokens in some environments
  }
  tb.overrideProvider(AngularFireAuth, { useValue: mockAngularFireAuth });
  tb.overrideProvider(AngularFirestore, { useValue: mockAngularFirestore });
  tb.overrideProvider(AngularFireStorage, { useValue: mockAngularFireStorage });
  tb.overrideProvider(ModalController, { useValue: mockModalController });
  tb.overrideProvider(ActivatedRoute, { useValue: mockActivatedRoute });
} catch (e) {
  // Some test environments may not allow overrideProvider early; ignore failures.
  // Individual specs can still override providers as needed.
  // eslint-disable-next-line no-console
  console.warn('test bootstrap overrideProvider skipped', e && e.message ? e.message : e);
}
