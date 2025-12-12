import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastController, AlertController, LoadingController, ModalController } from '@ionic/angular';
import { Subscription } from 'rxjs';

import { VetScheduleService } from '../../services/vet-schedule.service';
import { AppointmentService } from '../../services/appointment.service';
import { AuthService } from '@core/services/auth.service';
import { PetsService } from '@features/pets/services/pets.service';
import { TimeSlot, AppointmentTypeConfig, APPOINTMENT_TYPES } from '../../models/schedule-config.interface';
import { VeterinaryAppointment } from '@models/VeterinaryAppointment';
import { Adopcion } from '@models/Adopcion';

interface CalendarDay {
    date: Date;
    day: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
    isDisabled: boolean;
    availabilityLevel: 'high' | 'medium' | 'low' | 'none';
}

@Component({
    selector: 'app-agendar-cita',
    templateUrl: './agendar-cita.page.html',
    styleUrls: ['./agendar-cita.page.scss'],
})
export class AgendarCitaPage implements OnInit, OnDestroy {
    // Data
    userPets: Adopcion[] = [];
    calendarDays: CalendarDay[] = [];
    morningSlots: TimeSlot[] = [];
    afternoonSlots: TimeSlot[] = [];

    // Simplified appointment types
    appointmentTypes: AppointmentTypeConfig[] = [
        { id: 'control', name: 'Control', description: 'Revisión general', durationMinutes: 20, icon: 'pulse-outline', color: 'success' },
        { id: 'vacunacion', name: 'Vacunas', description: 'Aplicación de vacunas', durationMinutes: 15, icon: 'medical-outline', color: 'primary' },
        { id: 'consulta', name: 'Consulta', description: 'Evaluación de síntomas', durationMinutes: 30, icon: 'medkit-outline', color: 'tertiary' },
        { id: 'otro', name: 'Otro', description: 'Especificar motivo', durationMinutes: 30, icon: 'ellipsis-horizontal-outline', color: 'medium' }
    ];

    // Selection state - using signals
    selectedPet = signal<Adopcion | null>(null);
    selectedType = signal<AppointmentTypeConfig | null>(null);
    selectedDate = signal<Date | null>(null);
    selectedTime = signal<string | null>(null);
    reason = signal<string>('');

    // UI state
    isLoading = true;
    isSubmitting = false;
    currentMonth: Date = new Date();

    // User info
    private userId = '';
    private userName = '';
    private userEmail = '';
    private subscriptions: Subscription[] = [];

    // Computed
    canSubmit = computed(() => {
        return this.selectedPet() &&
            this.selectedType() &&
            this.selectedDate() &&
            this.selectedTime();
    });

