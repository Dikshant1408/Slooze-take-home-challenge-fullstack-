import { describe, it, expect } from 'vitest';
import { validateEmail, validatePassword, validateRole, validateQuantity, validateLastFour, validatePaymentType } from '../src/lib/validation';
import { UserInputError } from 'apollo-server-express';

describe('validateEmail', () => {
  it('throws for invalid email formats', () => {
    expect(() => validateEmail('')).toThrow(UserInputError);
    expect(() => validateEmail('not-an-email')).toThrow(UserInputError);
    expect(() => validateEmail('@domain.com')).toThrow(UserInputError);
    expect(() => validateEmail('user@')).toThrow(UserInputError);
  });

  it('does not throw for valid emails', () => {
    expect(() => validateEmail('user@example.com')).not.toThrow();
    expect(() => validateEmail('admin.in@example.com')).not.toThrow();
  });
});

describe('validatePassword', () => {
  it('throws for passwords shorter than 8 characters', () => {
    expect(() => validatePassword('')).toThrow(UserInputError);
    expect(() => validatePassword('short')).toThrow(UserInputError);
    expect(() => validatePassword('1234567')).toThrow(UserInputError);
  });

  it('does not throw for passwords 8+ characters', () => {
    expect(() => validatePassword('password')).not.toThrow();
    expect(() => validatePassword('password123')).not.toThrow();
  });
});

describe('validateRole', () => {
  it('throws for invalid roles', () => {
    expect(() => validateRole('')).toThrow(UserInputError);
    expect(() => validateRole('SUPERADMIN')).toThrow(UserInputError);
    expect(() => validateRole('admin')).toThrow(UserInputError);
  });

  it('does not throw for valid roles', () => {
    expect(() => validateRole('ADMIN')).not.toThrow();
    expect(() => validateRole('MANAGER')).not.toThrow();
    expect(() => validateRole('MEMBER')).not.toThrow();
  });
});

describe('validateQuantity', () => {
  it('throws for non-positive or non-integer quantities', () => {
    expect(() => validateQuantity(0)).toThrow(UserInputError);
    expect(() => validateQuantity(-1)).toThrow(UserInputError);
    expect(() => validateQuantity(1.5)).toThrow(UserInputError);
  });

  it('does not throw for valid quantities', () => {
    expect(() => validateQuantity(1)).not.toThrow();
    expect(() => validateQuantity(100)).not.toThrow();
  });
});

describe('validateLastFour', () => {
  it('throws for non-4-digit strings', () => {
    expect(() => validateLastFour('')).toThrow(UserInputError);
    expect(() => validateLastFour('123')).toThrow(UserInputError);
    expect(() => validateLastFour('12345')).toThrow(UserInputError);
    expect(() => validateLastFour('abcd')).toThrow(UserInputError);
  });

  it('does not throw for exactly 4 digits', () => {
    expect(() => validateLastFour('1234')).not.toThrow();
    expect(() => validateLastFour('0000')).not.toThrow();
  });
});

describe('validatePaymentType', () => {
  it('throws for invalid payment types', () => {
    expect(() => validatePaymentType('')).toThrow(UserInputError);
    expect(() => validatePaymentType('BITCOIN')).toThrow(UserInputError);
    expect(() => validatePaymentType('cash')).toThrow(UserInputError);
  });

  it('does not throw for valid payment types (case-insensitive)', () => {
    expect(() => validatePaymentType('CREDIT')).not.toThrow();
    expect(() => validatePaymentType('debit')).not.toThrow();
    expect(() => validatePaymentType('PAYPAL')).not.toThrow();
  });
});
