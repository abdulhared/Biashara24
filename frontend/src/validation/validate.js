export function validate(values, fields) {
  const errors = {};
  for (const field of fields) {
    const value = values[field.name];
    if (field.required && (value === undefined || value === null || String(value).trim() === '')) {
      errors[field.name] = `${field.label} is required`;
      continue;
    }
    if (value === undefined || value === null || value === '') continue;
    if (field.type === 'number' && Number.isNaN(Number(value))) errors[field.name] = `${field.label} must be a number`;
    if (field.min !== undefined && Number(value) < field.min) errors[field.name] = `${field.label} must be at least ${field.min}`;
    if (field.pattern && !field.pattern.test(String(value))) errors[field.name] = field.patternMessage || `${field.label} is invalid`;
  }
  return errors;
}

export const validators = {
  plate: /^[A-Z]{3}\s?\d{3}[A-Z]$/i,
  phone: /^(?:\+254|0)7\d{8}$/,
  mpesa: /^[A-Z0-9]{8,12}$/i
};
