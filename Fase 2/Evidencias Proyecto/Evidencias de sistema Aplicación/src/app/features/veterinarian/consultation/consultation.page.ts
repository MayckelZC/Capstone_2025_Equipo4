import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { LoadingController, AlertController, ToastController, ActionSheetController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { firstValueFrom, Subject } from 'rxjs';
import { finalize, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { LoggerService } from '@core/services/logger.service';
import { MedicationService, Medication } from '../services/medication.service';
import { VetNotificationService } from '../services/vet-notification.service';

// Plantillas de texto rápido
const QUICK_TEMPLATES = {
  normal: 'Sin hallazgos anormales',
  stable: 'Paciente en condiciones estables',
  followup: 'Requiere seguimiento en ___ días',
  informed: 'Propietario informado de riesgos y tratamiento',
  recovered: 'Paciente se encuentra en proceso de recuperación',
  medication: 'Se prescribe medicación según indicaciones',
};

interface MedicalHistoryRecord {
  id: string;
  date: Date;
  diagnosis: string;
  prescriptions: any[];
  type: string;
}

@Component({
  selector: 'app-consultation',
  templateUrl: './consultation.page.html',
  styleUrls: ['./consultation.page.scss'],
})
export class ConsultationPage implements OnInit, AfterViewInit, OnDestroy {
  // Canvas para firma digital
  @ViewChild('signatureCanvas') signatureCanvas!: ElementRef<HTMLCanvasElement>;
  private signatureContext: CanvasRenderingContext2D | null = null;
  private isDrawing = false;

  // Wizard steps
  currentStep = 1;
  totalSteps = 5;
  steps = [
    { id: 1, name: 'Signos Vitales', icon: 'fitness-outline', completed: false },
    { id: 2, name: 'Examinación', icon: 'eye-outline', completed: false },
    { id: 3, name: 'Diagnóstico', icon: 'medical-outline', completed: false },
    { id: 4, name: 'Tratamiento', icon: 'bandage-outline', completed: false },
    { id: 5, name: 'Seguimiento', icon: 'calendar-outline', completed: false },
  ];

  appointmentId: string = '';
  appointment: any = null;
  pet: any = null;
  lastRecord: any = null;

  // Datos de la consulta
  consultation = {
    // Paso 1: Signos Vitales
    weight: '',
    temperature: '',
    heartRate: '',
    respiratoryRate: '',

    // Paso 2: Examinación
    generalCondition: '',
    mucosas: '',
    hydration: '',
    palpation: '',

    // Paso 3: Diagnóstico
    diagnosis: '',
    differentialDiagnosis: '',
    severity: 'leve',

    // Paso 4: Tratamiento
    prescriptions: [] as any[],
    procedures: '',
    recommendations: '',

    // Paso 5: Seguimiento
    nextAppointmentDays: '',
    monitoringInstructions: '',
    redFlags: '',

    // General
    notes: '',
    photos: [] as string[],
    signature: '' as string,
  };

  // Plantillas rápidas
  quickTemplates = QUICK_TEMPLATES;
  showTemplates = false;

  // Validaciones de signos vitales
  vitalSignsAlerts = {
    weight: { status: 'normal', message: '' },
    temperature: { status: 'normal', message: '' },
    heartRate: { status: 'normal', message: '' },
  };

  loading = true;
  viewOnly = false;
  savedRecord: any = null;

  // ========== AUTOSAVE ==========
  autosaveStatus: 'idle' | 'saving' | 'saved' | 'error' = 'idle';
  private autosaveInterval: any = null;
  private lastSavedAt: Date | null = null;
  autosaveMessage: string = '';

  // ========== MEDICAL HISTORY ==========
  showHistoryPanel = false;
  medicalHistory: MedicalHistoryRecord[] = [];
  loadingHistory = false;

  // ========== MEDICATION AUTOCOMPLETE ==========
  medicationSearchTerm = '';
  medicationSuggestions: Medication[] = [];
  showMedicationSuggestions = false;
  selectedMedication: Medication | null = null;
  private medicationSearchSubject = new Subject<string>();

  // ========== PRESCRIPTION FORM ==========
  newPrescription = {
    medication: '',
    medicationId: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  };

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firestore: AngularFirestore,
    private storage: AngularFireStorage,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private actionSheetCtrl: ActionSheetController,
    private logger: LoggerService,
    private medicationService: MedicationService,
    private notificationService: VetNotificationService
  ) { }

  async ngOnInit() {
    this.appointmentId = this.route.snapshot.paramMap.get('id') || '';

    // Verificar si es modo de solo lectura
    this.route.queryParams.subscribe(params => {
      this.viewOnly = params['viewOnly'] === 'true';
    });

    await this.loadConsultationData();
    this.setupMedicationSearch();

    // Restaurar borrador si existe
    if (!this.viewOnly) {
      this.loadDraft();
      this.startAutosave();
    }
  }

  ngAfterViewInit() {
    // Inicializar canvas de firma después de que la vista esté lista
    setTimeout(() => {
      this.initializeSignatureCanvas();
    }, 500);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopAutosave();
  }

  // ========== AUTOSAVE FUNCTIONALITY ==========
  startAutosave() {
    // Guardar cada 30 segundos
    this.autosaveInterval = setInterval(() => {
      this.performAutosave();
    }, 30000);
  }

  stopAutosave() {
    if (this.autosaveInterval) {
      clearInterval(this.autosaveInterval);
      this.autosaveInterval = null;
    }
  }

  async performAutosave() {
    if (this.viewOnly) return;

    try {
      this.autosaveStatus = 'saving';
      this.autosaveMessage = 'Guardando...';

      // Guardar en localStorage como backup
      const draftKey = `consultation_draft_${this.appointmentId}`;
      const draftData = {
        consultation: this.consultation,
        currentStep: this.currentStep,
        steps: this.steps,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(draftKey, JSON.stringify(draftData));

      this.lastSavedAt = new Date();
      this.autosaveStatus = 'saved';
      this.autosaveMessage = `Guardado ${this.formatTimeAgo(this.lastSavedAt)}`;

      // Resetear a "idle" después de 3 segundos
      setTimeout(() => {
        if (this.autosaveStatus === 'saved') {
          this.autosaveStatus = 'idle';
        }
      }, 3000);
    } catch (error) {
      this.logger.error('Autosave error:', error);
      this.autosaveStatus = 'error';
      this.autosaveMessage = 'Error al guardar';
    }
  }

  loadDraft() {
    const draftKey = `consultation_draft_${this.appointmentId}`;
    const draftJson = localStorage.getItem(draftKey);

    if (draftJson) {
      try {
        const draft = JSON.parse(draftJson);
        const savedAt = new Date(draft.savedAt);
        const hoursDiff = (Date.now() - savedAt.getTime()) / (1000 * 60 * 60);

        // Solo restaurar si el borrador es de menos de 24 horas
        if (hoursDiff < 24) {
          this.showDraftRestoreOption(draft);
        } else {
          // Borrar borrador viejo
          localStorage.removeItem(draftKey);
        }
      } catch (e) {
        localStorage.removeItem(draftKey);
      }
    }
  }

  async showDraftRestoreOption(draft: any) {
    const alert = await this.alertCtrl.create({
      header: '📝 Borrador Encontrado',
      message: `Hay un borrador guardado de ${this.formatTimeAgo(new Date(draft.savedAt))}. ¿Deseas restaurarlo?`,
      buttons: [
        {
          text: 'Descartar',
          role: 'cancel',
          handler: () => {
            this.clearDraft();
          }
        },
        {
          text: 'Restaurar',
          handler: () => {
            this.consultation = { ...this.consultation, ...draft.consultation };
            this.currentStep = draft.currentStep || 1;
            this.steps = draft.steps || this.steps;
            this.showToast('Borrador restaurado', 'success');
          }
        }
      ]
    });
    await alert.present();
  }

  clearDraft() {
    const draftKey = `consultation_draft_${this.appointmentId}`;
    localStorage.removeItem(draftKey);
  }

  formatTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'hace unos segundos';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `hace ${hours}h`;
    return `hace ${Math.floor(hours / 24)} días`;
  }

  // ========== MEDICAL HISTORY PANEL ==========
  toggleHistoryPanel() {
    this.showHistoryPanel = !this.showHistoryPanel;
    if (this.showHistoryPanel && this.medicalHistory.length === 0) {
      this.loadMedicalHistory();
    }
  }

  async loadMedicalHistory() {
    if (!this.pet?.id) return;

    this.loadingHistory = true;
    try {
      const historySnapshot = await firstValueFrom(
        this.firestore.collection('medical-records', ref =>
          ref.where('petId', '==', this.pet.id)
            .orderBy('date', 'desc')
            .limit(5)
        ).get()
      );

      this.medicalHistory = historySnapshot.docs.map(doc => {
        const data: any = doc.data();
        return {
          id: doc.id,
          date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
          diagnosis: data.diagnosis || 'Sin diagnóstico',
          prescriptions: data.prescriptions || [],
          type: data.type || 'consulta'
        };
      });
    } catch (error) {
      this.logger.error('Error loading medical history:', error);
    } finally {
      this.loadingHistory = false;
    }
  }

  // ========== MEDICATION AUTOCOMPLETE ==========
  setupMedicationSearch() {
    this.medicationSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      this.performMedicationSearch(term);
    });
  }

  onMedicationSearchChange(event: any) {
    const term = event.detail?.value || event.target?.value || '';
    this.medicationSearchTerm = term;
    this.medicationSearchSubject.next(term);
  }

  performMedicationSearch(term: string) {
    if (term.length < 2) {
      this.medicationSuggestions = [];
      this.showMedicationSuggestions = false;
      return;
    }

    const species = this.pet?.tipoMascota || this.pet?.species;
    this.medicationSuggestions = this.medicationService.searchMedications(term, species);
    this.showMedicationSuggestions = this.medicationSuggestions.length > 0;
  }

  selectMedication(medication: Medication) {
    this.selectedMedication = medication;
    this.newPrescription.medication = medication.name;
    this.newPrescription.medicationId = medication.id;
    this.showMedicationSuggestions = false;
    this.medicationSearchTerm = medication.name;

    // Calcular dosis sugerida si hay peso
    if (this.consultation.weight) {
      const weight = parseFloat(this.consultation.weight);
      const doseSuggestion = this.medicationService.calculateDose(medication, weight);
      this.newPrescription.dosage = `${doseSuggestion.minDose} - ${doseSuggestion.maxDose}`;
      this.newPrescription.frequency = doseSuggestion.frequency;
    }
  }

  addPrescriptionFromForm() {
    if (!this.newPrescription.medication) {
      this.showToast('Selecciona un medicamento', 'warning');
      return;
    }

    const prescription = {
      medication: this.newPrescription.medication,
      medicationId: this.newPrescription.medicationId,
      dosage: this.newPrescription.dosage,
      frequency: this.newPrescription.frequency,
      duration: this.newPrescription.duration,
      instructions: this.newPrescription.instructions
    };

    this.consultation.prescriptions.push(prescription);
    this.resetPrescriptionForm();
    this.showToast('Prescripción agregada', 'success');
  }

  resetPrescriptionForm() {
    this.newPrescription = {
      medication: '',
      medicationId: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    };
    this.selectedMedication = null;
    this.medicationSearchTerm = '';
  }

  // ========== SIGNATURE CANVAS ==========
  initializeSignatureCanvas() {
    if (!this.signatureCanvas?.nativeElement) return;

    const canvas = this.signatureCanvas.nativeElement;
    this.signatureContext = canvas.getContext('2d');

    if (this.signatureContext) {
      this.signatureContext.strokeStyle = '#000';
      this.signatureContext.lineWidth = 2;
      this.signatureContext.lineCap = 'round';
      this.signatureContext.lineJoin = 'round';
    }

    // Event listeners para dibujar
    canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    canvas.addEventListener('mousemove', (e) => this.draw(e));
    canvas.addEventListener('mouseup', () => this.stopDrawing());
    canvas.addEventListener('mouseleave', () => this.stopDrawing());

    // Touch events para móvil
    canvas.addEventListener('touchstart', (e) => this.startDrawingTouch(e));
    canvas.addEventListener('touchmove', (e) => this.drawTouch(e));
    canvas.addEventListener('touchend', () => this.stopDrawing());
  }

  startDrawing(e: MouseEvent) {
    if (!this.signatureContext) return;
    this.isDrawing = true;
    this.signatureContext.beginPath();
    this.signatureContext.moveTo(e.offsetX, e.offsetY);
  }

  draw(e: MouseEvent) {
    if (!this.isDrawing || !this.signatureContext) return;
    this.signatureContext.lineTo(e.offsetX, e.offsetY);
    this.signatureContext.stroke();
  }

  startDrawingTouch(e: TouchEvent) {
    e.preventDefault();
    if (!this.signatureContext || !this.signatureCanvas) return;
    this.isDrawing = true;
    const rect = this.signatureCanvas.nativeElement.getBoundingClientRect();
    const touch = e.touches[0];
    this.signatureContext.beginPath();
    this.signatureContext.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
  }

  drawTouch(e: TouchEvent) {
    e.preventDefault();
    if (!this.isDrawing || !this.signatureContext || !this.signatureCanvas) return;
    const rect = this.signatureCanvas.nativeElement.getBoundingClientRect();
    const touch = e.touches[0];
    this.signatureContext.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    this.signatureContext.stroke();
  }

  stopDrawing() {
    this.isDrawing = false;
  }

  clearSignature() {
    if (!this.signatureContext || !this.signatureCanvas) return;
    this.signatureContext.clearRect(
      0, 0,
      this.signatureCanvas.nativeElement.width,
      this.signatureCanvas.nativeElement.height
    );
    this.consultation.signature = '';
  }

  saveSignature() {
    if (!this.signatureCanvas) return;
    this.consultation.signature = this.signatureCanvas.nativeElement.toDataURL('image/png');
    this.showToast('Firma guardada', 'success');
  }

  hasSignature(): boolean {
    if (!this.signatureCanvas?.nativeElement || !this.signatureContext) return false;
    const canvas = this.signatureCanvas.nativeElement;
    const pixelData = this.signatureContext.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 3; i < pixelData.length; i += 4) {
      if (pixelData[i] !== 0) return true;
    }
    return false;
  }

  // ========== EMAIL SENDING ==========
  async sendPrescriptionEmail() {
    const alert = await this.alertCtrl.create({
      header: '📧 Enviar por Email',
      message: `¿Enviar la receta y recomendaciones a ${this.appointment?.userEmail || 'el dueño'}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Enviar',
          handler: async () => {
            await this.performEmailSend();
          }
        }
      ]
    });
    await alert.present();
  }

  async performEmailSend() {
    const loading = await this.loadingCtrl.create({
      message: 'Enviando email...'
    });
    await loading.present();

    try {
      // Generar resumen para email
      const emailContent = this.generateEmailContent();

      // Usar el servicio de notificaciones para enviar
      if (this.appointment && this.notificationService) {
        const appointmentCard = {
          id: this.appointmentId,
          petName: this.pet?.nombre || this.pet?.name,
          ownerName: this.appointment.userName,
          ownerEmail: this.appointment.userEmail,
          date: new Date(),
          reason: this.consultation.diagnosis
        };

        await this.notificationService.sendImmediateReminder(
          appointmentCard as any,
          emailContent
        );
      }

      loading.dismiss();
      this.showToast('Email enviado exitosamente', 'success');
    } catch (error) {
      loading.dismiss();
      this.logger.error('Error sending email:', error);
      this.showToast('Error al enviar email', 'danger');
    }
  }

  generateEmailContent(): string {
    let content = `
📋 RESUMEN DE CONSULTA VETERINARIA

🐾 Paciente: ${this.pet?.nombre || this.pet?.name}
📅 Fecha: ${new Date().toLocaleDateString('es-ES')}

📊 DIAGNÓSTICO:
${this.consultation.diagnosis}

💊 TRATAMIENTO:
`;

    this.consultation.prescriptions.forEach((rx, i) => {
      content += `${i + 1}. ${rx.medication} - ${rx.dosage} (${rx.duration})\n`;
    });

    if (this.consultation.recommendations) {
      content += `\n📝 RECOMENDACIONES:\n${this.consultation.recommendations}`;
    }

    if (this.consultation.nextAppointmentDays) {
      content += `\n\n📅 Próximo control en ${this.consultation.nextAppointmentDays} días`;
    }

    if (this.consultation.monitoringInstructions) {
      content += `\n\n⚠️ INSTRUCCIONES DE MONITOREO:\n${this.consultation.monitoringInstructions}`;
    }

    return content;
  }

  // ========== AUTOMATIC REMINDERS ==========
  async createFollowUpReminder() {
    if (!this.consultation.nextAppointmentDays) return;

    try {
      const days = parseInt(this.consultation.nextAppointmentDays);
      const reminderDate = new Date();
      reminderDate.setDate(reminderDate.getDate() + days);

      // Guardar recordatorio en Firestore
      await this.firestore.collection('appointment-reminders').add({
        petId: this.pet.id,
        petName: this.pet?.nombre || this.pet?.name,
        ownerName: this.appointment?.userName,
        ownerEmail: this.appointment?.userEmail,
        type: 'followup',
        reminderDate: reminderDate,
        originalAppointmentId: this.appointmentId,
        message: `Recordatorio: ${this.pet?.nombre || this.pet?.name} necesita control de seguimiento`,
        createdAt: new Date(),
        sent: false
      });

      this.showToast(`Recordatorio programado para ${days} días`, 'success');
    } catch (error) {
      this.logger.error('Error creating reminder:', error);
    }
  }

  // ========== ORIGINAL METHODS (DATA LOADING) ==========
  async loadConsultationData() {
    const loading = await this.loadingCtrl.create({
      message: 'Cargando...'
    });
    await loading.present();

    try {
      // Cargar cita
      const appointmentDoc = await firstValueFrom(
        this.firestore.collection('veterinaryAppointments').doc(this.appointmentId).get()
      );

      if (appointmentDoc.exists) {
        const appointmentData: any = appointmentDoc.data();
        this.appointment = { id: appointmentDoc.id, ...appointmentData };

        // Cargar mascota
        if (this.appointment.petId) {
          const petDoc = await firstValueFrom(
            this.firestore.collection('mascotas').doc(this.appointment.petId).get()
          );

          if (petDoc.exists) {
            const petData: any = petDoc.data();
            this.pet = { id: petDoc.id, ...petData };

            // Si es modo viewOnly, cargar el registro médico de esta cita
            if (this.viewOnly) {
              try {
                const recordSnapshot = await firstValueFrom(
                  this.firestore.collection('medical-records', ref =>
                    ref.where('appointmentId', '==', this.appointmentId)
                      .limit(1)
                  ).get()
                );

                if (!recordSnapshot.empty) {
                  const recordData: any = recordSnapshot.docs[0].data();
                  this.savedRecord = { id: recordSnapshot.docs[0].id, ...recordData };

                  // Cargar los datos guardados en el formulario
                  if (this.savedRecord) {
                    this.consultation = {
                      weight: this.savedRecord.weight || '',
                      temperature: this.savedRecord.temperature || '',
                      heartRate: this.savedRecord.heartRate || '',
                      respiratoryRate: this.savedRecord.respiratoryRate || '',
                      generalCondition: this.savedRecord.generalCondition || '',
                      mucosas: this.savedRecord.mucosas || '',
                      hydration: this.savedRecord.hydration || '',
                      palpation: this.savedRecord.palpation || '',
                      diagnosis: this.savedRecord.diagnosis || '',
                      differentialDiagnosis: this.savedRecord.differentialDiagnosis || '',
                      severity: this.savedRecord.severity || 'leve',
                      prescriptions: this.savedRecord.prescriptions || [],
                      procedures: this.savedRecord.procedures || '',
                      recommendations: this.savedRecord.recommendations || '',
                      nextAppointmentDays: this.savedRecord.nextAppointmentDays || '',
                      monitoringInstructions: this.savedRecord.monitoringInstructions || '',
                      redFlags: this.savedRecord.redFlags || '',
                      notes: this.savedRecord.notes || '',
                      photos: this.savedRecord.photos || [],
                      signature: this.savedRecord.signature || '',
                    };
                  }
                }
              } catch (error) {
                this.logger.error('Error loading saved record:', error);
              }
            } else {
              // Cargar último registro médico para comparar signos vitales
              try {
                const lastRecordSnapshot = await firstValueFrom(
                  this.firestore.collection('medical-records', ref =>
                    ref.where('petId', '==', this.appointment.petId)
                      .orderBy('date', 'desc')
                      .limit(1)
                  ).get()
                );

                if (!lastRecordSnapshot.empty) {
                  const lastRecordData: any = lastRecordSnapshot.docs[0].data();
                  this.lastRecord = { id: lastRecordSnapshot.docs[0].id, ...lastRecordData };
                }
              } catch (historyError) {
                console.warn('Could not load medical history:', historyError);
                this.lastRecord = null;
              }
            }
          }
        }
      }

      this.loading = false;
    } catch (error) {
      this.logger.error('Error loading consultation data:', error);
      this.loading = false;
    } finally {
      loading.dismiss();
    }
  }

  // ========== NAVIGATION ==========
  nextStep() {
    if (this.currentStep < this.totalSteps) {
      if (this.validateCurrentStep()) {
        this.steps[this.currentStep - 1].completed = true;
        this.currentStep++;
        this.performAutosave(); // Guardar al cambiar de paso
      }
    } else {
      this.finishConsultation();
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number) {
    if (step <= this.currentStep) {
      this.currentStep = step;
    }
  }

  validateCurrentStep(): boolean {
    switch (this.currentStep) {
      case 1:
        if (!this.consultation.weight || !this.consultation.temperature) {
          this.showToast('Por favor completa peso y temperatura', 'warning');
          return false;
        }
        this.validateVitalSigns();
        return true;

      case 2:
        if (!this.consultation.generalCondition) {
          this.showToast('Por favor indica el estado general', 'warning');
          return false;
        }
        return true;

      case 3:
        if (!this.consultation.diagnosis) {
          this.showToast('Por favor ingresa un diagnóstico', 'warning');
          return false;
        }
        return true;

      case 4:
      case 5:
        return true;

      default:
        return true;
    }
  }

  // ========== VITAL SIGNS VALIDATION ==========
  validateVitalSigns() {
    const weight = parseFloat(this.consultation.weight);
    const temperature = parseFloat(this.consultation.temperature);
    const heartRate = parseFloat(this.consultation.heartRate);

    // Validar peso
    if (this.lastRecord?.weight) {
      const lastWeight = parseFloat(this.lastRecord.weight);
      const changePercent = ((weight - lastWeight) / lastWeight) * 100;

      if (Math.abs(changePercent) > 10) {
        this.vitalSignsAlerts.weight = {
          status: 'warning',
          message: `${changePercent > 0 ? 'Aumento' : 'Pérdida'} de ${Math.abs(changePercent).toFixed(1)}% respecto a última consulta`
        };
      } else {
        this.vitalSignsAlerts.weight = { status: 'normal', message: '' };
      }
    }

    // Validar temperatura
    const species = this.pet?.tipoMascota || this.pet?.species || '';
    const isCat = species.toLowerCase().includes('gato');
    const tempRange = isCat ? { min: 38, max: 39.5 } : { min: 38, max: 39.2 };

    if (temperature < tempRange.min - 2) {
      this.vitalSignsAlerts.temperature = {
        status: 'danger',
        message: `⚠️ HIPOTERMIA SEVERA (${temperature}°C muy bajo)`
      };
    } else if (temperature < tempRange.min) {
      this.vitalSignsAlerts.temperature = {
        status: 'warning',
        message: `Temperatura baja (${temperature}°C)`
      };
    } else if (temperature > tempRange.max + 2) {
      this.vitalSignsAlerts.temperature = {
        status: 'danger',
        message: `🔥 FIEBRE ALTA (${temperature}°C)`
      };
    } else if (temperature > tempRange.max) {
      this.vitalSignsAlerts.temperature = {
        status: 'warning',
        message: `Fiebre leve (${temperature}°C)`
      };
    } else {
      this.vitalSignsAlerts.temperature = {
        status: 'normal',
        message: `✓ Normal`
      };
    }

    // Validar frecuencia cardíaca
    if (heartRate) {
      const hrRange = isCat ? { min: 120, max: 140 } : { min: 60, max: 140 };

      // Crítico bajo (bradicardia severa)
      if (heartRate < hrRange.min - 20) {
        this.vitalSignsAlerts.heartRate = {
          status: 'danger',
          message: `⚠️ BRADICARDIA SEVERA (${heartRate} lpm muy bajo)`
        };
      }
      // Crítico alto (taquicardia severa)
      else if (heartRate > hrRange.max + 40) {
        this.vitalSignsAlerts.heartRate = {
          status: 'danger',
          message: `⚠️ TAQUICARDIA SEVERA (${heartRate} lpm muy alto)`
        };
      }
      // Bajo pero no crítico
      else if (heartRate < hrRange.min) {
        this.vitalSignsAlerts.heartRate = {
          status: 'warning',
          message: `Bradicardia leve (${heartRate} lpm)`
        };
      }
      // Alto pero no crítico
      else if (heartRate > hrRange.max) {
        this.vitalSignsAlerts.heartRate = {
          status: 'warning',
          message: `Taquicardia leve (${heartRate} lpm)`
        };
      }
      // Normal
      else {
        this.vitalSignsAlerts.heartRate = {
          status: 'normal',
          message: `✓ Normal`
        };
      }
    } else {
      this.vitalSignsAlerts.heartRate = { status: 'normal', message: '' };
    }
  }

  // ========== SEVERITY VISUAL ==========
  getSeverityWidth(): string {
    switch (this.consultation.severity) {
      case 'leve': return '25%';
      case 'moderada': return '50%';
      case 'severa': return '75%';
      case 'crítica': return '100%';
      default: return '0%';
    }
  }

  // ========== TEMPLATES ==========
  toggleTemplates() {
    this.showTemplates = !this.showTemplates;
  }

  insertTemplate(template: string) {
    const currentField = this.getCurrentTextField();
    if (currentField !== null) {
      const text = this.quickTemplates[template as keyof typeof QUICK_TEMPLATES];
      const currentValue = this.consultation[currentField as keyof typeof this.consultation];
      if (typeof currentValue === 'string') {
        (this.consultation as any)[currentField] += (currentValue ? '\n' : '') + text;
      }
    }
    this.showTemplates = false;
  }

  getCurrentTextField(): string | null {
    switch (this.currentStep) {
      case 2: return 'palpation';
      case 3: return 'diagnosis';
      case 4: return 'recommendations';
      case 5: return 'monitoringInstructions';
      default: return 'notes';
    }
  }

  // ========== PHOTOS ==========
  async takePhoto() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Seleccionar fuente',
      buttons: [
        {
          text: 'Cámara',
          icon: 'camera',
          handler: () => this.capturePhoto(CameraSource.Camera)
        },
        {
          text: 'Galería',
          icon: 'images',
          handler: () => this.capturePhoto(CameraSource.Photos)
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  async capturePhoto(source: CameraSource) {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: source
      });

      if (image.dataUrl) {
        const loading = await this.loadingCtrl.create({
          message: 'Subiendo foto...'
        });
        await loading.present();

        const fileName = `consultations/${this.appointmentId}/${Date.now()}.jpg`;
        const fileRef = this.storage.ref(fileName);
        const uploadTask = this.storage.upload(fileName, this.dataURLtoBlob(image.dataUrl));

        uploadTask.snapshotChanges().pipe(
          finalize(async () => {
            const downloadURL = await firstValueFrom(fileRef.getDownloadURL());
            this.consultation.photos.push(downloadURL);
            loading.dismiss();
            this.showToast('Foto agregada correctamente', 'success');
          })
        ).subscribe();
      }
    } catch (error) {
      this.logger.error('Error capturing photo:', error);
      this.showToast('Error al capturar la foto', 'danger');
    }
  }

  dataURLtoBlob(dataURL: string): Blob {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  removePhoto(index: number) {
    this.consultation.photos.splice(index, 1);
  }

  // ========== PRESCRIPTIONS (LEGACY) ==========
  async addPrescription() {
    const alert = await this.alertCtrl.create({
      header: 'Nueva Prescripción',
      inputs: [
        { name: 'medication', type: 'text', placeholder: 'Medicamento' },
        { name: 'dosage', type: 'text', placeholder: 'Dosis (ej: 10mg cada 12h)' },
        { name: 'duration', type: 'text', placeholder: 'Duración (ej: 7 días)' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Agregar',
          handler: async (data) => {
            if (data.medication) {
              const hasAllergy = await this.checkAllergies(data.medication);
              if (hasAllergy) {
                const confirmAlert = await this.alertCtrl.create({
                  header: '⚠️ ALERTA DE ALERGIA',
                  message: `La mascota es alérgica a ${this.pet.allergies?.join(', ')}. ¿Desea continuar?`,
                  buttons: [
                    { text: 'Cancelar', role: 'cancel' },
                    {
                      text: 'Continuar con cuidado',
                      handler: () => {
                        this.consultation.prescriptions.push(data);
                        this.showToast('Prescripción agregada con advertencia', 'warning');
                      }
                    }
                  ]
                });
                await confirmAlert.present();
              } else {
                this.consultation.prescriptions.push(data);
                this.showToast('Prescripción agregada', 'success');
              }
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async checkAllergies(medication: string): Promise<boolean> {
    if (!this.pet.allergies || this.pet.allergies.length === 0) return false;

    const medLower = medication.toLowerCase();
    return this.pet.allergies.some((allergy: string) =>
      medLower.includes(allergy.toLowerCase()) || allergy.toLowerCase().includes(medLower)
    );
  }

  removePrescription(index: number) {
    this.consultation.prescriptions.splice(index, 1);
  }

  // ========== FINISH CONSULTATION ==========
  async finishConsultation() {
    // Guardar firma si hay dibujo
    if (this.hasSignature()) {
      this.saveSignature();
    }

    const loading = await this.loadingCtrl.create({
      message: 'Guardando consulta...'
    });
    await loading.present();

    try {
      // Crear registro médico
      const medicalRecord = {
        petId: this.pet.id,
        appointmentId: this.appointmentId,
        date: new Date(),

        // Signos vitales
        weight: parseFloat(this.consultation.weight),
        temperature: parseFloat(this.consultation.temperature),
        heartRate: this.consultation.heartRate ? parseFloat(this.consultation.heartRate) : null,
        respiratoryRate: this.consultation.respiratoryRate ? parseFloat(this.consultation.respiratoryRate) : null,

        // Examinación
        examination: {
          generalCondition: this.consultation.generalCondition,
          mucosas: this.consultation.mucosas,
          hydration: this.consultation.hydration,
          palpation: this.consultation.palpation,
        },

        // Diagnóstico
        diagnosis: this.consultation.diagnosis,
        differentialDiagnosis: this.consultation.differentialDiagnosis,
        severity: this.consultation.severity,

        // Tratamiento
        prescriptions: this.consultation.prescriptions,
        procedures: this.consultation.procedures,
        recommendations: this.consultation.recommendations,

        // Seguimiento
        nextAppointmentDays: this.consultation.nextAppointmentDays ? parseInt(this.consultation.nextAppointmentDays) : null,
        monitoringInstructions: this.consultation.monitoringInstructions,
        redFlags: this.consultation.redFlags,

        // General
        notes: this.consultation.notes,
        photos: this.consultation.photos,
        signature: this.consultation.signature,

        type: 'consultation',
        createdAt: new Date(),
      };

      // Guardar en Firestore
      await this.firestore.collection('medical-records').add(medicalRecord);

      // Actualizar estado de la cita
      await this.firestore.collection('veterinaryAppointments').doc(this.appointmentId).update({
        status: 'completada',
        completedAt: new Date()
      });

      // Crear recordatorio si hay próximo control
      if (this.consultation.nextAppointmentDays) {
        await this.createFollowUpReminder();
      }

      // Limpiar borrador
      this.clearDraft();

      loading.dismiss();

      // Mostrar opciones de finalización
      await this.showCompletionOptions();

    } catch (error) {
      loading.dismiss();
      this.logger.error('Error saving consultation:', error);
      this.showToast('Error al guardar la consulta', 'danger');
    }
  }

  async showCompletionOptions() {
    const alert = await this.alertCtrl.create({
      header: '✅ Consulta Completada',
      message: 'La consulta ha sido guardada exitosamente.',
      buttons: [
        {
          text: 'Enviar por Email',
          handler: () => {
            this.sendPrescriptionEmail();
          }
        },
        {
          text: 'Ver Resumen PDF',
          handler: () => {
            this.generatePDF();
          }
        },
        {
          text: 'Volver al Dashboard',
          handler: () => {
            this.router.navigate(['/veterinarian/dashboard']);
          }
        }
      ],
      backdropDismiss: false
    });
    await alert.present();
  }

  async generatePDF() {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPosition = 20;

      // Título
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('CONSULTA VETERINARIA', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Información del paciente
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Información del Paciente', margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Nombre: ${this.pet?.nombre || this.pet?.name || 'N/A'}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Especie: ${this.pet?.tipoMascota || 'N/A'} - Raza: ${this.pet?.raza || 'N/A'}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, margin, yPosition);
      yPosition += 12;

      // Signos Vitales
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Signos Vitales', margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Peso: ${this.consultation.weight} kg | Temp: ${this.consultation.temperature}°C`, margin, yPosition);
      yPosition += 12;

      // Diagnóstico
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Diagnóstico', margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const diagnosisLines = doc.splitTextToSize(this.consultation.diagnosis, pageWidth - 2 * margin);
      doc.text(diagnosisLines, margin, yPosition);
      yPosition += diagnosisLines.length * 6 + 8;

      // Prescripciones
      if (this.consultation.prescriptions.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Tratamiento', margin, yPosition);
        yPosition += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        this.consultation.prescriptions.forEach((rx: any, i: number) => {
          doc.text(`${i + 1}. ${rx.medication} - ${rx.dosage} (${rx.duration || rx.frequency})`, margin, yPosition);
          yPosition += 6;
        });
        yPosition += 6;
      }

      // Firma si existe
      if (this.consultation.signature) {
        yPosition += 10;
        doc.setFontSize(10);
        doc.text('Firma del Veterinario:', margin, yPosition);
        yPosition += 5;
        doc.addImage(this.consultation.signature, 'PNG', margin, yPosition, 60, 30);
      }

      // Guardar
      const fileName = `consulta_${this.pet?.nombre || 'paciente'}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      await this.showToast('PDF generado exitosamente', 'success');

      setTimeout(() => {
        this.router.navigate(['/veterinarian/dashboard']);
      }, 1000);

    } catch (error) {
      this.logger.error('Error generating PDF:', error);
      await this.showToast('Error al generar PDF', 'danger');
      this.router.navigate(['/veterinarian/dashboard']);
    }
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'bottom'
    });
    await toast.present();
  }
}
