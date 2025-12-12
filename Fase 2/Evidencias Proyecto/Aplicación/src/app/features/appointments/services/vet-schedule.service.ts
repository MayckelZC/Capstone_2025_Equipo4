import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, of, combineLatest } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
    VetScheduleConfig,
    TimeSlot,
    DaySchedule,
    AppointmentTypeConfig,
    DEFAULT_VET_SCHEDULE_CONFIG,
    APPOINTMENT_TYPES
} from '../models/schedule-config.interface';
import { VeterinaryAppointment } from '@models/VeterinaryAppointment';
import { LoggerService } from '@core/services/logger.service';

@Injectable({
    providedIn: 'root'
})
export class VetScheduleService {
    private config: VetScheduleConfig = DEFAULT_VET_SCHEDULE_CONFIG;

    constructor(
        private firestore: AngularFirestore,
        private logger: LoggerService
    ) { }

    /**
     * Get available appointment types
     */
    getAppointmentTypes(): AppointmentTypeConfig[] {
        return APPOINTMENT_TYPES.filter(t => t.id !== 'emergencia');
    }

    /**
     * Get appointment type by ID
     */
    getAppointmentType(typeId: string): AppointmentTypeConfig | undefined {
        return APPOINTMENT_TYPES.find(t => t.id === typeId);
    }

    /**
     * Get duration for appointment type
     */
    getDurationForType(typeId: string): number {
        const type = this.getAppointmentType(typeId);
        return type?.durationMinutes || this.config.defaultSlotDuration;
    }

    /**
     * Generate time slots for a given date
     */
    generateTimeSlotsForDate(date: Date): TimeSlot[] {
        const dayOfWeek = date.getDay();
        const workingBlocks = this.config.workingHours.filter(
            wh => wh.dayOfWeek === dayOfWeek && wh.isActive
        );

        if (workingBlocks.length === 0) {
            return []; // Not a working day
        }

        const slots: TimeSlot[] = [];
        const slotDuration = this.config.defaultSlotDuration;

        for (const block of workingBlocks) {
            const startMinutes = this.timeToMinutes(block.start);
            const endMinutes = this.timeToMinutes(block.end);

            for (let minutes = startMinutes; minutes < endMinutes; minutes += slotDuration) {
                const time = this.minutesToTime(minutes);

                // Check if in break time
                const isBreak = this.config.breakTimes.some(br => {
                    const brStart = this.timeToMinutes(br.start);
                    const brEnd = this.timeToMinutes(br.end);
                    return minutes >= brStart && minutes < brEnd;
                });

                if (!isBreak) {
                    slots.push({
                        time,
                        displayTime: this.formatDisplayTime(time),
                        available: true,
                        isEmergencySlot: false
                    });
                }
            }
        }

        // Mark last N slots as emergency reserved
        const emergencyCount = Math.min(this.config.emergencySlotsReserved, slots.length);
        for (let i = slots.length - emergencyCount; i < slots.length; i++) {
            slots[i].isEmergencySlot = true;
            slots[i].available = false;
            slots[i].blockedReason = 'Reservado para emergencias';
        }

        return slots;
    }

