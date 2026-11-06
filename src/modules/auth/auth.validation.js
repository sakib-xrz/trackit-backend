const { z } = require('zod');

const registerSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'name is required' }).min(2),
    email: z.string({ required_error: 'email is required' }).email('Invalid email address'),
    password: z.string({ required_error: 'password is required' }).min(6, 'Password must be at least 6 characters'),
    phone: z.string().optional(),
    base_currency: z.string().max(10).optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'email is required' }).email(),
    password: z.string({ required_error: 'password is required' }),
  }),
});

const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    phone: z.string().optional(),
    base_currency: z.string().max(10).optional(),
  }),
});

const changePasswordSchema = z.object({
  body: z.object({
    current_password: z.string({ required_error: 'Current password is required' }),
    new_password: z.string({ required_error: 'New password is required' }).min(6, 'New password must be at least 6 characters'),
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
};
