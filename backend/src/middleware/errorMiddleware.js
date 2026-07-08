/**
 * Centralized Express Error Handling Middleware.
 */
const errorHandler = (err, req, res, next) => {
  // Ensure default operational fields are set
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Log errors for developers
  if (process.env.NODE_ENV !== 'test') {
    console.error('API Error:', err);
  }

  // Mongoose Bad ObjectId (Cast Error)
  if (err.name === 'CastError') {
    message = `Resource not found with id of ${err.value}`;
    statusCode = 404;
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    message = 'Duplicate field value entered. Resource already exists.';
    statusCode = 400;
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors).map((val) => val.message).join(', ');
    statusCode = 400;
  }

  // JSON Web Token Errors
  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid token. Access denied.';
    statusCode = 401;
  }
  if (err.name === 'TokenExpiredError') {
    message = 'Your session token has expired. Please log in again.';
    statusCode = 401;
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

export default errorHandler;
