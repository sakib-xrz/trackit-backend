const express = require('express');
const validateRequest = require('../../middlewares/validateRequest');
const auth = require('../../middlewares/auth');
const AuthValidation = require('./auth.validation');
const AuthController = require('./auth.controller');

const router = express.Router();

router.post('/register', validateRequest(AuthValidation.registerSchema), AuthController.register);
router.post('/login', validateRequest(AuthValidation.loginSchema), AuthController.login);
router.post('/guest', AuthController.guestLogin);

router.get('/me', auth('USER', 'GUEST'), AuthController.getProfile);
router.patch('/me', auth('USER', 'GUEST'), validateRequest(AuthValidation.updateProfileSchema), AuthController.updateProfile);
router.post('/change-password', auth('USER'), validateRequest(AuthValidation.changePasswordSchema), AuthController.changePassword);

module.exports = router;
