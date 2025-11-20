import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { LoadingController, AlertController, ToastController, ActionSheetController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { firstValueFrom } from 'rxjs';
import { finalize } from 'rxjs/operators';

// Plantillas de texto rápido
const QUICK_TEMPLATES = {
  normal: 'Sin hallazgos anormales',
  stable: 'Paciente en condiciones estables',
  followup: 'Requiere seguimiento en ___ días',
  informed: 'Propietario informado de riesgos y tratamiento',
  recovered: 'Paciente se encuentra en proceso de recuperación',
  medication: 'Se prescribe medicación según indicaciones',
};

@Component({
  selector: 'app-consultation',
  templateUrl: './consultation.page.html',
  styleUrls: ['./consultation.page.scss'],
})
export class ConsultationPage implements OnInit {
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firestore: AngularFirestore,
    private storage: AngularFireStorage,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private actionSheetCtrl: ActionSheetController
  ) { }

  async ngOnInit() {
    this.appointmentId = this.route.snapshot.paramMap.get('id') || '';
    
    // Verificar si es modo de solo lectura
    this.route.queryParams.subscribe(params => {
      this.viewOnly = params['viewOnly'] === 'true';
    });
    
    await this.loadConsultationData();
  }

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
                    };
                  }
                }
              } catch (error) {
                console.error('Error loading saved record:', error);
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
                console.warn('Could not load medical history (index may be needed):', historyError);
                // Continuar sin registro previo
                this.lastRecord = null;
              }
            }
          }
        }
      }
      
      this.loading = false;
    } catch (error) {
      console.error('Error loading consultation data:', error);
      this.loading = false;
    } finally {
      loading.dismiss();
    }
  }

  // Navegación de pasos
  nextStep() {
    if (this.currentStep < this.totalSteps) {
      if (this.validateCurrentStep()) {
        this.steps[this.currentStep - 1].completed = true;
        this.currentStep++;
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
      case 1: // Signos Vitales
        if (!this.consultation.weight || !this.consultation.temperature) {
          this.showToast('Por favor completa peso y temperatura', 'warning');
          return false;
        }
        this.validateVitalSigns();
        return true;
        
      case 2: // Examinación
        if (!this.consultation.generalCondition) {
          this.showToast('Por favor indica el estado general', 'warning');
          return false;
        }
        return true;
        
      case 3: // Diagnóstico
        if (!this.consultation.diagnosis) {
          this.showToast('Por favor ingresa un diagnóstico', 'warning');
          return false;
        }
        return true;
        
      case 4: // Tratamiento
        return true; // Opcional
        
      case 5: // Seguimiento
        return true; // Opcional
        
      default:
        return true;
    }
  }

  // Validar signos vitales
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

    // Validar temperatura (perros: 38-39.2°C, gatos: 38-39.5°C)
    const tempRange = this.pet.species === 'Gato' ? { min: 38, max: 39.5 } : { min: 38, max: 39.2 };
    
    if (temperature < tempRange.min - 2) {
      this.vitalSignsAlerts.temperature = { status: 'danger', message: 'HIPOTERMIA SEVERA' };
    } else if (temperature < tempRange.min) {
      this.vitalSignsAlerts.temperature = { status: 'warning', message: 'Hipotermia leve' };
    } else if (temperature > tempRange.max + 2) {
      this.vitalSignsAlerts.temperature = { status: 'danger', message: 'FIEBRE ALTA' };
    } else if (temperature > tempRange.max) {
      this.vitalSignsAlerts.temperature = { status: 'warning', message: 'Fiebre' };
    } else {
      this.vitalSignsAlerts.temperature = { status: 'normal', message: 'Normal' };
    }

    // Validar frecuencia cardíaca (perros: 60-140 lpm, gatos: 120-140 lpm)
    if (heartRate) {
      const hrRange = this.pet.species === 'Gato' ? { min: 120, max: 140 } : { min: 60, max: 140 };
      
      if (heartRate < hrRange.min - 20 || heartRate > hrRange.max + 40) {
        this.vitalSignsAlerts.heartRate = { status: 'danger', message: 'FUERA DE RANGO CRÍTICO' };
      } else if (heartRate < hrRange.min || heartRate > hrRange.max) {
        this.vitalSignsAlerts.heartRate = { status: 'warning', message: 'Fuera de rango normal' };
      } else {
        this.vitalSignsAlerts.heartRate = { status: 'normal', message: 'Normal' };
      }
    }
  }

  // Plantillas de texto rápido
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

  // Captura de fotos
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
        // Subir a Firebase Storage
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
      console.error('Error capturing photo:', error);
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

  // Agregar prescripción
  async addPrescription() {
    const alert = await this.alertCtrl.create({
      header: 'Nueva Prescripción',
      inputs: [
        {
          name: 'medication',
          type: 'text',
          placeholder: 'Medicamento'
        },
        {
          name: 'dosage',
          type: 'text',
          placeholder: 'Dosis (ej: 10mg cada 12h)'
        },
        {
          name: 'duration',
          type: 'text',
          placeholder: 'Duración (ej: 7 días)'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Agregar',
          handler: async (data) => {
            if (data.medication) {
              // Validar alergias
              const hasAllergy = await this.checkAllergies(data.medication);
              if (hasAllergy) {
                const confirmAlert = await this.alertCtrl.create({
                  header: '⚠️ ALERTA DE ALERGIA',
                  message: `La mascota es alérgica a ${this.pet.allergies.join(', ')}. ¿Desea continuar de todas formas?`,
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

  // Finalizar consulta
  async finishConsultation() {
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

      loading.dismiss();
      
      // Mostrar resumen y opciones
      await this.showCompletionOptions();
      
    } catch (error) {
      loading.dismiss();
      console.error('Error saving consultation:', error);
      this.showToast('Error al guardar la consulta', 'danger');
    }
  }

  async showCompletionOptions() {
    const alert = await this.alertCtrl.create({
      header: '✅ Consulta Completada',
      message: 'La consulta ha sido guardada exitosamente.',
      buttons: [
        {
          text: 'Ver Resumen PDF',
          handler: () => {
            this.generatePDF();
          }
        },
        {
          text: 'Volver al Dashboard',
          handler: () => {
            this.router.navigate(['/veterinario/dashboard']);
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
      
      // Configuración
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPosition = 20;
      
      // Título
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('CONSULTA VETERINARIA', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;
      
      // Información de la mascota
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Información del Paciente', margin, yPosition);
      yPosition += 8;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Nombre: ${this.pet.nombre || 'N/A'}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Especie: ${this.pet.tipoMascota || 'N/A'} - Raza: ${this.pet.raza || 'N/A'}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Sexo: ${this.pet.sexo || 'N/A'} - Color: ${this.pet.color || 'N/A'}`, margin, yPosition);
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
      doc.text(`Peso: ${this.consultation.weight} kg`, margin, yPosition);
      yPosition += 6;
      doc.text(`Temperatura: ${this.consultation.temperature} °C`, margin, yPosition);
      yPosition += 6;
      if (this.consultation.heartRate) {
        doc.text(`Frecuencia Cardíaca: ${this.consultation.heartRate} lpm`, margin, yPosition);
        yPosition += 6;
      }
      if (this.consultation.respiratoryRate) {
        doc.text(`Frecuencia Respiratoria: ${this.consultation.respiratoryRate} rpm`, margin, yPosition);
        yPosition += 6;
      }
      yPosition += 8;
      
      // Examinación
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Examinación Física', margin, yPosition);
      yPosition += 8;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Estado General: ${this.consultation.generalCondition}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Mucosas: ${this.consultation.mucosas}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Hidratación: ${this.consultation.hydration}`, margin, yPosition);
      yPosition += 6;
      
      if (this.consultation.palpation) {
        doc.text('Palpación:', margin, yPosition);
        yPosition += 6;
        const palpationLines = doc.splitTextToSize(this.consultation.palpation, pageWidth - 2 * margin);
        doc.text(palpationLines, margin + 5, yPosition);
        yPosition += palpationLines.length * 6 + 6;
      }
      
      // Diagnóstico
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Diagnóstico', margin, yPosition);
      yPosition += 8;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      if (this.consultation.diagnosis) {
        doc.text('Diagnóstico Principal:', margin, yPosition);
        yPosition += 6;
        const diagnosisLines = doc.splitTextToSize(this.consultation.diagnosis, pageWidth - 2 * margin);
        doc.text(diagnosisLines, margin + 5, yPosition);
        yPosition += diagnosisLines.length * 6 + 6;
      }
      
      if (this.consultation.differentialDiagnosis) {
        doc.text('Diagnóstico Diferencial:', margin, yPosition);
        yPosition += 6;
        const diffLines = doc.splitTextToSize(this.consultation.differentialDiagnosis, pageWidth - 2 * margin);
        doc.text(diffLines, margin + 5, yPosition);
        yPosition += diffLines.length * 6 + 6;
      }
      
      doc.text(`Severidad: ${this.consultation.severity}`, margin, yPosition);
      yPosition += 12;
      
      // Tratamiento
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Tratamiento', margin, yPosition);
      yPosition += 8;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      if (this.consultation.prescriptions.length > 0) {
        doc.text('Prescripciones:', margin, yPosition);
        yPosition += 6;
        this.consultation.prescriptions.forEach((prescription: any, index: number) => {
          doc.text(`${index + 1}. ${prescription.medication} - ${prescription.dosage} (${prescription.duration})`, margin + 5, yPosition);
          yPosition += 6;
        });
        yPosition += 6;
      }
      
      if (this.consultation.recommendations) {
        doc.text('Recomendaciones:', margin, yPosition);
        yPosition += 6;
        const recomLines = doc.splitTextToSize(this.consultation.recommendations, pageWidth - 2 * margin);
        doc.text(recomLines, margin + 5, yPosition);
        yPosition += recomLines.length * 6 + 12;
      }
      
      // Seguimiento
      if (this.consultation.nextAppointmentDays) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Seguimiento', margin, yPosition);
        yPosition += 8;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Próximo control en: ${this.consultation.nextAppointmentDays} días`, margin, yPosition);
        yPosition += 6;
      }
      
      // Guardar PDF
      const fileName = `consulta_${this.pet.nombre}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      await this.showToast('PDF generado exitosamente', 'success');
      
      // Volver al dashboard después de un momento
      setTimeout(() => {
        this.router.navigate(['/veterinario/dashboard']);
      }, 1000);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      await this.showToast('Error al generar PDF', 'danger');
      this.router.navigate(['/veterinario/dashboard']);
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
