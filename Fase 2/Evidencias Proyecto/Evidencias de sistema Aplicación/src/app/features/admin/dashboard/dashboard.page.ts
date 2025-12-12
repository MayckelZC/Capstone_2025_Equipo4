import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { UserService } from '@features/user/services/user.service';
import { PetsService } from '@features/pets/services/pets.service';
import { AdoptionService } from '@features/adoption/services/adoption.service';
import { ReportService } from '@features/reports/services/report.service';
import { Chart, registerables } from 'chart.js';

// Registrar componentes de Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit, AfterViewInit, OnDestroy {

  // Métricas existentes
  userCount$!: Observable<number>;
  petCount$!: Observable<number>;
  adoptionCount$!: Observable<number>;
  reportCount$!: Observable<number>;
  newUsersThisWeekCount$!: Observable<number>;
  newPetsThisWeekCount$!: Observable<number>;
  newAdoptionsThisWeekCount$!: Observable<number>;
  newReportsThisWeekCount$!: Observable<number>;

  // Actividad reciente
  recentUsers$!: Observable<any[]>;
  recentAdoptions$!: Observable<any[]>;

  // Referencias a los canvas para gráficas
  @ViewChild('userGrowthChart') userGrowthCanvas!: ElementRef;
  @ViewChild('adoptionTrendsChart') adoptionTrendsCanvas!: ElementRef;
  @ViewChild('petsBySpeciesChart') petsBySpeciesCanvas!: ElementRef;
  @ViewChild('reportsByTypeChart') reportsByTypeCanvas!: ElementRef;

  // Gráficas
  userGrowthChart: any;
  adoptionTrendsChart: any;
  petsBySpeciesChart: any;
  reportsByTypeChart: any;

  // Datos de estadísticas
  monthlyStats: any = {
    months: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
    newUsers: [0, 0, 0, 0, 0, 0],
    adoptions: [0, 0, 0, 0, 0, 0]
  };

  private destroy$ = new Subject<void>();
  private chartTimeout: any;

  constructor(
    private userService: UserService,
    private petsService: PetsService,
    private adoptionService: AdoptionService,
    private reportService: ReportService
  ) { }

  ngOnInit() {
    // Cargar métricas básicas
    this.userCount$ = this.userService.getUsers().pipe(map(users => users.length));
    this.petCount$ = this.petsService.getCount();
    this.adoptionCount$ = this.adoptionService.getCount();
    this.reportCount$ = this.reportService.getPendingReportsCount();
    this.newUsersThisWeekCount$ = this.userService.getNewUsersCountThisWeek();
    this.newPetsThisWeekCount$ = this.petsService.getNewPetsCountThisWeek();
    this.newAdoptionsThisWeekCount$ = this.adoptionService.getNewApprovedAdoptionsCountThisWeek();
    this.newReportsThisWeekCount$ = this.reportService.getNewPendingReportsCountThisWeek();

    // Cargar actividad reciente
    this.loadRecentActivity();
  }

  ngAfterViewInit() {
    // Crear gráficas después de que la vista esté lista
    this.chartTimeout = setTimeout(() => {
      this.createCharts();
      this.loadChartData(); // Cargar datos reales después de crear las gráficas vacías/iniciales
    }, 500);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.chartTimeout) {
      clearTimeout(this.chartTimeout);
    }

    // Destruir gráficas para evitar memory leaks
    if (this.userGrowthChart) this.userGrowthChart.destroy();
    if (this.adoptionTrendsChart) this.adoptionTrendsChart.destroy();
    if (this.petsBySpeciesChart) this.petsBySpeciesChart.destroy();
    if (this.reportsByTypeChart) this.reportsByTypeChart.destroy();
  }

  generateMonthLabels() {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const today = new Date();
    const labels = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      labels.push(months[d.getMonth()]);
    }
    this.monthlyStats.months = labels;
  }

  loadChartData() {
    this.generateMonthLabels();

    // 1. User Growth
    this.userService.getUserGrowthByMonth(6)
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.monthlyStats.newUsers = data;
        if (this.userGrowthChart && this.userGrowthChart.canvas) {
          this.userGrowthChart.data.labels = this.monthlyStats.months;
          this.userGrowthChart.data.datasets[0].data = data;
          this.userGrowthChart.update();
        }
      });

    // 2. Adoption Trends
    this.adoptionService.getAdoptionsByMonth(6)
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.monthlyStats.adoptions = data;
        if (this.adoptionTrendsChart && this.adoptionTrendsChart.canvas) {
          this.adoptionTrendsChart.data.labels = this.monthlyStats.months;
          this.adoptionTrendsChart.data.datasets[0].data = data;
          this.adoptionTrendsChart.update();
        }
      });

    // 3. Pets by Species
    this.petsService.getPetsBySpeciesCount()
      .pipe(takeUntil(this.destroy$))
      .subscribe(counts => {
        if (this.petsBySpeciesChart && this.petsBySpeciesChart.canvas) {
          this.petsBySpeciesChart.data.datasets[0].data = [counts.dogs, counts.cats, counts.others];
          this.petsBySpeciesChart.update();
        }
      });

    // 4. Reports by Type
    this.reportService.getReportsByType()
      .pipe(takeUntil(this.destroy$))
      .subscribe(counts => {
        if (this.reportsByTypeChart && this.reportsByTypeChart.canvas) {
          const labels = Object.keys(counts);
          const data = Object.values(counts);

          // Generar colores dinámicos si hay más datos de los esperados
          const backgroundColors = [
            '#F44336', '#FF9800', '#9C27B0', '#607D8B', '#2196F3', '#4CAF50'
          ];

          this.reportsByTypeChart.data.labels = labels;
          this.reportsByTypeChart.data.datasets[0].data = data;
          this.reportsByTypeChart.data.datasets[0].backgroundColor = backgroundColors.slice(0, data.length);
          this.reportsByTypeChart.update();
        }
      });
  }

  loadRecentActivity() {
    // Últimos usuarios registrados
    this.recentUsers$ = this.userService.getUsers().pipe(
      map(users => users
        .sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 5)
      )
    );

    // Últimas adopciones - simplemente retornar un observable vacío por ahora
    // El usuario puede implementar esto más tarde
    this.recentAdoptions$ = new Observable(observer => {
      observer.next([]);
      observer.complete();
    });
  }

  createCharts() {
    this.generateMonthLabels();
    this.createUserGrowthChart();
    this.createAdoptionTrendsChart();
    this.createPetsBySpeciesChart();
    this.createReportsByTypeChart();
  }

  createUserGrowthChart() {
    if (this.userGrowthCanvas) {
      const ctx = this.userGrowthCanvas.nativeElement.getContext('2d');
      this.userGrowthChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: this.monthlyStats.months,
          datasets: [{
            label: 'Usuarios Nuevos',
            data: [0, 0, 0, 0, 0, 0], // Inicialmente ceros
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 5,
            pointHoverRadius: 7
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              },
              ticks: {
                stepSize: 1
              }
            },
            x: {
              grid: {
                display: false
              }
            }
          }
        }
      });
    }
  }

  createAdoptionTrendsChart() {
    if (this.adoptionTrendsCanvas) {
      const ctx = this.adoptionTrendsCanvas.nativeElement.getContext('2d');
      this.adoptionTrendsChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: this.monthlyStats.months,
          datasets: [{
            label: 'Adopciones',
            data: [0, 0, 0, 0, 0, 0], // Inicialmente ceros
            borderColor: '#FF9800',
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 5,
            pointHoverRadius: 7
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              },
              ticks: {
                stepSize: 1
              }
            },
            x: {
              grid: {
                display: false
              }
            }
          }
        }
      });
    }
  }

  createPetsBySpeciesChart() {
    if (this.petsBySpeciesCanvas) {
      const ctx = this.petsBySpeciesCanvas.nativeElement.getContext('2d');
      this.petsBySpeciesChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Perros', 'Gatos', 'Otros'],
          datasets: [{
            data: [0, 0, 0], // Inicialmente ceros
            backgroundColor: [
              '#4CAF50',
              '#FF9800',
              '#2196F3'
            ],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 20,
                font: {
                  size: 12
                }
              }
            }
          }
        }
      });
    }
  }

  createReportsByTypeChart() {
    if (this.reportsByTypeCanvas) {
      const ctx = this.reportsByTypeCanvas.nativeElement.getContext('2d');
      this.reportsByTypeChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: [],
          datasets: [{
            label: 'Reportes',
            data: [],
            backgroundColor: [
              '#F44336',
              '#FF9800',
              '#9C27B0',
              '#607D8B'
            ],
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              },
              ticks: {
                stepSize: 1
              }
            },
            x: {
              grid: {
                display: false
              }
            }
          }
        }
      });
    }
  }
}