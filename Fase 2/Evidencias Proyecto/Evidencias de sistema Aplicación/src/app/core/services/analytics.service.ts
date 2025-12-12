import { Injectable } from '@angular/core';
import { getAnalytics, logEvent, setUserProperties, setUserId } from 'firebase/analytics';
import { FirebaseApp } from '@angular/fire/app';
import { LoggerService } from './logger.service';

/**
 * AnalyticsService
 * 
 * Centraliza todos los eventos de Analytics de Firebase
 * Permite tracking de:
 * - Eventos de usuario (login, signup, logout)
 * - Eventos de adopción (visualización, solicitud, completada)
 * - Eventos de engagement (chat, búsqueda)
 * - Performance (page load, time on page)
 */
@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private analytics = getAnalytics(this.firebaseApp);

  constructor(
    private firebaseApp: FirebaseApp,
    private logger: LoggerService
  ) { }

  /**
   * ===== EVENTOS DE AUTENTICACIÓN =====
   */

  logUserSignup(method: string): void {
    logEvent(this.analytics, 'sign_up', { method });
    this.logger.info('User signed up', {
      feature: 'Analytics',
      action: 'signup',
      metadata: { method }
    });
  }

  logUserLogin(method: string, userId?: string): void {
    logEvent(this.analytics, 'login', { method });
    if (userId) {
      setUserId(this.analytics, userId);
    }
    this.logger.info('User logged in', {
      feature: 'Analytics',
      action: 'login',
      userId,
      metadata: { method }
    });
  }

  logUserLogout(userId?: string): void {
    logEvent(this.analytics, 'logout');
    this.logger.info('User logged out', {
      feature: 'Analytics',
      action: 'logout',
      userId
    });
  }

  /**
   * ===== EVENTOS DE ADOPCIÓN =====
   */

  logAdoptionPetViewed(petId: string, petName: string, petSpecies: string, userId?: string): void {
    logEvent(this.analytics, 'view_item', {
      items: [{
        item_id: petId,
        item_name: petName,
        item_category: petSpecies
      }]
    });
    this.logger.info('Pet viewed', {
      feature: 'Adoption',
      action: 'pet_viewed',
      userId,
      metadata: { petId, petName, petSpecies }
    });
  }

  logAdoptionRequestStarted(petId: string, userId?: string): void {
    logEvent(this.analytics, 'begin_checkout', {
      items: [{ item_id: petId }]
    });
    this.logger.info('Adoption request started', {
      feature: 'Adoption',
      action: 'request_started',
      userId,
      metadata: { petId }
    });
  }

  logAdoptionRequestSubmitted(petId: string, adoptionTime: number, userId?: string): void {
    logEvent(this.analytics, 'purchase', {
      items: [{ item_id: petId }],
      value: adoptionTime,
      currency: 'minutes'
    });
    this.logger.info('Adoption request submitted', {
      feature: 'Adoption',
      action: 'request_submitted',
      userId,
      metadata: { petId, adoptionTime }
    });
  }

  logAdoptionCompleted(petId: string, adoptionDurationMinutes: number, userId?: string): void {
    logEvent(this.analytics, 'purchase', {
      items: [{ item_id: petId }],
      value: 1,
      currency: 'adoption'
    });
    this.logger.info('Adoption completed', {
      feature: 'Adoption',
      action: 'completed',
      userId,
      metadata: { petId, adoptionDurationMinutes }
    });
  }

  logAdoptionCancelled(petId: string, userId?: string): void {
    logEvent(this.analytics, 'view_cart', {
      items: [{ item_id: petId }],
      value: 0
    });
    this.logger.info('Adoption cancelled', {
      feature: 'Adoption',
      action: 'cancelled',
      userId,
      metadata: { petId }
    });
  }

  /**
   * ===== EVENTOS DE BÚSQUEDA Y FILTRADO =====
   */

  logSearch(query: string, category?: string, userId?: string): void {
    logEvent(this.analytics, 'search', {
      search_term: query,
      category: category || 'all'
    });
    this.logger.info('Search performed', {
      feature: 'Search',
      action: 'search',
      userId,
      metadata: { query, category }
    });
  }

  logFilterApplied(filterType: string, filterValue: string, userId?: string): void {
    logEvent(this.analytics, 'view_item_list', {
      items: [{ item_id: filterType, item_name: filterValue }]
    });
    this.logger.info('Filter applied', {
      feature: 'Search',
      action: 'filter_applied',
      userId,
      metadata: { filterType, filterValue }
    });
  }

  /**
   * ===== EVENTOS DE CHAT Y MENSAJERÍA =====
   */

  logChatStarted(conversationId: string, participantId: string, userId?: string): void {
    logEvent(this.analytics, 'user_engagement', {
      engagement_type: 'chat_started',
      value: 1
    });
    this.logger.info('Chat conversation started', {
      feature: 'Chat',
      action: 'chat_started',
      userId,
      metadata: { conversationId, participantId }
    });
  }

  logMessageSent(conversationId: string, messageLength: number, userId?: string): void {
    logEvent(this.analytics, 'user_engagement', {
      engagement_type: 'message_sent',
      value: messageLength
    });
    this.logger.debug('Message sent', {
      feature: 'Chat',
      action: 'message_sent',
      userId,
      metadata: { conversationId, messageLength }
    });
  }

  /**
   * ===== EVENTOS DE CITAS VETERINARIAS =====
   */

  logVeterinaryAppointmentCreated(appointmentId: string, vetId: string, userId?: string): void {
    logEvent(this.analytics, 'schedule', {
      items: [{ item_id: appointmentId }]
    });
    this.logger.info('Veterinary appointment created', {
      feature: 'Veterinary',
      action: 'appointment_created',
      userId,
      metadata: { appointmentId, vetId }
    });
  }

  logVeterinaryAppointmentCancelled(appointmentId: string, userId?: string): void {
    logEvent(this.analytics, 'view_cart', {
      items: [{ item_id: appointmentId }],
      value: 0
    });
    this.logger.info('Veterinary appointment cancelled', {
      feature: 'Veterinary',
      action: 'appointment_cancelled',
      userId,
      metadata: { appointmentId }
    });
  }

  /**
   * ===== EVENTOS DE ENGAGEMENT =====
   */

  logPageView(pageName: string, pageClass?: string, userId?: string): void {
    logEvent(this.analytics, 'page_view', {
      page_title: pageName,
      page_location: window.location.href
    });
    this.logger.debug('Page viewed', {
      feature: 'Navigation',
      action: 'page_view',
      userId,
      metadata: { pageName, pageClass }
    });
  }

  logScreenView(screenName: string, userId?: string): void {
    logEvent(this.analytics, 'screen_view', {
      screen_name: screenName
    });
    this.logger.debug('Screen viewed', {
      feature: 'Navigation',
      action: 'screen_view',
      userId,
      metadata: { screenName }
    });
  }

  logButtonClick(buttonName: string, location?: string, userId?: string): void {
    logEvent(this.analytics, 'user_engagement', {
      engagement_type: 'button_click',
      engagement_value: buttonName
    });
    this.logger.debug('Button clicked', {
      feature: 'Engagement',
      action: 'button_click',
      userId,
      metadata: { buttonName, location }
    });
  }

  logFeatureUsed(featureName: string, featureValue?: any, userId?: string): void {
    logEvent(this.analytics, 'user_engagement', {
      engagement_type: 'feature_used',
      engagement_value: featureName
    });
    this.logger.info('Feature used', {
      feature: 'Engagement',
      action: 'feature_used',
      userId,
      metadata: { featureName, featureValue }
    });
  }

  /**
   * ===== EVENTOS DE ERRORES Y PERFORMANCE =====
   */

  logError(errorMessage: string, errorContext: string, userId?: string): void {
    logEvent(this.analytics, 'exception', {
      description: `${errorContext}: ${errorMessage}`,
      fatal: false
    });
    this.logger.error('Error tracked in analytics', undefined, {
      feature: 'Analytics',
      action: 'error_logged',
      userId,
      metadata: { errorMessage, errorContext }
    });
  }

  logCriticalError(errorMessage: string, errorContext: string, userId?: string): void {
    logEvent(this.analytics, 'exception', {
      description: `CRITICAL - ${errorContext}: ${errorMessage}`,
      fatal: true
    });
    this.logger.critical('Critical error tracked in analytics', undefined, {
      feature: 'Analytics',
      action: 'critical_error_logged',
      userId,
      metadata: { errorMessage, errorContext }
    });
  }

  logPerformanceMetric(metricName: string, value: number, unit: string, userId?: string): void {
    logEvent(this.analytics, 'timing_complete', {
      name: metricName,
      value: value,
      unit: unit
    });
    this.logger.debug('Performance metric recorded', {
      feature: 'Performance',
      action: 'metric_recorded',
      userId,
      metadata: { metricName, value, unit }
    });
  }

  /**
   * ===== PROPIEDADES DE USUARIO =====
   */

  setUserProperties(properties: { [key: string]: string }): void {
    setUserProperties(this.analytics, properties);
    this.logger.info('User properties set', {
      feature: 'Analytics',
      action: 'user_properties_set',
      metadata: properties
    });
  }

  setUserRole(role: 'adopter' | 'shelter' | 'veterinarian' | 'admin'): void {
    setUserProperties(this.analytics, { user_role: role });
  }

  setUserCity(city: string): void {
    setUserProperties(this.analytics, { user_city: city });
  }

  setUserCountry(country: string): void {
    setUserProperties(this.analytics, { user_country: country });
  }
}
