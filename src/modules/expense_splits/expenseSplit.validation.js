const { z } = require('zod');

const createSplitSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'title is required' }).min(2),
    total_amount: z.number({ required_error: 'total_amount is required' }).positive(),
    currency: z.string().max(10).optional(),
    note: z.string().optional(),
    participants: z
      .array(
        z.object({
          user_id: z.string().uuid().optional(),
          participant_name: z.string({ required_error: 'participant_name is required' }).min(1),
          participant_email: z.string().email().optional(),
          share_amount: z.number({ required_error: 'share_amount is required' }).positive(),
        })
      )
      .min(1, 'At least one participant is required'),
  }),
});

const addParticipantSchema = z.object({
  body: z.object({
    user_id: z.string().uuid().optional(),
    participant_name: z.string({ required_error: 'participant_name is required' }).min(1),
    participant_email: z.string().email().optional(),
    share_amount: z.number({ required_error: 'share_amount is required' }).positive(),
  }),
});

module.exports = {
  createSplitSchema,
  addParticipantSchema,
};
