const logger = require('../config/winston');

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    user: req.user ? req.user.uid : 'anonymous'
  });

  // Don't leak error details in production
  const error = process.env.NODE_ENV === 'production' 
    ? 'An error occurred' 
    : err.message;

  res.status(err.status || 500).json({
    error,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

module.exports = errorHandler;
