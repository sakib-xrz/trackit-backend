const express = require('express');
const auth = require('../../middlewares/auth');
const validateRequest = require('../../middlewares/validateRequest');
const ExpenseSplitValidation = require('./expenseSplit.validation');
const ExpenseSplitController = require('./expenseSplit.controller');

const router = express.Router();

// Both Registered Users and Guests can manage expense splits
router.get('/', auth('USER', 'GUEST'), ExpenseSplitController.getSplits);
router.post('/', auth('USER', 'GUEST'), validateRequest(ExpenseSplitValidation.createSplitSchema), ExpenseSplitController.createSplit);
router.post('/:id/participants', auth('USER', 'GUEST'), validateRequest(ExpenseSplitValidation.addParticipantSchema), ExpenseSplitController.addParticipant);
router.patch('/:id/participants/:participantId/settle', auth('USER', 'GUEST'), ExpenseSplitController.settleParticipant);
router.patch('/:id/settle-up', auth('USER', 'GUEST'), ExpenseSplitController.settleUpAll);
router.delete('/:id', auth('USER', 'GUEST'), ExpenseSplitController.deleteSplit);

module.exports = router;
