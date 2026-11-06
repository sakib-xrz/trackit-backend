const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const sendResponse = require('../../utils/sendResponse');
const AuthService = require('./auth.service');

const register = catchAsync(async (req, res) => {
  const result = await AuthService.registerUser(req.body);
  sendResponse(res, {
    status_code: httpStatus.CREATED,
    success: true,
    message: 'User registered successfully',
    data: result,
  });
});

const login = catchAsync(async (req, res) => {
  const result = await AuthService.loginUser(req.body);
  sendResponse(res, {
    status_code: httpStatus.OK,
    success: true,
    message: 'User logged in successfully',
    data: result,
  });
});

const guestLogin = catchAsync(async (req, res) => {
  const result = await AuthService.createGuestSession();
  sendResponse(res, {
    status_code: httpStatus.CREATED,
    success: true,
    message: 'Guest session created successfully (Basic features enabled)',
    data: result,
  });
});

const getProfile = catchAsync(async (req, res) => {
  const result = await AuthService.getMyProfile(req.user.user_id);
  sendResponse(res, {
    status_code: httpStatus.OK,
    success: true,
    message: 'User profile retrieved successfully',
    data: result,
  });
});

const updateProfile = catchAsync(async (req, res) => {
  const result = await AuthService.updateMyProfile(req.user.user_id, req.body);
  sendResponse(res, {
    status_code: httpStatus.OK,
    success: true,
    message: 'Profile updated successfully',
    data: result,
  });
});

const changePassword = catchAsync(async (req, res) => {
  await AuthService.changePassword(req.user.user_id, req.body);
  sendResponse(res, {
    status_code: httpStatus.OK,
    success: true,
    message: 'Password updated successfully',
  });
});

module.exports = {
  register,
  login,
  guestLogin,
  getProfile,
  updateProfile,
  changePassword,
};
