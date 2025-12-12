import { TestBed } from '@angular/core/testing';
import { LoggerService, LogLevel } from './logger.service';
import { Injector } from '@angular/core';

describe('LoggerService', () => {
    let service: LoggerService;
    let consoleSpy: any;

    beforeEach(() => {
        consoleSpy = {
            debug: spyOn(console, 'debug'),
            info: spyOn(console, 'info'),
            warn: spyOn(console, 'warn'),
            error: spyOn(console, 'error'),
            log: spyOn(console, 'log'),
            groupCollapsed: spyOn(console, 'groupCollapsed'),
            groupEnd: spyOn(console, 'groupEnd'),
            table: spyOn(console, 'table')
        };

        const mockInjector = {
            get: jasmine.createSpy('get').and.throwError('Firebase not available')
        };

        TestBed.configureTestingModule({
            providers: [
                LoggerService,
                { provide: Injector, useValue: mockInjector }
            ]
        });

        service = TestBed.inject(LoggerService);
    });

    describe('Service Creation', () => {
        it('should be created', () => {
            expect(service).toBeTruthy();
        });
    });

    describe('Log Levels', () => {
        beforeEach(() => {
            service.setMinLevel(LogLevel.DEBUG);
        });

        it('should log debug messages', () => {
            service.debug('Debug message');
            expect(consoleSpy.debug).toHaveBeenCalled();
        });

        it('should log info messages', () => {
            service.info('Info message');
            expect(consoleSpy.info).toHaveBeenCalled();
        });

        it('should log warning messages', () => {
            service.warn('Warning message');
            expect(consoleSpy.warn).toHaveBeenCalled();
        });

        it('should log error messages', () => {
            service.error('Error message');
            expect(consoleSpy.error).toHaveBeenCalled();
        });

        it('should log critical messages', () => {
            service.critical('Critical message');
            expect(consoleSpy.error).toHaveBeenCalled();
        });
    });

    describe('Log Level Filtering', () => {
        it('should not log debug when min level is INFO', () => {
            service.setMinLevel(LogLevel.INFO);
            service.debug('Debug message');
            expect(consoleSpy.debug).not.toHaveBeenCalled();
        });

        it('should not log info when min level is WARN', () => {
            service.setMinLevel(LogLevel.WARN);
            service.info('Info message');
            expect(consoleSpy.info).not.toHaveBeenCalled();
        });

        it('should not log warn when min level is ERROR', () => {
            service.setMinLevel(LogLevel.ERROR);
            service.warn('Warning message');
            expect(consoleSpy.warn).not.toHaveBeenCalled();
        });

        it('should log error when min level is ERROR', () => {
            service.setMinLevel(LogLevel.ERROR);
            service.error('Error message');
            expect(consoleSpy.error).toHaveBeenCalled();
        });

        it('should not log anything when level is OFF', () => {
            service.setMinLevel(LogLevel.OFF);
            service.debug('Debug');
            service.info('Info');
            service.warn('Warn');
            expect(consoleSpy.debug).not.toHaveBeenCalled();
            expect(consoleSpy.info).not.toHaveBeenCalled();
            expect(consoleSpy.warn).not.toHaveBeenCalled();
        });
    });

    describe('Log with Data', () => {
        beforeEach(() => {
            service.setMinLevel(LogLevel.DEBUG);
        });

        it('should log with additional data', () => {
            const testData = { key: 'value' };
            service.info('Message with data', testData);
            expect(consoleSpy.info).toHaveBeenCalled();
        });

        it('should log with multiple data arguments', () => {
            service.debug('Message', 'arg1', 'arg2', { obj: true });
            expect(consoleSpy.debug).toHaveBeenCalled();
        });

        it('should log with error object', () => {
            const error = new Error('Test error');
            service.error('Error occurred', error);
            expect(consoleSpy.error).toHaveBeenCalled();
        });
    });

    describe('Group Logging', () => {
        beforeEach(() => {
            service.setMinLevel(LogLevel.DEBUG);
        });

        it('should create grouped logs', () => {
            service.group('Test Group', () => {
                console.log('Inside group');
            });
            expect(consoleSpy.groupCollapsed).toHaveBeenCalled();
            expect(consoleSpy.groupEnd).toHaveBeenCalled();
        });

        it('should not create group when level is above DEBUG', () => {
            service.setMinLevel(LogLevel.INFO);
            service.group('Test Group', () => { });
            expect(consoleSpy.groupCollapsed).not.toHaveBeenCalled();
        });
    });

    describe('Table Logging', () => {
        beforeEach(() => {
            service.setMinLevel(LogLevel.DEBUG);
        });

        it('should log table data', () => {
            const tableData = [{ id: 1, name: 'Test' }];
            service.table(tableData);
            expect(consoleSpy.table).toHaveBeenCalledWith(tableData, undefined);
        });

        it('should log table with specific columns', () => {
            const tableData = [{ id: 1, name: 'Test', extra: 'data' }];
            service.table(tableData, ['id', 'name']);
            expect(consoleSpy.table).toHaveBeenCalledWith(tableData, ['id', 'name']);
        });

        it('should not log table when level is above DEBUG', () => {
            service.setMinLevel(LogLevel.INFO);
            service.table([{ test: true }]);
            expect(consoleSpy.table).not.toHaveBeenCalled();
        });
    });

    describe('setMinLevel', () => {
        it('should change minimum log level', () => {
            service.setMinLevel(LogLevel.WARN);
            service.info('This should not appear');
            expect(consoleSpy.info).not.toHaveBeenCalled();

            service.warn('This should appear');
            expect(consoleSpy.warn).toHaveBeenCalled();
        });

        it('should accept all valid log levels', () => {
            expect(() => service.setMinLevel(LogLevel.DEBUG)).not.toThrow();
            expect(() => service.setMinLevel(LogLevel.INFO)).not.toThrow();
            expect(() => service.setMinLevel(LogLevel.WARN)).not.toThrow();
            expect(() => service.setMinLevel(LogLevel.ERROR)).not.toThrow();
            expect(() => service.setMinLevel(LogLevel.CRITICAL)).not.toThrow();
            expect(() => service.setMinLevel(LogLevel.OFF)).not.toThrow();
        });
    });

    describe('Context Logging', () => {
        beforeEach(() => {
            service.setMinLevel(LogLevel.DEBUG);
        });

        it('should log with feature context', () => {
            const context = { feature: 'TestFeature' };
            service.info('Message with context', context);
            expect(consoleSpy.info).toHaveBeenCalled();
        });

        it('should log with full context', () => {
            const context = {
                feature: 'Auth',
                action: 'login',
                userId: 'user-123',
                metadata: { attempt: 1 }
            };
            service.info('Login attempt', context);
            expect(consoleSpy.info).toHaveBeenCalled();
        });
    });
});