    /**
     * Get available slots for a date considering existing appointments
     */
    getAvailableSlotsForDate(date: Date, appointmentDuration: number = 20): Observable<TimeSlot[]> {
        const slots = this.generateTimeSlotsForDate(date);

        if (slots.length === 0) {
            return of([]);
        }

        // Check minimum advance time
        const now = new Date();
        const minDate = new Date(now.getTime() + this.config.minAdvanceHours * 60 * 60 * 1000);

        if (date < minDate) {
            return of(slots.map(s => ({
                ...s,
                available: false,
                blockedReason: `Requiere ${this.config.minAdvanceHours}h de anticipación`
            })));
        }

        // Get booked appointments for the date
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        return this.firestore.collection<VeterinaryAppointment>('veterinaryAppointments', ref =>
            ref.where('appointmentDate', '>=', startOfDay)
                .where('appointmentDate', '<=', endOfDay)
        ).valueChanges().pipe(
            map(appointments => {
                const activeAppointments = appointments.filter(
                    a => a.status !== 'cancelada'
                );

                // Calculate slots needed based on buffer
                const slotsNeeded = Math.ceil((appointmentDuration + this.config.bufferBetweenSlots) / this.config.defaultSlotDuration);

                return slots.map((slot, index) => {
                    if (slot.isEmergencySlot) {
                        return slot;
                    }

                    // Check if this slot is booked
                    const isBooked = activeAppointments.some(apt => {
                        const aptSlots = Math.ceil((apt.estimatedDuration + this.config.bufferBetweenSlots) / this.config.defaultSlotDuration);
                        const aptStartIdx = slots.findIndex(s => s.time === apt.timeSlot);
                        return index >= aptStartIdx && index < aptStartIdx + aptSlots;
                    });

                    // Check if there's enough consecutive slots
                    let hasEnoughSlots = true;
                    if (slotsNeeded > 1) {
                        for (let i = 1; i < slotsNeeded; i++) {
                            const nextSlot = slots[index + i];
                            if (!nextSlot || nextSlot.isEmergencySlot) {
                                hasEnoughSlots = false;
                                break;
                            }
                            const nextBooked = activeAppointments.some(apt => apt.timeSlot === nextSlot.time);
                            if (nextBooked) {
                                hasEnoughSlots = false;
                                break;
                            }
                        }
                    }

                    // Check if past time today
                    const slotTime = new Date(date);
                    const [hours, mins] = slot.time.split(':').map(Number);
                    slotTime.setHours(hours, mins, 0, 0);
                    const isPast = slotTime <= now;

                    return {
                        ...slot,
                        available: !isBooked && hasEnoughSlots && !isPast,
                        blockedReason: isBooked ? 'Ocupado' :
                            !hasEnoughSlots ? 'Tiempo insuficiente' :
                                isPast ? 'Hora pasada' : undefined
                    };
                });
            }),
            catchError(error => {
                this.logger.error('Error fetching appointments:', error);
                return of(slots);
            })
        );
    }

    /**
     * Get schedule for multiple days (calendar view)
     */
    getWeekSchedule(startDate: Date, days: number = 7): Observable<DaySchedule[]> {
        const schedules: Observable<DaySchedule>[] = [];

        for (let i = 0; i < days; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);

            // Skip if beyond max advance days
            const now = new Date();
            const maxDate = new Date(now.getTime() + this.config.maxAdvanceDays * 24 * 60 * 60 * 1000);
            if (date > maxDate) break;

            schedules.push(
                this.getAvailableSlotsForDate(date).pipe(
                    map(slots => ({
                        date,
                        dayName: this.getDayName(date),
                        isWorkingDay: slots.length > 0,
                        slots,
                        availableCount: slots.filter(s => s.available).length,
                        totalCount: slots.length
                    }))
                )
            );
        }

        return combineLatest(schedules);
    }

    /**
     * Validate appointment booking
     */
    validateBooking(date: Date, timeSlot: string, appointmentType: string): { valid: boolean; error?: string } {
        const now = new Date();
        const minDate = new Date(now.getTime() + this.config.minAdvanceHours * 60 * 60 * 1000);
        const maxDate = new Date(now.getTime() + this.config.maxAdvanceDays * 24 * 60 * 60 * 1000);

        if (date < minDate) {
            return { valid: false, error: `Las citas requieren al menos ${this.config.minAdvanceHours} horas de anticipación` };
        }

        if (date > maxDate) {
            return { valid: false, error: `No se pueden agendar citas con más de ${this.config.maxAdvanceDays} días de anticipación` };
        }

        const slots = this.generateTimeSlotsForDate(date);
        const slot = slots.find(s => s.time === timeSlot);

        if (!slot) {
            return { valid: false, error: 'Horario no válido para este día' };
        }

        if (slot.isEmergencySlot) {
            return { valid: false, error: 'Este horario está reservado para emergencias' };
        }

        return { valid: true };
    }

    /**
     * Calculate end time based on start time and duration
     */
    calculateEndTime(startTime: string, durationMinutes: number): string {
        const startMinutes = this.timeToMinutes(startTime);
        const endMinutes = startMinutes + durationMinutes;
        return this.minutesToTime(endMinutes);
    }

    // Helper methods
    private timeToMinutes(time: string): number {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }

    private minutesToTime(minutes: number): string {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }

    private formatDisplayTime(time: string): string {
        const [hours, minutes] = time.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    }

    private getDayName(date: Date): string {
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        return days[date.getDay()];
    }

    /**
     * Get availability color indicator
     */
    getAvailabilityColor(availableCount: number, totalCount: number): string {
        if (availableCount === 0) return 'danger';
        const ratio = availableCount / totalCount;
        if (ratio > 0.5) return 'success';
        if (ratio > 0.2) return 'warning';
        return 'danger';
    }
}
