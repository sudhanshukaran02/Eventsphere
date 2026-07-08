import mongoose from 'mongoose';

/**
 * Creates a validation middleware based on a set of rules.
 * @param {object} rules - Validation rules object
 * @returns {function} Express middleware
 */
export const validate = (rules) => {
  return (req, res, next) => {
    const errors = {};
    const body = req.body || {};

    Object.keys(rules).forEach((field) => {
      const value = body[field];
      const fieldRules = rules[field];

      // Required check
      if (fieldRules.required && (value === undefined || value === null || value === '')) {
        errors[field] = `${field} is required`;
        return;
      }

      // If value is optional and missing, do not run other checks
      if (value === undefined || value === null || value === '') {
        return;
      }

      // String trim & type check
      if (fieldRules.type === 'string' && typeof value !== 'string') {
        errors[field] = `${field} must be a string`;
        return;
      }

      // Email format check
      if (fieldRules.isEmail) {
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(value)) {
          errors[field] = 'Please provide a valid email address';
        }
      }

      // Min length check
      if (fieldRules.minLength && typeof value === 'string' && value.length < fieldRules.minLength) {
        errors[field] = `${field} must be at least ${fieldRules.minLength} characters`;
      }

      // Max length check
      if (fieldRules.maxLength && typeof value === 'string' && value.length > fieldRules.maxLength) {
        errors[field] = `${field} cannot exceed ${fieldRules.maxLength} characters`;
      }

      // Enum check
      if (fieldRules.enum && !fieldRules.enum.includes(value)) {
        errors[field] = `Invalid ${field}. Must be one of: ${fieldRules.enum.join(', ')}`;
      }

      // Numeric check
      if (fieldRules.type === 'number') {
        const num = Number(value);
        if (isNaN(num)) {
          errors[field] = `${field} must be a valid number`;
        } else if (fieldRules.min !== undefined && num < fieldRules.min) {
          errors[field] = `${field} cannot be less than ${fieldRules.min}`;
        } else if (fieldRules.max !== undefined && num > fieldRules.max) {
          errors[field] = `${field} cannot be greater than ${fieldRules.max}`;
        }
      }

      // MongoId check
      if (fieldRules.isMongoId) {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          errors[field] = `${field} must be a valid MongoDB ID`;
        }
      }

      // Date check
      if (fieldRules.type === 'date') {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          errors[field] = `${field} must be a valid date`;
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    next();
  };
};

// Common Schemas
export const registerSchema = validate({
  name: { required: true, type: 'string', minLength: 2 },
  email: { required: true, type: 'string', isEmail: true },
  password: { required: true, type: 'string', minLength: 6 },
  role: { type: 'string', enum: ['attendee', 'organizer', 'admin'] },
});

export const loginSchema = validate({
  email: { required: true, type: 'string', isEmail: true },
  password: { required: true, type: 'string' },
});

export const createEventSchema = validate({
  title: { required: true, type: 'string', minLength: 3, maxLength: 100 },
  description: { required: true, type: 'string', minLength: 10 },
  category: { required: true, type: 'string', enum: ['Music', 'Tech', 'Art', 'Sports', 'Business', 'Food', 'Other'] },
  location: { required: true, type: 'string' },
  startDate: { required: true, type: 'date' },
  endDate: { required: true, type: 'date' },
  price: { type: 'number', min: 0 },
  totalTickets: { required: true, type: 'number', min: 1 },
});

export const createBookingSchema = validate({
  eventId: { required: true, isMongoId: true },
  ticketQuantity: { type: 'number', min: 1 },
});
