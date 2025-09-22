// Email validation utility
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  // Additional checks for common issues
  if (email.includes('..')) {
    return { isValid: false, error: 'Email cannot contain consecutive dots' };
  }

  if (email.startsWith('.') || email.endsWith('.')) {
    return { isValid: false, error: 'Email cannot start or end with a dot' };
  }

  if (email.includes('@.') || email.includes('.@')) {
    return { isValid: false, error: 'Invalid email format around @ symbol' };
  }

  const [localPart, domain] = email.split('@');
  
  if (localPart.length === 0) {
    return { isValid: false, error: 'Email must have a username before @' };
  }

  if (domain.length === 0) {
    return { isValid: false, error: 'Email must have a domain after @' };
  }

  if (!domain.includes('.')) {
    return { isValid: false, error: 'Email domain must contain at least one dot' };
  }

  // Check for valid domain extension (at least 2 characters)
  const domainParts = domain.split('.');
  const extension = domainParts[domainParts.length - 1];
  
  if (extension.length < 2) {
    return { isValid: false, error: 'Email domain extension must be at least 2 characters' };
  }

  return { isValid: true };
};