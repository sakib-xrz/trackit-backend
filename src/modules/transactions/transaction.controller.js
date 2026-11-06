const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const sendResponse = require('../../utils/sendResponse');
const pick = require('../../utils/pick');
const TransactionService = require('./transaction.service');

const addTransaction = catchAsync(async (req, res) => {
  const result = await TransactionService.addTransaction(req.user.user_id, req.body);
  sendResponse(res, {
    status_code: httpStatus.CREATED,
    success: true,
    message: 'Transaction recorded successfully',
    data: result,
  });
});

const getTransactions = catchAsync(async (req, res) => {
  const filters = pick(req.query, ['type', 'category_id', 'start_date', 'end_date']);
  const paginationOptions = pick(req.query, ['page', 'limit', 'sort_by', 'sort_order']);
  const result = await TransactionService.getTransactions(req.user.user_id, filters, paginationOptions);

  sendResponse(res, {
    status_code: httpStatus.OK,
    success: true,
    message: 'Transactions retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const updateTransaction = catchAsync(async (req, res) => {
  const result = await TransactionService.updateTransaction(req.user.user_id, req.params.id, req.body);
  sendResponse(res, {
    status_code: httpStatus.OK,
    success: true,
    message: 'Transaction updated successfully',
    data: result,
  });
});

const deleteTransaction = catchAsync(async (req, res) => {
  await TransactionService.deleteTransaction(req.user.user_id, req.params.id);
  sendResponse(res, {
    status_code: httpStatus.OK,
    success: true,
    message: 'Transaction deleted successfully',
    data: null,
  });
});

module.exports = {
  addTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
};
