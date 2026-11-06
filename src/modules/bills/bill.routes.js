const express = require('express');
const auth = require('../../middlewares/auth');
const validateRequest = require('../../middlewares/validateRequest');
const BillValidation = require('./bill.validation');
const BillController = require('./bill.controller');

const router = express.Router();

// Both Registered Users and Guests can manage bills & calendar
router.get('/', auth('USER', 'GUEST'), BillController.getBills);
router.get('/detect-subscriptions', auth('USER', 'GUEST'), BillController.detectSubscriptions);
router.get('/reminders', auth('USER', 'GUEST'), BillController.getReminders);
router.post('/', auth('USER', 'GUEST'), validateRequest(BillValidation.createBillSchema), BillController.addBill);
router.patch('/:id/mark-paid', auth('USER', 'GUEST'), BillController.markAsPaid);
router.patch('/:id', auth('USER', 'GUEST'), validateRequest(BillValidation.updateBillSchema), BillController.updateBill);
router.delete('/:id', auth('USER', 'GUEST'), BillController.deleteBill);

module.exports = router;
