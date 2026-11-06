const { z } = require('zod');

const optionalDateValidator = z.string().refine(
  (val) => !isNaN(new Date(val).getTime()),
  { message: 'Invalid date or datetime format' }
).optional();

const createTransactionSchema = z.object({
  body: z.object({
    category_id: z.string({ required_error: 'category_id is required' }).uuid('Invalid category UUID'),
    type: z.enum(['INCOME', 'EXPENSE'], { required_error: 'type must be INCOME or EXPENSE' }),
    amount: z.coerce.number({ required_error: 'amount is required' }).positive('Amount must be greater than 0'),
    currency: z.string().max(10).optional(),
    transaction_date: optionalDateValidator,
    note: z.string().optional(),
    is_recurring: z.boolean().optional(),
  }),
});

const updateTransactionSchema = z.object({
  body: z.object({
    category_id: z.string().uuid().optional(),
    type: z.enum(['INCOME', 'EXPENSE']).optional(),
    amount: z.coerce.number().positive().optional(),
    currency: z.string().max(10).optional(),
    transaction_date: optionalDateValidator,
    note: z.string().optional(),
    is_recurring: z.boolean().optional(),
  }),
});

module.exports = {
  createTransactionSchema,
  updateTransactionSchema,
};
