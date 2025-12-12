import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { RendererFactory2 } from '@angular/core';
import { ThemeService, ThemePreference, ThemeMode } from './theme.service';

describe('ThemeService', () => {
    let service: ThemeService;
    let mockDocument: any;
    let mockRenderer: any;
    let mockRendererFactory: any;

    beforeEach(() => {
        mockRenderer = {
            addClass: jasmine.createSpy('addClass'),
            removeClass: jasmine.createSpy('removeClass'),
            setAttribute: jasmine.createSpy('setAttribute')
        };

        mockRendererFactory = {
            createRenderer: jasmine.createSpy('createRenderer').and.returnValue(mockRenderer)
        };

        mockDocument = {
            body: {
                classList: new Set()
            },
            documentElement: {}
        };

        TestBed.configureTestingModule({
            providers: [
                ThemeService,
                { provide: RendererFactory2, useValue: mockRendererFactory },
                { provide: DOCUMENT, useValue: mockDocument }
            ]
        });

        service = TestBed.inject(ThemeService);
    });

    describe('Service Creation', () => {
        it('should be created', () => {
            expect(service).toBeTruthy();
        });
    });

    describe('getCurrentPreference', () => {
        it('should return current theme preference', () => {
            const preference = service.getCurrentPreference();
            expect(['light', 'dark', 'system']).toContain(preference);
        });
    });

    describe('getCurrentThemeMode', () => {
        it('should return current theme mode', () => {
            const mode = service.getCurrentThemeMode();
            expect(['light', 'dark']).toContain(mode);
        });
    });

    describe('isDarkMode', () => {
        it('should return boolean', () => {
            const result = service.isDarkMode();
            expect(typeof result).toBe('boolean');
        });
    });

    describe('setPreference', () => {
        it('should set light preference', async () => {
            await service.setPreference('light');
            expect(service.getCurrentPreference()).toBe('light');
        });

        it('should apply theme when setting preference', async () => {
            await service.setPreference('light');
            expect(mockRenderer.addClass).toHaveBeenCalled();
        });
    });

    describe('toggle', () => {
        it('should toggle theme mode', async () => {
            const initialMode = service.getCurrentThemeMode();
            await service.toggle();
            const newMode = service.getCurrentThemeMode();
            expect(newMode).not.toBe(initialMode);
        });
    });

    describe('setLightMode', () => {
        it('should force light mode', async () => {
            await service.setLightMode();
            expect(service.getCurrentThemeMode()).toBe('light');
        });
    });

    describe('Observables', () => {
        it('should emit theme preference changes', (done) => {
            service.themePreference$.subscribe(pref => {
                expect(['light', 'dark', 'system']).toContain(pref);
                done();
            });
        });

        it('should emit theme mode changes', (done) => {
            service.currentThemeMode$.subscribe(mode => {
                expect(['light', 'dark']).toContain(mode);
                done();
            });
        });

        it('should emit isDarkMode changes', (done) => {
            service.isDarkMode$.subscribe(isDark => {
                expect(typeof isDark).toBe('boolean');
                done();
            });
        });
    });

    describe('Theme Application', () => {
        it('should add theme classes to body', async () => {
            await service.setPreference('light');
            expect(mockRenderer.addClass).toHaveBeenCalledWith(
                mockDocument.body,
                jasmine.any(String)
            );
        });

        it('should set data-color-theme attribute', async () => {
            await service.setPreference('light');
            expect(mockRenderer.setAttribute).toHaveBeenCalled();
        });

        it('should add transition class during theme change', async () => {
            await service.setPreference('light');
            expect(mockRenderer.addClass).toHaveBeenCalledWith(
                mockDocument.body,
                'theme-transition'
            );
        });
    });

    describe('cleanup', () => {
        it('should clean up on destroy', () => {
            expect(() => service.ngOnDestroy()).not.toThrow();
        });
    });
});
