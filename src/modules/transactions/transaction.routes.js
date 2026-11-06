const express = require('express');
const auth = require('../../middlewares/auth');
const validateRequest = require('../../middlewares/validateRequest');
const TransactionValidation = require('./transaction.validation');
const TransactionController = require('./transaction.controller');

const router = express.Router();

// Both Registered Users and Guests can record and view transactions (per Use Case Diagram)
router.get('/', auth('USER', 'GUEST'), TransactionController.getTransactions);
router.post('/', auth('USER', 'GUEST'), validateRequest(TransactionValidation.createTransactionSchema), TransactionController.addTransaction);
router.patch('/:id', auth('USER', 'GUEST'), validateRequest(TransactionValidation.updateTransactionSchema), TransactionController.updateTransaction);
router.delete('/:id', auth('USER', 'GUEST'), TransactionController.deleteTransaction);

module.exports = router;
