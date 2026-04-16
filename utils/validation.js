// utils/validation.js — Shared validation for API routes and client-side forms

export function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, 1000);
}

export function validateEptId(id) {
  if (!id || typeof id !== 'string') return { valid: false, error: 'EPT ID is required' };
  const trimmed = id.trim();
  if (trimmed.length < 2 || trimmed.length > 50) return { valid: false, error: 'EPT ID must be between 2 and 50 characters' };
  // Only block obviously dangerous input — don't enforce a strict format
  // because the Auth sheet is the source of truth for valid IDs
  if (/[<>"';&|`$]/.test(trimmed)) return { valid: false, error: 'EPT ID contains invalid characters' };
  return { valid: true, value: trimmed };
}

export function validateEmail(email) {
  if (!email || typeof email !== 'string') return { valid: false, error: 'Email is required' };
  const trimmed = email.trim().toLowerCase();
  if (trimmed.length > 254) return { valid: false, error: 'Email is too long' };
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(trimmed)) return { valid: false, error: 'Invalid email address' };
  return { valid: true, value: trimmed };
}

export function validateBookingData(data) {
  const errors = {};

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 1) {
    errors.name = 'Name is required';
  } else if (data.name.trim().length > 200) {
    errors.name = 'Name is too long';
  }

  const emailResult = validateEmail(data.email);
  if (!emailResult.valid) errors.email = emailResult.error;

  const eptResult = validateEptId(data.eptId);
  if (!eptResult.valid) errors.eptId = eptResult.error;

  if (!data.selectedDate || typeof data.selectedDate !== 'string') {
    errors.selectedDate = 'Test date is required';
  }

  if (data.hasLaptop === undefined || data.hasLaptop === null) {
    errors.hasLaptop = 'Laptop preference is required';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

export function validateSubmission(data) {
  const errors = {};

  if (!data.test_id || typeof data.test_id !== 'string') {
    errors.test_id = 'Test ID is required';
  }

  if (!data.student_id || typeof data.student_id !== 'string') {
    errors.student_id = 'Student ID is required';
  }

  if (!data.type || !['reading', 'writing', 'listening'].includes(data.type)) {
    errors.type = 'Valid test type is required';
  }

  if (!data.responses || typeof data.responses !== 'object') {
    errors.responses = 'Responses are required';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

export function validateDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return { valid: false, error: 'Date is required' };
  const trimmed = dateStr.trim();
  if (trimmed.length > 100) return { valid: false, error: 'Invalid date format' };
  return { valid: true, value: trimmed };
}
