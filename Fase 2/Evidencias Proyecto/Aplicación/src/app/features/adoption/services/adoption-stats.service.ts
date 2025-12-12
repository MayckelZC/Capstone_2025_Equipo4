import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AdoptionRequest } from '@models/AdoptionRequest';

/**
 * AdoptionStatsService
 * 
 * Servicio dedicado a estadísticas y métricas de adopciones.
 * Responsabilidades:
 * - Conteos de adopciones
 * - Métricas por período
 * - Datos para dashboards
 */
@Injectable({
    providedIn: 'root'
})
export class AdoptionStatsService {

    constructor(private firestore: AngularFirestore) { }

    /**
     * Obtiene el conteo total de adopciones aprobadas
     */
    getCount(): Observable<number> {
        return this.firestore.collection('adoption-requests', ref =>
            ref.where('status', '==', 'approved')
        ).get().pipe(
            map(snapshot => snapshot.size)
        );
    }

    /**
     * Obtiene el conteo de adopciones completadas
     */
    getCompletedCount(): Observable<number> {
        return this.firestore.collection('adoption-requests', ref =>
            ref.where('status', '==', 'completed')
        ).get().pipe(
            map(snapshot => snapshot.size)
        );
    }

    /**
     * Obtiene el número de nuevas adopciones aprobadas en la última semana
     */
    getNewApprovedAdoptionsCountThisWeek(): Observable<number> {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        return this.firestore.collection<AdoptionRequest>('adoption-requests', ref =>
            ref.where('status', '==', 'approved')
                .where('reviewedAt', '>=', oneWeekAgo)
        ).snapshotChanges().pipe(
            map(snaps => snaps.length)
        );
    }

    /**
     * Obtener cantidad de adopciones completadas por mes
     * @param months Número de meses hacia atrás para analizar
     */
    getAdoptionsByMonth(months: number = 6): Observable<number[]> {
        return this.firestore.collection<AdoptionRequest>('adoption-requests', ref =>
            ref.where('status', '==', 'completed')
        ).valueChanges().pipe(
            map(requests => {
                const now = new Date();
                const monthlyData: number[] = [];

                // Inicializar array con ceros
                for (let i = 0; i < months; i++) {
                    monthlyData.push(0);
                }

                // Contar adopciones por mes
                requests.forEach(request => {
                    // Usamos reviewedAt o completedAt si existe, o updatedAt como fallback
                    const dateField = request.reviewedAt || (request as any).completedAt || (request as any).updatedAt;

                    if (dateField) {
                        const completedDate = (dateField as any).toDate ? (dateField as any).toDate() : new Date(dateField);
                        const monthsDiff = this.getMonthsDifference(completedDate, now);

                        if (monthsDiff >= 0 && monthsDiff < months) {
                            const index = months - 1 - monthsDiff;
                            monthlyData[index]++;
                        }
                    }
                });

                return monthlyData;
            })
        );
    }

    /**
     * Obtiene estadísticas generales para el dashboard
     */
    getDashboardStats(): Observable<{
        total: number;
        pending: number;
        approved: number;
        completed: number;
    }> {
        return this.firestore.collection<AdoptionRequest>('adoption-requests')
            .valueChanges()
            .pipe(
                map(requests => ({
                    total: requests.length,
                    pending: requests.filter(r => r.status === 'pending').length,
                    approved: requests.filter(r => r.status === 'approved').length,
                    completed: requests.filter(r => r.status === 'completed').length
                }))
            );
    }

    /**
     * Calcular diferencia en meses entre dos fechas
     */
    private getMonthsDifference(date1: Date, date2: Date): number {
        return (date2.getFullYear() - date1.getFullYear()) * 12 + (date2.getMonth() - date1.getMonth());
    }
}
