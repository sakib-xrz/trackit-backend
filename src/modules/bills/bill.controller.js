const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const sendResponse = require('../../utils/sendResponse');
const BillService = require('./bill.service');

const addBill = catchAsync(async (req, res) => {
  const result = await BillService.addBill(req.user.user_id, req.body);
  sendResponse(res, {
    status_code: httpStatus.CREATED,
    success: true,
    message: 'Bill/Subscription created successfully',
    data: result,
  });
});

const getBills = catchAsync(async (req, res) => {
  const result = await BillService.getBillsAndCalendar(req.user.user_id, req.query);
  sendResponse(res, {
    status_code: httpStatus.OK,
    success: true,
    message: 'Bills & subscription calendar retrieved successfully',
    data: result,
  });
});

const markAsPaid = catchAsync(async (req, res) => {
  const result = await BillService.markBillAsPaid(req.user.user_id, req.params.id);
  sendResponse(res, {
    status_code: httpStatus.OK,
    success: true,
    message: 'Bill marked as paid',
    data: result,
  });
});

const updateBill = catchAsync(async (req, res) => {
  const result = await BillService.updateBill(req.user.user_id, req.params.id, req.body);
  sendResponse(res, {
    status_code: httpStatus.OK,
    success: true,
    message: 'Bill updated successfully',
    data: result,
  });
});

const deleteBill = catchAsync(async (req, res) => {
  await BillService.deleteBill(req.user.user_id, req.params.id);
  sendResponse(res, {
    status_code: httpStatus.OK,
    success: true,
    message: 'Bill deleted successfully',
    data: null,
  });
});

const detectSubscriptions = catchAsync(async (req, res) => {
  const result = await BillService.detectSubscriptions(req.user.user_id);
  sendResponse(res, {
    status_code: httpStatus.OK,
    success: true,
    message: 'Potential recurring subscriptions detected successfully',
    data: result,
  });
});

const getReminders = catchAsync(async (req, res) => {
  const result = await BillService.getUpcomingReminders(req.user.user_id);
  sendResponse(res, {
    status_code: httpStatus.OK,
    success: true,
    message: 'Upcoming bill reminders retrieved successfully',
    data: result,
  });
});

module.exports = {
  addBill,
  getBills,
  markAsPaid,
  updateBill,
  deleteBill,
  detectSubscriptions,
  getReminders,
};
