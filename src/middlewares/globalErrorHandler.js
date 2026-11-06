const httpStatus = require('http-status');
const { Prisma } = require('@prisma/client');
const { ZodError } = require('zod');
const config = require('../config');
const ApiError = require('../utils/ApiError');

const globalErrorHandler = (err, req, res, next) => {
  let status_code = httpStatus.INTERNAL_SERVER_ERROR;
  let message = 'Something went wrong!';
  let error_messages = [];

  if (err instanceof ZodError) {
    status_code = httpStatus.BAD_REQUEST;
    message = 'Validation Error';
    error_messages = err.errors.map((issue) => ({
      path: issue.path[issue.path.length - 1] || '',
      message: issue.message,
    }));
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    status_code = httpStatus.BAD_REQUEST;
    message = 'Database Validation Error';
    error_messages = [{ path: '', message: err.message }];
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      status_code = httpStatus.CONFLICT;
      const target = (err.meta && err.meta.target) || 'field';
      message = `Duplicate value exists for ${target}`;
      error_messages = [{ path: String(target), message }];
    } else if (err.code === 'P2025') {
      status_code = httpStatus.NOT_FOUND;
      message = (err.meta && err.meta.cause) || 'Record not found in database';
      error_messages = [{ path: '', message }];
    } else if (err.code === 'P2003') {
      status_code = httpStatus.BAD_REQUEST;
      message = 'Foreign key constraint failed (related record is still in use or missing)';
      error_messages = [{ path: '', message }];
    }
  } else if (err instanceof ApiError) {
    status_code = err.statusCode;
    message = err.message;
    error_messages = err.message ? [{ path: '', message: err.message }] : [];
  } else if (err instanceof Error) {
    message = err.message;
    error_messages = err.message ? [{ path: '', message: err.message }] : [];
  }

  res.status(status_code).json({
    success: false,
    status_code,
    message,
    error_messages,
    stack: config.env !== 'production' ? err.stack : undefined,
  });
};

module.exports = globalErrorHandler;
