import { UserInputError } from 'apollo-server-express';

export function validateEmail(email: string): void {
  // RFC 5322 simplified regex that handles common valid formats
  const emailRe = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  if (!email || !emailRe.test(email.trim())) {
    throw new UserInputError('Invalid email address');
  }
}

export function validatePassword(password: string): void {
  if (!password || password.length < 8) {
    throw new UserInputError('Password must be at least 8 characters');
  }
}

export function validateRole(role: string): void {
  const validRoles = ['ADMIN', 'MANAGER', 'MEMBER'];
  if (!validRoles.includes(role)) {
    throw new UserInputError(`Role must be one of: ${validRoles.join(', ')}`);
  }
}

export function validateQuantity(quantity: number): void {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new UserInputError('Quantity must be a positive integer');
  }
}

export function validatePaymentType(type: string): void {
  const validTypes = ['CREDIT', 'DEBIT', 'PAYPAL'];
  if (!validTypes.includes(type.toUpperCase())) {
    throw new UserInputError(`Payment type must be one of: ${validTypes.join(', ')}`);
  }
}

export function validateLastFour(lastFour: string): void {
  if (!/^\d{4}$/.test(lastFour)) {
    throw new UserInputError('lastFour must be exactly 4 digits');
  }
}
