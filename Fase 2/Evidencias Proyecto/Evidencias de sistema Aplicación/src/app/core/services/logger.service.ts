import { Injectable, Injector } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

/**
 * LogLevel - Niveles de log soportados
 */
export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    CRITICAL = 4,
    OFF = 5
}

/**
 * Contexto adicional para logs
 */
export interface LogContext {
    userId?: string;
    feature?: string;
    action?: string;
    metadata?: Record<string, any>;
    tags?: Record<string, string>;
}

/**
 * LoggerService - Servicio centralizado de logging
 * 
 * Unifica logging local (consola) y remoto (Firestore).
 * Reemplaza al antiguo LoggingService.
 */
@Injectable({
    providedIn: 'root'
})
export class LoggerService {
    private minLevel: LogLevel;
    private firestore: Firestore | null = null;
    private auth: Auth | null = null;
    private currentUserId: string | null = null;

    constructor(private injector: Injector) {
        // En producción solo errores, en desarrollo todo
        this.minLevel = environment.production ? LogLevel.ERROR : LogLevel.DEBUG;

        // Inicialización perezosa de Firebase para evitar dependencias circulares
        setTimeout(() => this.initializeFirebase(), 0);
    }

    private initializeFirebase() {
        try {
            this.firestore = this.injector.get(Firestore);
            this.auth = this.injector.get(Auth);
            this.auth.onAuthStateChanged(user => {
                this.currentUserId = user?.uid || null;
            });
        } catch (e) {
            console.warn('LoggerService: Firebase not available, logging to console only');
        }
    }

    /**
     * Log de debug - Solo visible en desarrollo
     */
    debug(message: string, ...data: any[]): void {
        this.log(LogLevel.DEBUG, '🔍', message, 'color: #9E9E9E', data);
    }

    /**
     * Log de información
     */
    info(message: string, ...data: any[]): void {
        this.log(LogLevel.INFO, 'ℹ️', message, 'color: #2196F3', data);
    }

    /**
     * Log de advertencia
     */
    warn(message: string, ...data: any[]): void {
        this.log(LogLevel.WARN, '⚠️', message, 'color: #FF9800', data);
    }

    /**
     * Log de error
     */
    error(message: string, ...data: any[]): void {
        this.log(LogLevel.ERROR, '❌', message, 'color: #F44336', data);
        this.saveToFirestore(LogLevel.ERROR, message, data);
    }

    /**
     * Log crítico - Siempre se guarda y destaca
     */
    critical(message: string, ...data: any[]): void {
        this.log(LogLevel.CRITICAL, '🚨', message, 'color: #FFFFFF; background-color: #D32F2F; font-weight: bold', data);
        this.saveToFirestore(LogLevel.CRITICAL, message, data);
    }

    /**
     * Log con grupo colapsable (para datos complejos)
     */
    group(title: string, fn: () => void): void {
        if (this.minLevel > LogLevel.DEBUG) return;

        console.groupCollapsed(`%c${title}`, 'color: #4CAF50; font-weight: bold;');
        fn();
        console.groupEnd();
    }

    /**
     * Log de tabla (para arrays/objetos)
     */
    table(data: any, columns?: string[]): void {
        if (this.minLevel > LogLevel.DEBUG) return;
        console.table(data, columns);
    }

    /**
     * Método interno de logging
     */
    private log(level: LogLevel, emoji: string, message: string, style: string, data: any[]): void {
        if (level < this.minLevel) return;

        const timestamp = new Date().toLocaleTimeString('es-CL', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        const logMethod = this.getLogMethod(level);

        // Extraer contexto si es el último argumento
        const lastArg = data.length > 0 ? data[data.length - 1] : null;
        const context = (lastArg && typeof lastArg === 'object' && 'feature' in lastArg) ? lastArg as LogContext : undefined;
        const contextStr = context?.feature ? ` [${context.feature}]` : '';

        if (data.length > 0) {
            logMethod(`%c[${timestamp}]${contextStr} ${emoji} ${message}`, style, ...data);
        } else {
            logMethod(`%c[${timestamp}]${contextStr} ${emoji} ${message}`, style);
        }
    }

    /**
     * Guardar en Firestore (colección: app-logs)
     */
    private async saveToFirestore(level: LogLevel, message: string, data: any[]): Promise<void> {
        // Solo guardar en producción o si es crítico
        if (!environment.production && level !== LogLevel.CRITICAL) {
            return;
        }

        if (!this.firestore) return;

        try {
            // Intentar extraer error y contexto de los datos
            let errorObj = null;
            let context: LogContext | undefined;

            for (const item of data) {
                if (item instanceof Error) {
                    errorObj = item;
                } else if (item && typeof item === 'object' && 'feature' in item) {
                    context = item as LogContext;
                }
            }

            const logsRef = collection(this.firestore, 'app-logs');
            await addDoc(logsRef, {
                timestamp: new Date(),
                level: LogLevel[level], // Guardar nombre del enum
                message,
                userId: this.currentUserId || context?.userId || 'anonymous',
                feature: context?.feature || 'Unknown',
                metadata: context?.metadata || {},
                errorStack: errorObj?.stack || null,
                errorMessage: errorObj?.message || null,
                userAgent: navigator.userAgent,
                url: window.location.href
            });
        } catch (e) {
            console.warn('LoggerService: Error guardando log en Firestore (posible problema de permisos o red):', e);
        }
    }

    /**
     * Obtener método de console según nivel
     */
    private getLogMethod(level: LogLevel): (...args: any[]) => void {
        switch (level) {
            case LogLevel.DEBUG:
                return console.debug.bind(console);
            case LogLevel.INFO:
                return console.info.bind(console);
            case LogLevel.WARN:
                return console.warn.bind(console);
            case LogLevel.ERROR:
            case LogLevel.CRITICAL:
                return console.error.bind(console);
            default:
                return console.log.bind(console);
        }
    }

    /**
     * Configurar nivel mínimo de logging
     */
    setMinLevel(level: LogLevel): void {
        this.minLevel = level;
    }
}
