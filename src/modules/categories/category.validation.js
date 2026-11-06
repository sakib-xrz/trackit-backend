const { z } = require('zod');

const createCategorySchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'name is required' }).min(2),
    type: z.enum(['INCOME', 'EXPENSE'], { required_error: 'type must be INCOME or EXPENSE' }),
    icon: z.string().optional(),
  }),
});

const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    type: z.enum(['INCOME', 'EXPENSE']).optional(),
    icon: z.string().optional(),
  }),
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
};
