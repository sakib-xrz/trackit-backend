const httpStatus = require('http-status');
const jwt = require('jsonwebtoken');
const config = require('../config');
const ApiError = require('../utils/ApiError');
const prisma = require('../config/prisma');

const auth = (...allowedRoles) => async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'You are not authorized. Missing Bearer token.');
    }

    const token = authHeader.split(' ')[1];
    let verifiedUser = null;

    try {
      verifiedUser = jwt.verify(token, config.jwt.secret);
    } catch (err) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired authentication token.');
    }

    const user = await prisma.user.findUnique({
      where: { id: verifiedUser.user_id },
      select: { id: true, email: true, name: true, role: true, base_currency: true },
    });

    if (!user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'User account no longer exists.');
    }

    if (allowedRoles.length && !allowedRoles.includes(user.role)) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        'Forbidden: Guest accounts do not have access to this feature. Please register a full account.'
      );
    }

    req.user = {
      user_id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      base_currency: user.base_currency,
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = auth;
