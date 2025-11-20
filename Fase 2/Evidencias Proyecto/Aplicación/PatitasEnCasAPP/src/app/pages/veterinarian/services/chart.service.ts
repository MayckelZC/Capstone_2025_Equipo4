import { Injectable, ElementRef } from '@angular/core';
import {
  Chart,
  ChartConfiguration,
  ChartType,
  registerables
} from 'chart.js';
import { ConsultationStats, WeeklyActivity } from '../models/veterinarian.interfaces';

// Registrar componentes de Chart.js
Chart.register(...registerables);

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class ChartService {

  private charts: Map<string, Chart> = new Map();

  constructor() {}

  /**
   * Crear gráfico de barras de actividad semanal
   */
  createWeeklyActivityChart(
    canvas: ElementRef<HTMLCanvasElement>,
    data: WeeklyActivity[]
  ): Chart {
    const chartId = 'weekly-activity';
    
    // Destruir chart anterior si existe
    this.destroyChart(chartId);

    const chartData: ChartData = {
      labels: data.map(d => d.day),
      datasets: [
        {
          label: 'Citas',
          data: data.map(d => d.appointments),
          backgroundColor: '#4CAF50',
          borderColor: '#388E3C',
          borderWidth: 2
        },
        {
          label: 'Emergencias',
          data: data.map(d => d.emergencies),
          backgroundColor: '#F44336',
          borderColor: '#D32F2F',
          borderWidth: 2
        }
      ]
    };

    const config: ChartConfiguration = {
      type: 'bar',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: {
                size: 12,
                family: 'Roboto, sans-serif'
              },
              padding: 15
            }
          },
          title: {
            display: true,
            text: 'Actividad Semanal',
            font: {
              size: 16,
              weight: 'bold'
            },
            padding: 20
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleFont: { size: 14 },
            bodyFont: { size: 12 },
            padding: 12,
            cornerRadius: 8
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              font: { size: 11 }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            ticks: {
              font: { size: 11 }
            },
            grid: {
              display: false
            }
          }
        }
      }
    };

    const chart = new Chart(canvas.nativeElement, config);
    this.charts.set(chartId, chart);
    return chart;
  }

  /**
   * Crear gráfico circular de tipos de consultas
   */
  createConsultationStatsChart(
    canvas: ElementRef<HTMLCanvasElement>,
    data: ConsultationStats[]
  ): Chart {
    const chartId = 'consultation-stats';
    
    // Destruir chart anterior si existe
    this.destroyChart(chartId);

    const chartData: ChartData = {
      labels: data.map(d => d.type),
      datasets: [
        {
          label: 'Consultas',
          data: data.map(d => d.count),
          backgroundColor: data.map(d => d.color),
          borderColor: '#ffffff',
          borderWidth: 2
        }
      ]
    };

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: {
                size: 11,
                family: 'Roboto, sans-serif'
              },
              padding: 12,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          title: {
            display: true,
            text: 'Tipos de Consultas',
            font: {
              size: 16,
              weight: 'bold'
            },
            padding: 20
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleFont: { size: 14 },
            bodyFont: { size: 12 },
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    };

    const chart = new Chart(canvas.nativeElement, config);
    this.charts.set(chartId, chart);
    return chart;
  }

  /**
   * Crear gráfico de líneas de tendencia mensual
   */
  createMonthlyTrendChart(
    canvas: ElementRef<HTMLCanvasElement>,
    months: string[],
    appointments: number[],
    revenues?: number[]
  ): Chart {
    const chartId = 'monthly-trend';
    
    // Destruir chart anterior si existe
    this.destroyChart(chartId);

    const datasets: any[] = [
      {
        label: 'Citas',
        data: appointments,
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
        borderColor: '#4CAF50',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#4CAF50',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      }
    ];

    if (revenues && revenues.length > 0) {
      datasets.push({
        label: 'Ingresos ($)',
        data: revenues,
        backgroundColor: 'rgba(33, 150, 243, 0.2)',
        borderColor: '#2196F3',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#2196F3',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        yAxisID: 'y1'
      });
    }

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: months,
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: { size: 12 },
              padding: 15,
              usePointStyle: true
            }
          },
          title: {
            display: true,
            text: 'Tendencia Mensual',
            font: { size: 16, weight: 'bold' },
            padding: 20
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleFont: { size: 14 },
            bodyFont: { size: 12 },
            padding: 12,
            cornerRadius: 8
          }
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            beginAtZero: true,
            ticks: { font: { size: 11 } },
            grid: { color: 'rgba(0, 0, 0, 0.05)' }
          },
          ...(revenues && revenues.length > 0 ? {
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              beginAtZero: true,
              ticks: {
                font: { size: 11 },
                callback: (value: any) => `$${value}`
              },
              grid: {
                drawOnChartArea: false
              }
            }
          } : {})
        }
      }
    };

    const chart = new Chart(canvas.nativeElement, config);
    this.charts.set(chartId, chart);
    return chart;
  }

  /**
   * Crear gráfico de barras horizontales (top pets/owners)
   */
  createHorizontalBarChart(
    canvas: ElementRef<HTMLCanvasElement>,
    labels: string[],
    data: number[],
    title: string,
    chartId: string = 'horizontal-bar'
  ): Chart {
    // Destruir chart anterior si existe
    this.destroyChart(chartId);

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Visitas',
            data,
            backgroundColor: [
              '#4CAF50',
              '#2196F3',
              '#FF9800',
              '#9C27B0',
              '#F44336'
            ],
            borderColor: '#ffffff',
            borderWidth: 2
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: title,
            font: { size: 16, weight: 'bold' },
            padding: 20
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleFont: { size: 14 },
            bodyFont: { size: 12 },
            padding: 12,
            cornerRadius: 8
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              font: { size: 11 }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          y: {
            ticks: {
              font: { size: 11 }
            },
            grid: {
              display: false
            }
          }
        }
      }
    };

    const chart = new Chart(canvas.nativeElement, config);
    this.charts.set(chartId, chart);
    return chart;
  }

  /**
   * Actualizar datos de un chart existente
   */
  updateChartData(chartId: string, newData: ChartData): void {
    const chart = this.charts.get(chartId);
    if (chart) {
      chart.data.labels = newData.labels;
      chart.data.datasets = newData.datasets as any;
      chart.update();
    }
  }

  /**
   * Destruir un chart específico
   */
  destroyChart(chartId: string): void {
    const chart = this.charts.get(chartId);
    if (chart) {
      chart.destroy();
      this.charts.delete(chartId);
    }
  }

  /**
   * Destruir todos los charts
   */
  destroyAllCharts(): void {
    this.charts.forEach(chart => chart.destroy());
    this.charts.clear();
  }

  /**
   * Exportar chart como imagen
   */
  exportChartAsImage(chartId: string, filename: string = 'chart'): void {
    const chart = this.charts.get(chartId);
    if (chart) {
      const url = chart.toBase64Image();
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = url;
      link.click();
    }
  }
}
