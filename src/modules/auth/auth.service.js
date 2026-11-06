const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const httpStatus = require('http-status');
const crypto = require('crypto');
const prisma = require('../../config/prisma');
const config = require('../../config');
const ApiError = require('../../utils/ApiError');

const generateToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expires_in,
  });
};

const registerUser = async (payload) => {
  const existing = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (existing) {
    throw new ApiError(httpStatus.CONFLICT, 'Email is already registered');
  }

  const password_hash = await bcrypt.hash(payload.password, config.bcrypt_salt_rounds);

  const user = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email,
      password_hash,
      phone: payload.phone || null,
      role: 'USER',
      base_currency: payload.base_currency || 'USD',
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      base_currency: true,
      created_at: true,
    },
  });

  const access_token = generateToken({
    user_id: user.id,
    email: user.email,
    role: user.role,
  });

  return { user, access_token };
};

const loginUser = async (payload) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid email or password');
  }

  const isPasswordMatch = await bcrypt.compare(payload.password, user.password_hash);
  if (!isPasswordMatch) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid email or password');
  }

  const access_token = generateToken({
    user_id: user.id,
    email: user.email,
    role: user.role,
  });

  const { password_hash, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, access_token };
};

const createGuestSession = async () => {
  const guestSuffix = crypto.randomBytes(4).toString('hex');
  const guestEmail = `guest_${guestSuffix}@trackit.local`;
  const password_hash = await bcrypt.hash(guestSuffix, 8);

  const guestUser = await prisma.user.create({
    data: {
      name: `Guest User (${guestSuffix})`,
      email: guestEmail,
      password_hash,
      role: 'GUEST',
      base_currency: 'USD',
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      base_currency: true,
      created_at: true,
    },
  });

  const access_token = generateToken({
    user_id: guestUser.id,
    email: guestUser.email,
    role: guestUser.role,
  });

  return { user: guestUser, access_token };
};

const getMyProfile = async (user_id) => {
  const user = await prisma.user.findUnique({
    where: { id: user_id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      base_currency: true,
      created_at: true,
      updated_at: true,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  return user;
};

const updateMyProfile = async (user_id, payload) => {
  const updated = await prisma.user.update({
    where: { id: user_id },
    data: payload,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      base_currency: true,
      updated_at: true,
    },
  });

  return updated;
};

const changePassword = async (user_id, { current_password, new_password }) => {
  const user = await prisma.user.findUnique({
    where: { id: user_id },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const isPasswordMatch = await bcrypt.compare(current_password, user.password_hash);
  if (!isPasswordMatch) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Current password does not match');
  }

  const newHash = await bcrypt.hash(new_password, config.bcrypt_salt_rounds);

  await prisma.user.update({
    where: { id: user_id },
    data: { password_hash: newHash },
  });
};

module.exports = {
  registerUser,
  loginUser,
  createGuestSession,
  getMyProfile,
  updateMyProfile,
  changePassword,
};
