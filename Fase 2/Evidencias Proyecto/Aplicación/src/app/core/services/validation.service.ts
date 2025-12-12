/**
 * Validation Service
 * 
 * Servicio centralizado para validar datos
 * - Valida en cliente (Reactive Forms)
 * - Prepara datos para validación en Firestore Rules
 * - Mantiene sincronía entre cliente y BD
 */

import { Injectable } from '@angular/core';
import { AbstractControl, FormGroup, ValidatorFn, Validators as AngularValidators } from '@angular/forms';
import { 
  ValidationSchema, 
  ValidationResult, 
  getValidationSchema,
  getFieldRules,
  ValidationRule
} from '../validators/validation-schema';

@Injectable({
  providedIn: 'root'
})
export class ValidationService {

  /**
   * Crear validadores Angular para un campo
   * Se usan en FormBuilder/Reactive Forms
   */
  createFieldValidators(entityType: string, fieldName: string): ValidatorFn[] {
    const rules = getFieldRules(entityType, fieldName);
    const validators: ValidatorFn[] = [];

    rules.forEach((rule: ValidationRule) => {
      switch (rule.type) {
        case 'required':
          validators.push(AngularValidators.required);
          break;

        case 'minLength':
          validators.push(AngularValidators.minLength(rule.value));
          break;

        case 'maxLength':
          validators.push(AngularValidators.maxLength(rule.value));
          break;

        case 'email':
          validators.push(AngularValidators.email);
          break;

        case 'pattern':
          validators.push(AngularValidators.pattern(rule.value));
          break;

        case 'min':
          validators.push(AngularValidators.min(rule.value));
          break;

        case 'max':
          validators.push(AngularValidators.max(rule.value));
          break;

        case 'custom':
          // Los validadores custom se pueden pasar aquí
          break;
      }
    });

    return validators;
  }

  /**
   * Obtener mensaje de error para un campo
   */
  getErrorMessage(entityType: string, fieldName: string, control: AbstractControl | null): string {
    if (!control || !control.errors) {
      return '';
    }

    const rules = getFieldRules(entityType, fieldName);

    // Buscar qué error tiene el control
    for (const errorKey in control.errors) {
      const rule = rules.find((r: ValidationRule) => {
        if (errorKey === 'required' && r.type === 'required') return true;
        if (errorKey === 'minlength' && r.type === 'minLength') return true;
        if (errorKey === 'maxlength' && r.type === 'maxLength') return true;
        if (errorKey === 'email' && r.type === 'email') return true;
        if (errorKey === 'pattern' && r.type === 'pattern') return true;
        if (errorKey === 'min' && r.type === 'min') return true;
        if (errorKey === 'max' && r.type === 'max') return true;
        return false;
      });

      if (rule) {
        return rule.message;
      }
    }

    return `${fieldName} es inválido`;
  }

  /**
   * Validar un objeto completo
   * Retorna resultado detallado con errores y warnings
   */
  validateObject(entityType: string, data: Record<string, any>): ValidationResult {
    const schema = getValidationSchema(entityType);
    const errors: Record<string, string[]> = {};
    const warnings: Record<string, string[]> = {};

    for (const fieldName in schema) {
      const rules = schema[fieldName];
      const value = data[fieldName];

      for (const rule of rules) {
        const error = this.validateField(value, rule);

        if (error) {
          if (rule.severity === 'warning') {
            if (!warnings[fieldName]) warnings[fieldName] = [];
            warnings[fieldName].push(error);
          } else {
            if (!errors[fieldName]) errors[fieldName] = [];
            errors[fieldName].push(error);
          }
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validar un campo individual
   */
  validateField(value: any, rule: ValidationRule): string | null {
    switch (rule.type) {
      case 'required':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          return rule.message;
        }
        break;

      case 'minLength':
        if (value && value.length < rule.value) {
          return rule.message;
        }
        break;

      case 'maxLength':
        if (value && value.length > rule.value) {
          return rule.message;
        }
        break;

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
          return rule.message;
        }
        break;

      case 'pattern':
        if (value && !rule.value.test(value)) {
          return rule.message;
        }
        break;

      case 'min':
        if (value != null && Number(value) < rule.value) {
          return rule.message;
        }
        break;

      case 'max':
        if (value != null && Number(value) > rule.value) {
          return rule.message;
        }
        break;

      case 'custom':
        // Los validadores custom se implementan en componentes
        break;
    }

    return null;
  }

  /**
   * Preparar datos para enviar a Firestore
   * Sanitiza y valida antes de enviar
   */
  prepareSafeData(entityType: string, data: Record<string, any>): Record<string, any> {
    const schema = getValidationSchema(entityType);
    const safeData: Record<string, any> = {};

    for (const fieldName in schema) {
      if (fieldName in data) {
        let value = data[fieldName];

        // Sanitizar según tipo
        if (typeof value === 'string') {
          value = value.trim(); // Remover espacios
          value = this.sanitizeString(value);
        }

        safeData[fieldName] = value;
      }
    }

    return safeData;
  }

  /**
   * Sanitizar strings para prevenir XSS
   */
  private sanitizeString(str: string): string {
    // Remover caracteres peligrosos
    return str
      .replace(/[<>\"']/g, '') // Remover HTML tags
      .replace(/javascript:/gi, '') // Remover javascript:
      .replace(/on\w+\s*=/gi, ''); // Remover event handlers
  }

  /**
   * Validar email específicamente
   */
  isValidEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Validar URL
   */
  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validar fecha (formato YYYY-MM-DD)
   */
  isValidDate(dateStr: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;

    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Obtener todas las reglas de un tipo de entidad
   */
  getAllRules(entityType: string): ValidationSchema {
    return getValidationSchema(entityType);
  }

  /**
   * Contar errores en un formulario
   */
  countFormErrors(form: FormGroup): number {
    let count = 0;
    for (const control of Object.values(form.controls)) {
      if (control.errors) {
        count += Object.keys(control.errors).length;
      }
    }
    return count;
  }

  /**
   * Marcar todos los campos como touched (para mostrar errores)
   */
  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Crear error summary para mostrar al usuario
   */
  getErrorSummary(validationResult: ValidationResult): string[] {
    const summary: string[] = [];

    for (const field in validationResult.errors) {
      for (const error of validationResult.errors[field]) {
        summary.push(`${field}: ${error}`);
      }
    }

    return summary;
  }
}
