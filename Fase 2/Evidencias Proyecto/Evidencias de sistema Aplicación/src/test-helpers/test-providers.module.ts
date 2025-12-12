import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { IonicModule, ModalController, AlertController, ToastController, LoadingController, MenuController, NavController, Platform } from '@ionic/angular';
import { FIREBASE_OPTIONS } from '@angular/fire/compat';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Storage } from '@angular/fire/storage';
import { Router, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  mockAngularFireAuth,
  mockAngularFirestore,
  mockAngularFireStorage,
  mockModalController,
  mockActivatedRoute,
  mockAlertController,
  mockToastController,
  mockLoadingController,
  mockMenuController,
  mockNavController,
  mockPlatform,
  mockRouter,
  mockStore
} from './mocks';

@NgModule({
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterTestingModule, IonicModule.forRoot()],
  exports: [CommonModule, FormsModule, ReactiveFormsModule, RouterTestingModule, IonicModule],
  providers: [
    // Firebase mocks
    { provide: FIREBASE_OPTIONS, useValue: {} },
    { provide: AngularFireAuth, useValue: mockAngularFireAuth },
    { provide: AngularFirestore, useValue: mockAngularFirestore },
    { provide: AngularFireStorage, useValue: mockAngularFireStorage },
    { provide: Storage, useValue: mockAngularFireStorage },

    // Angular Router mocks
    { provide: ActivatedRoute, useValue: mockActivatedRoute },
    { provide: Router, useValue: mockRouter },

    // Ionic mocks
    { provide: ModalController, useValue: mockModalController },
    { provide: AlertController, useValue: mockAlertController },
    { provide: ToastController, useValue: mockToastController },
    { provide: LoadingController, useValue: mockLoadingController },
    { provide: MenuController, useValue: mockMenuController },
    { provide: NavController, useValue: mockNavController },
    { provide: Platform, useValue: mockPlatform },

    // NgRx mock
    { provide: Store, useValue: mockStore }
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class TestProvidersModule { }
