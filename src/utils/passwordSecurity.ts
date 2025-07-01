import crypto from 'crypto';

/**
 * Utility functions for password security
 */

/**
 * Removes password field from user objects or arrays of user objects
 */
export const excludePassword = <T extends Record<string, any>>(user: T): Omit<T, 'password'> => {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

/**
 * Removes password field from an array of user objects
 */
export const excludePasswordFromUsers = <T extends Record<string, any>[]>(users: T): Omit<T[number], 'password'>[] => {
  return users.map(user => excludePassword(user));
};

/**
 * If for some reason a password needs to be shown (debugging, logs, etc.),
 * this function returns a masked version
 */
export const maskPassword = (password: string): string => {
  if (!password || password.length < 3) {
    return '***';
  }
  return password.substring(0, 2) + '*'.repeat(password.length - 2);
};

/**
 * Validates password strength
 */
export const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  // Check for common weak passwords
  const commonPasswords = ['password', '123456', 'password123', 'admin', 'qwerty'];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common and easily guessable');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Generates a secure random password
 */
export const generateSecurePassword = (length: number = 12): string => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = lowercase + uppercase + numbers + symbols;
  
  let password = '';
  // Ensure at least one character from each category
  password += lowercase[crypto.randomInt(lowercase.length)];
  password += uppercase[crypto.randomInt(uppercase.length)];
  password += numbers[crypto.randomInt(numbers.length)];
  password += symbols[crypto.randomInt(symbols.length)];
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[crypto.randomInt(allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};
