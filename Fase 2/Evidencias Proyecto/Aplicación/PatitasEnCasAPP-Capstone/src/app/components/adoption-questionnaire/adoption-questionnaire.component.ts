import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController, AlertController } from '@ionic/angular';
import { debounceTime } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AdoptionCommitment } from '../../models/AdoptionDocument';

@Component({
  selector: 'app-adoption-questionnaire',
  templateUrl: './adoption-questionnaire.component.html',
  styleUrls: ['./adoption-questionnaire.component.scss'],
})
export class AdoptionQuestionnaireComponent implements OnInit, OnDestroy {
  @Input() petName: string = '';
  @Input() petId: string = '';
  questionnaireForm!: FormGroup;
  currentStep = 1;
  autoSaveSubscription?: Subscription;
  lastSavedTime: string = '';
  showSavedIndicator: boolean = false;
  
  // Character limits
  readonly MAX_CHAR_DETAILS = 500;
  readonly MAX_CHAR_COMMITMENT = 300;
  
  // Tips by question
  tips: { [key: string]: string } = {
    hoursAlone: '💡 Las mascotas necesitan compañía. Idealmente no más de 6-8 horas solas.',
    householdMembers: '👨‍👩‍👧‍👦 Incluye edades de niños y si hay personas mayores.',
    allergies: '⚕️ Las alergias pueden desarrollarse con el tiempo.',
    previousExperience: '🐾 La experiencia previa ayuda, pero no es excluyente.',
    petFood: '🍖 Alimento de calidad premium es importante para su salud.',
    unexpectedExpenses: '💰 Los gastos veterinarios pueden ser de $500-2000 anuales.',
    longTermCommitment: '❤️ Las mascotas pueden vivir 10-15+ años. Es un compromiso largo.'
  };

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    this.questionnaireForm = this.fb.group({
      // Step 1: Vivienda y Permiso
      housingType: ['', Validators.required],
      landlordAllowsPets: [null],
      secureFencing: [null, Validators.required],

      // Step 2: Espacio y Estilo de Vida
      petLivingSpace: ['', Validators.required],
      petLivingSpaceOther: [''],
      hoursAlone: ['', [Validators.required, Validators.min(0), Validators.max(24)]],
      householdMembers: ['', Validators.required],
      allergies: ['', Validators.required],

      // Step 3: Experiencia y Preparación
      previousExperience: [null, Validators.required],
      previousExperienceDetails: ['', Validators.required],
      otherPets: [null, Validators.required],
      otherPetsDetails: ['', Validators.required],
      petFood: ['', Validators.required],
      veterinaryAccess: [null, Validators.required],
      unexpectedExpenses: [null, Validators.required],

      // Step 4: Compromiso y Consentimiento
      longTermCommitment: ['', Validators.required],
      verificationConsent: [false, Validators.requiredTrue],
      adoptionCommitment: [false, Validators.requiredTrue],
    });

