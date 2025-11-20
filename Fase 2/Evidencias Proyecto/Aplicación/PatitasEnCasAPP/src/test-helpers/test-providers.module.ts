import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { IonicModule } from '@ionic/angular';
import { FIREBASE_OPTIONS } from '@angular/fire/compat';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Storage } from '@angular/fire/storage';
import { mockAngularFireAuth, mockAngularFirestore, mockAngularFireStorage, mockModalController, mockActivatedRoute } from './mocks';
import { ModalController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';

@NgModule({
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterTestingModule, IonicModule.forRoot()],
  exports: [CommonModule, FormsModule, ReactiveFormsModule, RouterTestingModule, IonicModule],
  providers: [
    { provide: FIREBASE_OPTIONS, useValue: {} },
    { provide: AngularFireAuth, useValue: mockAngularFireAuth },
    { provide: AngularFirestore, useValue: mockAngularFirestore },
    { provide: AngularFireStorage, useValue: mockAngularFireStorage },
    // Provide the modular Storage token (used by @angular/fire v9+ APIs) as the same mock
    { provide: Storage, useValue: mockAngularFireStorage },
    { provide: ModalController, useValue: mockModalController },
    { provide: ActivatedRoute, useValue: mockActivatedRoute }
  ]
  ,
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class TestProvidersModule {}
