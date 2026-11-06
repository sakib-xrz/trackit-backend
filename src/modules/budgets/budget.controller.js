const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const sendResponse = require('../../utils/sendResponse');
const BudgetService = require('./budget.service');

const createBudget = catchAsync(async (req, res) => {
  const result = await BudgetService.createBudget(req.user.user_id, req.body);
  sendResponse(res, {
    status_code: httpStatus.CREATED,
    success: true,
    message: 'Monthly budget created successfully',
    data: result,
  });
});

const getBudgets = catchAsync(async (req, res) => {
  const result = await BudgetService.getBudgets(req.user.user_id);
  sendResponse(res, {
    status_code: httpStatus.OK,
    success: true,
    message: 'Budgets retrieved successfully',
    data: result,
  });
});

const updateBudget = catchAsync(async (req, res) => {
  const result = await BudgetService.updateBudget(req.user.user_id, req.params.id, req.body);
  sendResponse(res, {
    status_code: httpStatus.OK,
    success: true,
    message: 'Budget updated successfully',
    data: result,
  });
});

const deleteBudget = catchAsync(async (req, res) => {
  await BudgetService.deleteBudget(req.user.user_id, req.params.id);
  sendResponse(res, {
    status_code: httpStatus.OK,
    success: true,
    message: 'Budget deleted successfully',
  });
});

const getBudgetReport = catchAsync(async (req, res) => {
  const result = await BudgetService.getBudgetReport(req.user.user_id, req.query.month);
  sendResponse(res, {
    status_code: httpStatus.OK,
    success: true,
    message: 'Budget report retrieved successfully',
    data: result,
  });
});

module.exports = {
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget,
  getBudgetReport,
};
