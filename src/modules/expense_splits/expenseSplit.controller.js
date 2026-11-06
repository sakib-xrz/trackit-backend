const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const sendResponse = require('../../utils/sendResponse');
const ExpenseSplitService = require('./expenseSplit.service');

const createSplit = catchAsync(async (req, res) => {
  const result = await ExpenseSplitService.createSplit(req.user.user_id, req.body);
  sendResponse(res, {
    status_code: httpStatus.CREATED,
    success: true,
    message: 'Shared expense split created successfully',
    data: result,
  });
});

const getSplits = catchAsync(async (req, res) => {
  const result = await ExpenseSplitService.getSplits(req.user.user_id);
  sendResponse(res, {
    status_code: httpStatus.OK,
    success: true,
    message: 'Shared expense splits retrieved successfully',
    data: result,
  });
});

const addParticipant = catchAsync(async (req, res) => {
  const result = await ExpenseSplitService.addParticipant(req.user.user_id, req.params.id, req.body);
  sendResponse(res, {
    status_code: httpStatus.CREATED,
    success: true,
    message: 'Participant added to split successfully',
    data: result,
  });
});

const settleParticipant = catchAsync(async (req, res) => {
  const result = await ExpenseSplitService.settleParticipantShare(
    req.user.user_id,
    req.params.id,
    req.params.participantId
  );
  sendResponse(res, {
    status_code: httpStatus.OK,
    success: true,
    message: 'Participant share settled successfully',
    data: result,
  });
});

const settleUpAll = catchAsync(async (req, res) => {
  const result = await ExpenseSplitService.settleEntireSplit(req.user.user_id, req.params.id);
  sendResponse(res, {
    status_code: httpStatus.OK,
    success: true,
    message: 'Entire expense split settled up successfully',
    data: result,
  });
});

const deleteSplit = catchAsync(async (req, res) => {
  const result = await ExpenseSplitService.deleteSplit(req.user.user_id, req.params.id);
  sendResponse(res, {
    status_code: httpStatus.OK,
    success: true,
    message: 'Expense split deleted successfully',
    data: result,
  });
});

module.exports = {
  createSplit,
  getSplits,
  addParticipant,
  settleParticipant,
  settleUpAll,
  deleteSplit,
};
