import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormControl } from '@angular/forms';

@Component({
  selector: 'app-custom-input',
  template: `
    <ion-item 
      [class]="getItemClass()"
      lines="none">
      
      <ion-icon 
        *ngIf="startIcon" 
        [name]="startIcon" 
        slot="start"
        [class]="getIconClass()">
      </ion-icon>
      
      <ion-label 
        *ngIf="label && labelPosition !== 'floating'"
        [position]="labelPosition">
        {{ label }}
        <span *ngIf="required" class="required-asterisk">*</span>
      </ion-label>
      
      <ion-input
        *ngIf="type !== 'textarea' && type !== 'select'"
        [type]="type"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [readonly]="readonly"
        [clearInput]="clearInput"
        [value]="value"
        [maxlength]="maxLength"
        [min]="min"
        [max]="max"
        [step]="step"
        (ionInput)="onInput($event)"
        (ionFocus)="onFocus($event)"
        (ionBlur)="onBlur($event)"
        class="custom-input">
        
        <div slot="label" *ngIf="label && labelPosition === 'floating'">
          {{ label }}
          <span *ngIf="required" class="required-asterisk">*</span>
        </div>
      </ion-input>
      
      <ion-textarea
        *ngIf="type === 'textarea'"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [readonly]="readonly"
        [value]="value"
        [maxlength]="maxLength"
        [rows]="rows"
        [autoGrow]="autoGrow"
        (ionInput)="onInput($event)"
        (ionFocus)="onFocus($event)"
        (ionBlur)="onBlur($event)"
        class="custom-textarea">
        
        <div slot="label" *ngIf="label && labelPosition === 'floating'">
          {{ label }}
          <span *ngIf="required" class="required-asterisk">*</span>
        </div>
      </ion-textarea>
      
      <ion-select
        *ngIf="type === 'select'"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [multiple]="multiple"
        [value]="value"
        (ionChange)="onInput($event)"
        (ionFocus)="onFocus($event)"
        (ionBlur)="onBlur($event)"
        class="custom-select">
        
        <div slot="label" *ngIf="label && labelPosition === 'floating'">
          {{ label }}
          <span *ngIf="required" class="required-asterisk">*</span>
        </div>
        
        <ion-select-option 
          *ngFor="let option of options" 
          [value]="option.value">
          {{ option.label }}
        </ion-select-option>
      </ion-select>
      
      <ion-icon 
        *ngIf="endIcon" 
        [name]="endIcon" 
        slot="end"
        [class]="getIconClass()"
        (click)="onEndIconClick()">
      </ion-icon>
      
      <ion-button
        *ngIf="type === 'password' && showPasswordToggle"
        fill="clear"
        slot="end"
        (click)="togglePasswordVisibility()">
        <ion-icon 
          [name]="showPassword ? 'eye-off-outline' : 'eye-outline'"
          slot="icon-only">
        </ion-icon>
      </ion-button>
      
      <!-- Indicador de validación -->
      <div *ngIf="showValidationIcon" slot="end" class="validation-indicator">
        <ion-icon 
          [name]="isValid ? 'checkmark-circle' : 'close-circle'"
          [color]="isValid ? 'success' : 'danger'">
        </ion-icon>
      </div>
    </ion-item>
    
    <!-- Mensajes de ayuda y error -->
    <div class="input-messages" *ngIf="helpText || hasErrors">
      <div *ngIf="helpText && !hasErrors" class="help-text">
        <ion-icon name="information-circle-outline"></ion-icon>
        {{ helpText }}
      </div>
      
      <div *ngIf="hasErrors" class="error-messages">
        <div *ngFor="let error of errorMessages" class="error-message animate-slide-down">
          <ion-icon name="warning-outline"></ion-icon>
          {{ error }}
        </div>
      </div>
    </div>
    
    <!-- Contador de caracteres -->
    <div *ngIf="maxLength && showCounter" class="character-counter">
      {{ (value?.length || 0) }} / {{ maxLength }}
    </div>
  `,
  styles: [`
    ion-item {
      --background: var(--ion-color-surface);
      --border-radius: var(--border-radius-lg);
      --padding-start: var(--spacing-lg);
      --padding-end: var(--spacing-lg);
      --padding-top: var(--spacing-md);
      --padding-bottom: var(--spacing-md);
      --border-color: var(--ion-color-medium-tint);
      --border-width: 2px;
      --border-style: solid;
      margin-bottom: var(--spacing-md);
      transition: all 0.3s ease;
    }
    
    .input-enhanced {
      --border-color: var(--ion-color-medium-tint);
    }
    
    .input-focused {
      --border-color: var(--ion-color-primary);
      --box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.15);
      transform: translateY(-2px);
    }
    
    .input-valid {
      --border-color: var(--ion-color-success);
    }
    
    .input-invalid {
      --border-color: var(--ion-color-danger);
      --box-shadow: 0 0 0 3px rgba(239, 83, 80, 0.15);
    }
    
    .input-disabled {
      --border-color: var(--ion-color-light-shade);
      --background: var(--ion-color-light-tint);
      opacity: 0.6;
    }
    
    .required-asterisk {
      color: var(--ion-color-danger);
      margin-left: 2px;
    }
    
    .icon-primary {
      color: var(--ion-color-primary);
      transition: color 0.3s ease;
    }
    
    .icon-success {
      color: var(--ion-color-success);
    }
    
    .icon-danger {
      color: var(--ion-color-danger);
    }
    
    .validation-indicator {
      display: flex;
      align-items: center;
      margin-left: var(--spacing-sm);
    }
    
    .input-messages {
      margin-top: calc(-1 * var(--spacing-md));
      margin-bottom: var(--spacing-md);
      padding: 0 var(--spacing-lg);
    }
    
    .help-text {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      font-size: var(--font-size-sm);
      color: var(--ion-text-color-secondary);
      
      ion-icon {
        font-size: 14px;
        color: var(--ion-color-medium);
      }
    }
    
    .error-messages {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }
    
    .error-message {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      font-size: var(--font-size-sm);
      color: var(--ion-color-danger);
      
      ion-icon {
        font-size: 14px;
        color: var(--ion-color-danger);
      }
    }
    
    .character-counter {
      text-align: right;
      font-size: var(--font-size-xs);
      color: var(--ion-text-color-secondary);
      margin-top: calc(-1 * var(--spacing-sm));
      margin-bottom: var(--spacing-md);
      padding-right: var(--spacing-lg);
    }
    
    /* Estilos para grupos de formularios */
    .form-group {
      margin-bottom: var(--spacing-xl);
    }
    
    .form-group-title {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--ion-text-color);
      margin-bottom: var(--spacing-lg);
      padding: 0 var(--spacing-lg);
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      
      &::after {
        content: '';
        flex: 1;
        height: 1px;
        background: var(--ion-color-light-shade);
      }
    }
    
    /* Animaciones */
    @keyframes inputFocus {
      from {
        transform: scale(1);
      }
      to {
        transform: scale(1.02);
      }
    }
    
    .input-focused {
      animation: inputFocus 0.2s ease-out;
    }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomInputComponent),
      multi: true
    }
  ]
})
export class CustomInputComponent implements ControlValueAccessor {
  @Input() type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' | 'select' = 'text';
  @Input() label?: string;
  @Input() labelPosition: 'fixed' | 'stacked' | 'floating' = 'floating';
  @Input() placeholder?: string;
  @Input() helpText?: string;
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() readonly: boolean = false;
  @Input() clearInput: boolean = true;
  @Input() maxLength?: number;
  @Input() min?: number;
  @Input() max?: number;
  @Input() step?: number;
  @Input() rows?: number;
  @Input() autoGrow: boolean = true;
  @Input() multiple: boolean = false;
  @Input() showCounter: boolean = false;
  @Input() showPasswordToggle: boolean = true;
  @Input() showValidationIcon: boolean = true;
  @Input() startIcon?: string;
  @Input() endIcon?: string;
  @Input() formControl?: FormControl;
  @Input() options: SelectOption[] = [];
  
  @Output() inputChange = new EventEmitter<any>();
  @Output() inputFocus = new EventEmitter<any>();
  @Output() inputBlur = new EventEmitter<any>();
  @Output() endIconClick = new EventEmitter<void>();

  value: any = '';
  showPassword: boolean = false;
  focused: boolean = false;
  touched: boolean = false;

  private onChange = (value: any) => {};
  private onTouched = () => {};

  get hasErrors(): boolean {
    return this.formControl ? this.formControl.invalid && this.formControl.touched : false;
  }

  get isValid(): boolean {
    return this.formControl ? this.formControl.valid && this.formControl.touched : false;
  }

  get errorMessages(): string[] {
    if (!this.formControl || !this.formControl.errors) return [];
    
    const errors = this.formControl.errors;
    const messages: string[] = [];
    
    if (errors['required']) {
      messages.push('Este campo es obligatorio');
    }
    if (errors['email']) {
      messages.push('Ingrese un email válido');
    }
    if (errors['minlength']) {
      messages.push(`Mínimo ${errors['minlength'].requiredLength} caracteres`);
    }
    if (errors['maxlength']) {
      messages.push(`Máximo ${errors['maxlength'].requiredLength} caracteres`);
    }
    if (errors['min']) {
      messages.push(`El valor mínimo es ${errors['min'].min}`);
    }
    if (errors['max']) {
      messages.push(`El valor máximo es ${errors['max'].max}`);
    }
    if (errors['pattern']) {
      messages.push('El formato no es válido');
    }
    
    return messages;
  }

  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: any) {
    this.value = event.detail.value;
    this.onChange(this.value);
    this.inputChange.emit(this.value);
  }

  onFocus(event: any) {
    this.focused = true;
    this.inputFocus.emit(event);
  }

  onBlur(event: any) {
    this.focused = false;
    this.touched = true;
    this.onTouched();
    this.inputBlur.emit(event);
  }

  onEndIconClick() {
    this.endIconClick.emit();
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
    // Cambiar el tipo de input dinámicamente
    this.type = this.showPassword ? 'text' : 'password';
  }

  getItemClass(): string {
    let classes = ['input-enhanced'];
    
    if (this.focused) {
      classes.push('input-focused');
    }
    
    if (this.hasErrors) {
      classes.push('input-invalid');
    } else if (this.isValid) {
      classes.push('input-valid');
    }
    
    if (this.disabled) {
      classes.push('input-disabled');
    }
    
    return classes.join(' ');
  }

  getIconClass(): string {
    if (this.hasErrors) {
      return 'icon-danger';
    } else if (this.isValid) {
      return 'icon-success';
    }
    return 'icon-primary';
  }
}

export interface SelectOption {
  value: any;
  label: string;
}