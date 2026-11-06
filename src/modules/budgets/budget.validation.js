const { z } = require('zod');

const setBudgetSchema = z.object({
  body: z.object({
    month: z.string({ required_error: 'month is required in YYYY-MM format' }).regex(/^\d{4}-\d{2}$/, 'month must be in YYYY-MM format'),
    amount: z.number({ required_error: 'amount is required' }).positive('Budget amount must be greater than 0'),
  }),
});

const updateBudgetSchema = z.object({
  body: z.object({
    amount: z.number({ required_error: 'amount is required' }).positive('Budget amount must be greater than 0'),
  }),
});

module.exports = {
  setBudgetSchema,
  updateBudgetSchema,
};
