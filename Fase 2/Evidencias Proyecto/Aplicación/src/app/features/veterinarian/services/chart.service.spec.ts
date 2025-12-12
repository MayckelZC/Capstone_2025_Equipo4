import { TestBed } from '@angular/core/testing';
import { ElementRef } from '@angular/core';
import { ChartService } from './chart.service';
import { WeeklyActivity, ConsultationStats } from '../models/veterinarian.interfaces';

describe('ChartService', () => {
    let service: ChartService;
    let mockCanvas: ElementRef<HTMLCanvasElement>;
    let mockContext: any;

    beforeEach(() => {
        mockContext = {
            fillRect: jasmine.createSpy('fillRect'),
            clearRect: jasmine.createSpy('clearRect'),
            getImageData: jasmine.createSpy('getImageData').and.returnValue({ data: [] }),
            putImageData: jasmine.createSpy('putImageData'),
            createLinearGradient: jasmine.createSpy('createLinearGradient').and.returnValue({
                addColorStop: jasmine.createSpy('addColorStop')
            }),
            createPattern: jasmine.createSpy('createPattern'),
            drawImage: jasmine.createSpy('drawImage'),
            save: jasmine.createSpy('save'),
            restore: jasmine.createSpy('restore'),
            scale: jasmine.createSpy('scale'),
            rotate: jasmine.createSpy('rotate'),
            translate: jasmine.createSpy('translate'),
            transform: jasmine.createSpy('transform'),
            setTransform: jasmine.createSpy('setTransform'),
            beginPath: jasmine.createSpy('beginPath'),
            closePath: jasmine.createSpy('closePath'),
            moveTo: jasmine.createSpy('moveTo'),
            lineTo: jasmine.createSpy('lineTo'),
            arc: jasmine.createSpy('arc'),
            fill: jasmine.createSpy('fill'),
            stroke: jasmine.createSpy('stroke'),
            clip: jasmine.createSpy('clip'),
            measureText: jasmine.createSpy('measureText').and.returnValue({ width: 0 }),
            fillText: jasmine.createSpy('fillText')
        };

        const canvasElement = {
            getContext: jasmine.createSpy('getContext').and.returnValue(mockContext),
            toDataURL: jasmine.createSpy('toDataURL').and.returnValue('data:image/png;base64,'),
            width: 400,
            height: 300
        } as unknown as HTMLCanvasElement;

        mockCanvas = new ElementRef(canvasElement);

        TestBed.configureTestingModule({
            providers: [ChartService]
        });

        service = TestBed.inject(ChartService);
    });

    afterEach(() => {
        service.destroyAllCharts();
    });

    describe('Service Creation', () => {
        it('should be created', () => {
            expect(service).toBeTruthy();
        });
    });

    describe('createWeeklyActivityChart', () => {
        it('should create weekly activity chart', () => {
            const data: WeeklyActivity[] = [
                { day: 'Lun', appointments: 5 },
                { day: 'Mar', appointments: 8 },
                { day: 'Mie', appointments: 6 }
            ];

            const chart = service.createWeeklyActivityChart(mockCanvas, data);
            expect(chart).toBeDefined();
        });
    });

    describe('createConsultationStatsChart', () => {
        it('should create consultation stats chart', () => {
            const data: ConsultationStats[] = [
                { type: 'Vacunación', count: 10, color: '#4CAF50' },
                { type: 'Consulta', count: 15, color: '#2196F3' }
            ];

            const chart = service.createConsultationStatsChart(mockCanvas, data);
            expect(chart).toBeDefined();
        });
    });

    describe('createMonthlyTrendChart', () => {
        it('should create monthly trend chart', () => {
            const months = ['Ene', 'Feb', 'Mar'];
            const appointments = [10, 15, 12];

            const chart = service.createMonthlyTrendChart(mockCanvas, months, appointments);
            expect(chart).toBeDefined();
        });

        it('should accept optional revenues', () => {
            const months = ['Ene', 'Feb', 'Mar'];
            const appointments = [10, 15, 12];
            const revenues = [1000, 1500, 1200];

            const chart = service.createMonthlyTrendChart(mockCanvas, months, appointments, revenues);
            expect(chart).toBeDefined();
        });
    });

    describe('createHorizontalBarChart', () => {
        it('should create horizontal bar chart', () => {
            const labels = ['Max', 'Luna', 'Rocky'];
            const data = [5, 8, 3];

            const chart = service.createHorizontalBarChart(mockCanvas, labels, data, 'Top Pets');
            expect(chart).toBeDefined();
        });
    });

    describe('updateChartData', () => {
        it('should update existing chart data', () => {
            const data: WeeklyActivity[] = [
                { day: 'Lun', appointments: 5 }
            ];

            service.createWeeklyActivityChart(mockCanvas, data);

            const newData = {
                labels: ['Mar'],
                datasets: [{ label: 'Citas', data: [10] }]
            };

            expect(() => service.updateChartData('weekly-activity', newData)).not.toThrow();
        });
    });

    describe('destroyChart', () => {
        it('should destroy specific chart', () => {
            const data: WeeklyActivity[] = [
                { day: 'Lun', appointments: 5 }
            ];

            service.createWeeklyActivityChart(mockCanvas, data);
            expect(() => service.destroyChart('weekly-activity')).not.toThrow();
        });

        it('should handle non-existent chart', () => {
            expect(() => service.destroyChart('non-existent')).not.toThrow();
        });
    });

    describe('destroyAllCharts', () => {
        it('should destroy all charts', () => {
            expect(() => service.destroyAllCharts()).not.toThrow();
        });
    });

    describe('exportChartAsImage', () => {
        it('should export chart as image', () => {
            const data: WeeklyActivity[] = [
                { day: 'Lun', appointments: 5 }
            ];

            service.createWeeklyActivityChart(mockCanvas, data);
            expect(() => service.exportChartAsImage('weekly-activity', 'test-chart')).not.toThrow();
        });
    });
});
