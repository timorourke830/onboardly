// Form validation utilities

export interface ValidationRule {
  validate: (value: string) => boolean;
  message: string;
}

export interface ValidationRules {
  [field: string]: ValidationRule[];
}

export interface ValidationErrors {
  [field: string]: string;
}

// Common validation rules
export const required = (fieldName: string): ValidationRule => ({
  validate: (value: string) => value.trim().length > 0,
  message: `${fieldName} is required`,
});

export const minLength = (fieldName: string, min: number): ValidationRule => ({
  validate: (value: string) => value.trim().length >= min,
  message: `${fieldName} must be at least ${min} characters`,
});

export const maxLength = (fieldName: string, max: number): ValidationRule => ({
  validate: (value: string) => value.trim().length <= max,
  message: `${fieldName} must be less than ${max} characters`,
});

export const email = (): ValidationRule => ({
  validate: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value.trim());
  },
  message: "Please enter a valid email address",
});

export const pattern = (fieldName: string, regex: RegExp, errorMessage?: string): ValidationRule => ({
  validate: (value: string) => regex.test(value),
  message: errorMessage || `${fieldName} has an invalid format`,
});

export const noSpecialChars = (fieldName: string): ValidationRule => ({
  validate: (value: string) => /^[a-zA-Z0-9\s-_]+$/.test(value),
  message: `${fieldName} can only contain letters, numbers, spaces, hyphens, and underscores`,
});

export const accountNumber = (): ValidationRule => ({
  validate: (value: string) => /^[0-9]{3,5}$/.test(value.trim()),
  message: "Account number must be 3-5 digits",
});

// Validate a single field against its rules
export function validateField(value: string, rules: ValidationRule[]): string | null {
  for (const rule of rules) {
    if (!rule.validate(value)) {
      return rule.message;
    }
  }
  return null;
}

// Validate all fields in a form
export function validateForm(
  values: Record<string, string>,
  rules: ValidationRules
): ValidationErrors {
  const errors: ValidationErrors = {};

  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = values[field] || "";
    const error = validateField(value, fieldRules);
    if (error) {
      errors[field] = error;
    }
  }

  return errors;
}

// Check if a form is valid (no errors)
export function isFormValid(errors: ValidationErrors): boolean {
  return Object.keys(errors).length === 0;
}

// Project form validation rules
export const projectValidationRules: ValidationRules = {
  name: [
    required("Project name"),
    minLength("Project name", 2),
    maxLength("Project name", 100),
  ],
  businessName: [
    required("Business name"),
    minLength("Business name", 2),
    maxLength("Business name", 200),
  ],
};

// Account form validation rules
export const accountValidationRules: ValidationRules = {
  number: [
    required("Account number"),
    accountNumber(),
  ],
  name: [
    required("Account name"),
    minLength("Account name", 2),
    maxLength("Account name", 100),
  ],
  description: [
    maxLength("Description", 500),
  ],
};

// Auth form validation rules
export const signupValidationRules: ValidationRules = {
  name: [
    required("Name"),
    minLength("Name", 2),
    maxLength("Name", 100),
  ],
  email: [
    required("Email"),
    email(),
  ],
  password: [
    required("Password"),
    minLength("Password", 8),
  ],
};

export const loginValidationRules: ValidationRules = {
  email: [
    required("Email"),
    email(),
  ],
  password: [
    required("Password"),
  ],
};

// Helper to show inline validation
export function getFieldStatus(
  field: string,
  value: string,
  errors: ValidationErrors,
  touched: Set<string>
): { error?: string; isValid: boolean } {
  if (!touched.has(field)) {
    return { isValid: false };
  }

  const error = errors[field];
  return {
    error,
    isValid: !error && value.trim().length > 0,
  };
}
