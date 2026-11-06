const httpStatus = require('http-status');

const notFound = (req, res, next) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    status_code: httpStatus.NOT_FOUND,
    message: 'API Endpoint Not Found',
    error_messages: [
      {
        path: req.originalUrl,
        message: `Cannot ${req.method} ${req.originalUrl}`,
      },
    ],
  });
};

module.exports = notFound;