    selectedDateFormatted = computed(() => {
        const date = this.selectedDate();
        if (!date) return '';
        return date.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
    });

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private toastController: ToastController,
        private alertController: AlertController,
        private loadingController: LoadingController,
        private modalController: ModalController,
        private scheduleService: VetScheduleService,
        private appointmentService: AppointmentService,
        private authService: AuthService,
        private petsService: PetsService
    ) { }

    async ngOnInit() {
        await this.loadUserData();
        this.generateCalendar();
    }

    private async loadUserData() {
        this.isLoading = true;
        try {
            const user = await this.authService.getCurrentUser();
            if (!user) {
                this.router.navigate(['/auth/login']);
                return;
            }

            this.userId = user.uid;
            this.userEmail = user.email || '';
            this.userName = (user as any).displayName || user.email?.split('@')[0] || 'Usuario';

            const pets = await this.petsService.getUserPets(user.uid);
            this.userPets = pets;

            // Pre-select first pet or from route
            const petId = this.route.snapshot.queryParams['petId'];
            if (petId) {
                const pet = pets.find(p => p.id === petId);
                if (pet) this.selectedPet.set(pet);
            } else if (pets.length === 1) {
                this.selectedPet.set(pets[0]);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            this.presentToast('Error al cargar datos', 'danger');
        } finally {
            this.isLoading = false;
        }
    }

    // Calendar methods
    generateCalendar() {
        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        // Start from Monday of the week containing the 1st
        const startDate = new Date(firstDay);
        const dayOfWeek = startDate.getDay();
        startDate.setDate(startDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const selected = this.selectedDate();

        this.calendarDays = [];
        const current = new Date(startDate);

        for (let i = 0; i < 42; i++) { // 6 weeks
            const isCurrentMonth = current.getMonth() === month;
            const isToday = current.toDateString() === today.toDateString();
            const isSelected = selected ? current.toDateString() === selected.toDateString() : false;
            const isPast = current < today;
            const isSunday = current.getDay() === 0;
            const isTooFarOut = current > new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

            this.calendarDays.push({
                date: new Date(current),
                day: current.getDate(),
                isCurrentMonth,
                isToday,
                isSelected,
                isDisabled: isPast || isSunday || isTooFarOut || !isCurrentMonth,
                availabilityLevel: this.getAvailabilityLevel(current, isPast || isSunday || isTooFarOut)
            });

            current.setDate(current.getDate() + 1);
        }
    }

    getAvailabilityLevel(date: Date, disabled: boolean): 'high' | 'medium' | 'low' | 'none' {
        if (disabled) return 'none';
        // Simplified - could be connected to real data
        const day = date.getDay();
        if (day === 6) return 'low'; // Saturday
        return 'high';
    }

    previousMonth() {
        this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
        this.generateCalendar();
    }

    nextMonth() {
        this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
        this.generateCalendar();
    }

    getMonthYear(): string {
        return this.currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    }

    // Selection methods
    selectPet(pet: Adopcion) {
        this.selectedPet.set(pet);
    }

    selectType(type: AppointmentTypeConfig) {
        this.selectedType.set(type);
        // Reload slots if date selected
        if (this.selectedDate()) {
            this.loadSlotsForDate(this.selectedDate()!);
        }
    }

    selectDay(day: CalendarDay) {
        if (day.isDisabled) return;

        // Update selection
        this.calendarDays = this.calendarDays.map(d => ({
            ...d,
            isSelected: d.date.toDateString() === day.date.toDateString()
        }));

        this.selectedDate.set(day.date);
        this.selectedTime.set(null);
        this.loadSlotsForDate(day.date);
    }

    loadSlotsForDate(date: Date) {
        const duration = this.selectedType()?.durationMinutes || 20;

        this.subscriptions.push(
            this.scheduleService.getAvailableSlotsForDate(date, duration).subscribe(slots => {
                // Split into morning and afternoon
                this.morningSlots = slots.filter(s => {
                    const hour = parseInt(s.time.split(':')[0]);
                    return hour < 12;
                });
                this.afternoonSlots = slots.filter(s => {
                    const hour = parseInt(s.time.split(':')[0]);
                    return hour >= 14;
                });
            })
        );
    }

    selectTime(slot: TimeSlot) {
        if (!slot.available) return;
        this.selectedTime.set(slot.time);
    }

    updateReason(event: any) {
        this.reason.set(event.detail.value || '');
    }

    // Symptom chips
    symptomChips = ['Vómitos', 'Diarrea', 'No come', 'Cojea', 'Tos', 'Picazón'];

    addSymptom(symptom: string) {
        const current = this.reason();
        if (!current.includes(symptom)) {
            this.reason.set(current ? `${current}, ${symptom}` : symptom);
        }
    }

    // Submit
    async submitAppointment() {
        if (!this.canSubmit()) return;

        const pet = this.selectedPet()!;
        const type = this.selectedType()!;
        const date = this.selectedDate()!;
        const time = this.selectedTime()!;

        const alert = await this.alertController.create({
            header: '¿Confirmar cita?',
            message: `
        <div style="text-align:left">
          <p><strong>🐾 ${pet.nombre}</strong></p>
          <p>📋 ${type.name} (${type.durationMinutes} min)</p>
          <p>📅 ${this.selectedDateFormatted()}</p>
          <p>⏰ ${time}</p>
        </div>
      `,
            buttons: [
                { text: 'Cancelar', role: 'cancel' },
                { text: 'Confirmar', handler: () => this.createAppointment() }
            ]
        });
        await alert.present();
    }

    private async createAppointment() {
        const loading = await this.loadingController.create({ message: 'Agendando...' });
        await loading.present();
        this.isSubmitting = true;

        try {
            const pet = this.selectedPet()!;
            const type = this.selectedType()!;
            const date = this.selectedDate()!;
            const time = this.selectedTime()!;

            const [hours, minutes] = time.split(':').map(Number);
            const appointmentDate = new Date(date);
            appointmentDate.setHours(hours, minutes, 0, 0);

            const endTime = this.scheduleService.calculateEndTime(time, type.durationMinutes);

            const appointment: Omit<VeterinaryAppointment, 'id'> = {
                userId: this.userId,
                userName: this.userName,
                userEmail: this.userEmail,
                petId: pet.id || '',
                petName: pet.nombre || '',
                appointmentDate,
                timeSlot: time,
                endTime,
                status: 'pendiente',
                reason: this.reason() || type.name,
                appointmentType: type.id,
                estimatedDuration: type.durationMinutes,
                createdAt: new Date()
            };

            await this.appointmentService.createVeterinaryAppointment(appointment);

            await loading.dismiss();
            this.presentToast('¡Cita agendada!', 'success');

            // Close modal if opened as modal, otherwise navigate
            try {
                await this.modalController.dismiss({ success: true });
            } catch {
                this.router.navigate(['/appointments/mis-citas']);
            }
        } catch (error) {
            console.error('Error creating appointment:', error);
            await loading.dismiss();
            this.presentToast('Error al agendar', 'danger');
        } finally {
            this.isSubmitting = false;
        }
    }

    async presentToast(message: string, color: string) {
        const toast = await this.toastController.create({
            message,
            duration: 2500,
            color,
            position: 'bottom'
        });
        toast.present();
    }

    close() {
        try {
            this.modalController.dismiss();
        } catch {
            this.router.navigate(['/pets/home']);
        }
    }

    ngOnDestroy() {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }
}