    this.setupConditionalValidation();
    this.loadSavedProgress();
    this.setupAutoSave();
  }

  ngOnDestroy() {
    if (this.autoSaveSubscription) {
      this.autoSaveSubscription.unsubscribe();
    }
  }

  setupConditionalValidation() {
    this.questionnaireForm.get('housingType')?.valueChanges.subscribe(value => {
      if (value === 'rented') {
        this.questionnaireForm.get('landlordAllowsPets')?.setValidators(Validators.required);
      } else {
        this.questionnaireForm.get('landlordAllowsPets')?.clearValidators();
      }
      this.questionnaireForm.get('landlordAllowsPets')?.updateValueAndValidity();
    });

    this.questionnaireForm.get('petLivingSpace')?.valueChanges.subscribe(value => {
      if (value === 'other') {
        this.questionnaireForm.get('petLivingSpaceOther')?.setValidators(Validators.required);
      } else {
        this.questionnaireForm.get('petLivingSpaceOther')?.clearValidators();
      }
      this.questionnaireForm.get('petLivingSpaceOther')?.updateValueAndValidity();
    });

    this.questionnaireForm.get('previousExperience')?.valueChanges.subscribe(value => {
      if (value === true) {
        this.questionnaireForm.get('previousExperienceDetails')?.setValidators(Validators.required);
      } else {
        this.questionnaireForm.get('previousExperienceDetails')?.clearValidators();
      }
      this.questionnaireForm.get('previousExperienceDetails')?.updateValueAndValidity();
    });

    this.questionnaireForm.get('otherPets')?.valueChanges.subscribe(value => {
      if (value === true) {
        this.questionnaireForm.get('otherPetsDetails')?.setValidators(Validators.required);
      } else {
        this.questionnaireForm.get('otherPetsDetails')?.clearValidators();
      }
      this.questionnaireForm.get('otherPetsDetails')?.updateValueAndValidity();
    });
  }

  nextStep() {
    if (this.isStepValid(this.currentStep)) {
      this.currentStep++;
    }
  }

  prevStep() {
    this.currentStep--;
  }

  isStepValid(step: number): boolean {
    switch (step) {
      case 1:
        return this.questionnaireForm.get('housingType')?.valid && this.questionnaireForm.get('landlordAllowsPets')?.valid && this.questionnaireForm.get('secureFencing')?.valid;
      case 2:
        return this.questionnaireForm.get('petLivingSpace')?.valid && this.questionnaireForm.get('petLivingSpaceOther')?.valid && this.questionnaireForm.get('hoursAlone')?.valid && this.questionnaireForm.get('householdMembers')?.valid && this.questionnaireForm.get('allergies')?.valid;
      case 3:
        return this.questionnaireForm.get('previousExperience')?.valid && this.questionnaireForm.get('previousExperienceDetails')?.valid && this.questionnaireForm.get('otherPets')?.valid && this.questionnaireForm.get('otherPetsDetails')?.valid && this.questionnaireForm.get('petFood')?.valid && this.questionnaireForm.get('veterinaryAccess')?.valid && this.questionnaireForm.get('unexpectedExpenses')?.valid;
      default:
        return true;
    }
  }

  setupAutoSave() {
    // Auto-save every 2 seconds after user stops typing
    this.autoSaveSubscription = this.questionnaireForm.valueChanges
      .pipe(debounceTime(2000))
      .subscribe(() => {
        this.saveProgress();
      });
  }

  saveProgress() {
    const storageKey = `questionnaire_${this.petId || 'draft'}`;
    const data = {
      formData: this.questionnaireForm.value,
      currentStep: this.currentStep,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(storageKey, JSON.stringify(data));
    
    this.lastSavedTime = new Date().toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    this.showSavedIndicator = true;
    setTimeout(() => {
      this.showSavedIndicator = false;
    }, 2000);
  }

  loadSavedProgress() {
    const storageKey = `questionnaire_${this.petId || 'draft'}`;
    const savedData = localStorage.getItem(storageKey);
    
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        const savedDate = new Date(data.timestamp);
        const hoursSince = (Date.now() - savedDate.getTime()) / (1000 * 60 * 60);
        
        // Only load if saved within last 24 hours
        if (hoursSince < 24) {
          this.questionnaireForm.patchValue(data.formData);
          this.currentStep = data.currentStep || 1;
          this.lastSavedTime = savedDate.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
        } else {
          // Clear old data
          localStorage.removeItem(storageKey);
        }
      } catch (e) {
        console.error('Error loading saved progress:', e);
      }
    }
  }

  clearSavedProgress() {
    const storageKey = `questionnaire_${this.petId || 'draft'}`;
    localStorage.removeItem(storageKey);
  }

  getCharCount(controlName: string): number {
    const value = this.questionnaireForm.get(controlName)?.value || '';
    return value.length;
  }

  getCharCountColor(controlName: string, maxChars: number): string {
    const count = this.getCharCount(controlName);
    const percentage = (count / maxChars) * 100;
    
    if (percentage < 50) return 'success';
    if (percentage < 80) return 'warning';
    return 'danger';
  }

  isFieldValid(fieldName: string): boolean {
    const field = this.questionnaireForm.get(fieldName);
    return field ? field.valid && field.touched : false;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.questionnaireForm.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }

  getTip(fieldName: string): string {
    return this.tips[fieldName] || '';
  }

  canSubmit(): boolean {
    const verificationConsent = this.questionnaireForm.get('verificationConsent')?.value;
    const adoptionCommitment = this.questionnaireForm.get('adoptionCommitment')?.value;
    return verificationConsent === true && adoptionCommitment === true;
  }

  getWarningForHours(): string | null {
    const hours = this.questionnaireForm.get('hoursAlone')?.value;
    if (hours > 10) {
      return '⚠️ Atención: Muchas horas solo puede afectar el bienestar de la mascota.';
    } else if (hours > 8) {
      return '⚠️ Considera opciones de cuidado diurno o paseos intermedios.';
    }
    return null;
  }

  async showPreview() {
    const formData = this.questionnaireForm.value;
    
    const alert = await this.alertCtrl.create({
      header: '📋 Revisión de Respuestas',
      cssClass: 'preview-alert',
      message: this.buildPreviewHTML(formData),
      buttons: [
        {
          text: 'Editar',
          role: 'cancel',
          cssClass: 'alert-button-cancel'
        },
        {
          text: 'Enviar Solicitud',
          cssClass: 'alert-button-confirm',
          handler: () => {
            this.confirmSubmit();
          }
        }
      ]
    });

    await alert.present();
  }

  buildPreviewHTML(data: any): string {
    return `
      <div class="preview-content">
        <h3>🏠 Vivienda</h3>
        <p><strong>Tipo:</strong> ${data.housingType === 'own' ? 'Propia' : 'Alquilada'}</p>
        ${data.landlordAllowsPets !== null ? `<p><strong>Permiso arrendador:</strong> ${data.landlordAllowsPets ? 'Sí' : 'No'}</p>` : ''}
        <p><strong>Cercado seguro:</strong> ${data.secureFencing === true ? 'Sí' : data.secureFencing === false ? 'No' : 'No aplica'}</p>
        
        <h3>📅 Estilo de Vida</h3>
        <p><strong>Espacio:</strong> ${this.getSpaceLabel(data.petLivingSpace)}</p>
        <p><strong>Horas solo:</strong> ${data.hoursAlone}h</p>
        <p><strong>Miembros hogar:</strong> ${data.householdMembers}</p>
        <p><strong>Alergias:</strong> ${this.getAllergiesLabel(data.allergies)}</p>
        
        <h3>🐾 Experiencia</h3>
        <p><strong>Experiencia previa:</strong> ${data.previousExperience ? 'Sí' : 'No'}</p>
        <p><strong>Otras mascotas:</strong> ${data.otherPets ? 'Sí' : 'No'}</p>
        <p><strong>Alimentación:</strong> ${data.petFood}</p>
        <p><strong>Gastos inesperados:</strong> ${data.unexpectedExpenses ? 'Sí' : 'No'}</p>
        
        <h3>❤️ ¿Qué harías si no pudieras seguir cuidando a la mascota?</h3>
        <p>${data.longTermCommitment.substring(0, 100)}...</p>
      </div>
    `;
  }

  getSpaceLabel(value: string): string {
    const labels: any = {
      'indoor': 'Interior',
      'indoor_with_garden': 'Interior con jardín',
      'outdoor': 'Exterior',
      'other': 'Otro'
    };
    return labels[value] || value;
  }

  getAllergiesLabel(value: string): string {
    const labels: any = {
      'yes': 'Sí',
      'no': 'No',
      'unknown': 'No sé'
    };
    return labels[value] || value;
  }

  async dismiss() {
    if (this.questionnaireForm.dirty) {
      const alert = await this.alertCtrl.create({
        header: '¿Salir?',
        message: 'Tienes cambios sin enviar. Tu progreso se guardará automáticamente.',
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel'
          },
          {
            text: 'Salir',
            handler: () => {
              this.saveProgress();
              this.modalCtrl.dismiss();
            }
          }
        ]
      });
      await alert.present();
    } else {
      this.modalCtrl.dismiss();
    }
  }

  async submit() {
    if (this.questionnaireForm.valid) {
      const alert = await this.alertCtrl.create({
        header: '✅ Confirmar Envío',
        message: '¿Estás seguro de que deseas enviar tu solicitud de adopción? Una vez enviada, no podrás modificarla.',
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel'
          },
          {
            text: 'Enviar',
            handler: () => {
              this.confirmSubmit();
            }
          }
        ]
      });
      await alert.present();
    } else {
      // Mark all fields as touched to display validation errors
      Object.values(this.questionnaireForm.controls).forEach(control => {
        control.markAsTouched();
      });
      
      const alert = await this.alertCtrl.create({
        header: '⚠️ Campos incompletos',
        message: 'Por favor completa todos los campos requeridos antes de enviar.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  confirmSubmit() {
    // Create adoption commitment document
    const commitment: Partial<AdoptionCommitment> = {
      adoptionRequestId: '', // Will be set by the service
      adopterId: '', // Will be set by the service with current user
      adopterName: '', // Will be set by the service with current user name
      petId: this.petId,
      petName: this.petName,
      personalData: {
        fullName: '', // Will be set by service
        email: '', // Will be set by service
        phone: '', // Will be set by service
        address: '' // Will be set by service
      },
      commitments: {
        longTermCare: true,
        veterinaryExpenses: true,
        noAbandonment: true,
        returnPolicy: true,
        legalConsequences: true,
        addressChangeNotification: true
      },
      signature: {
        accepted: true,
        timestamp: new Date()
      },
      createdAt: new Date()
    };

    this.clearSavedProgress();
    this.modalCtrl.dismiss({
      formData: this.questionnaireForm.value,
      commitment: commitment
    });
  }
}
