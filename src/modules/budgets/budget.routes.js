const express = require('express');
const auth = require('../../middlewares/auth');
const validateRequest = require('../../middlewares/validateRequest');
const BudgetValidation = require('./budget.validation');
const BudgetController = require('./budget.controller');

const router = express.Router();

router.get('/', auth('USER', 'GUEST'), BudgetController.getBudgets);
router.post('/', auth('USER', 'GUEST'), validateRequest(BudgetValidation.setBudgetSchema), BudgetController.createBudget);
router.patch('/:id', auth('USER', 'GUEST'), validateRequest(BudgetValidation.updateBudgetSchema), BudgetController.updateBudget);
router.delete('/:id', auth('USER', 'GUEST'), BudgetController.deleteBudget);
router.get('/report', auth('USER', 'GUEST'), BudgetController.getBudgetReport);

module.exports = router;
