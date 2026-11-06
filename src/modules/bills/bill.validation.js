const { z } = require('zod');

const dateValidator = z.string({ required_error: 'due_date is required' }).refine(
  (val) => !isNaN(new Date(val).getTime()),
  { message: 'Invalid date or datetime format. Expected YYYY-MM-DD or ISO 8601 string.' }
);

const optionalDateValidator = z.string().refine(
  (val) => !isNaN(new Date(val).getTime()),
  { message: 'Invalid date or datetime format. Expected YYYY-MM-DD or ISO 8601 string.' }
).optional();

const createBillSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'title is required' }).min(1),
    amount: z.coerce.number({ required_error: 'amount is required' }).positive(),
    due_date: dateValidator,
    repeat_interval: z.enum(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).optional(),
    is_subscription: z.boolean().optional(),
    reminder_days_left: z.coerce.number().int().min(0).max(30).optional(),
  }),
});

const updateBillSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    amount: z.coerce.number().positive().optional(),
    due_date: optionalDateValidator,
    repeat_interval: z.enum(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).optional(),
    is_paid: z.boolean().optional(),
    is_subscription: z.boolean().optional(),
    reminder_days_left: z.coerce.number().int().min(0).max(30).optional(),
  }),
});

module.exports = {
  createBillSchema,
  updateBillSchema,
};
