const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const sendResponse = require('../../utils/sendResponse');
const ReportService = require('./report.service');

const getDashboardSummary = catchAsync(async (req, res) => {
  const result = await ReportService.getDashboardSummary(req.user.user_id, req.query.month);
  sendResponse(res, {
    status_code: httpStatus.OK,
    success: true,
    message: 'Dashboard financial report retrieved successfully',
    data: result,
  });
});

const getSpendingHeatmap = catchAsync(async (req, res) => {
  const result = await ReportService.getSpendingHeatmap(req.user.user_id, req.query.month);
  sendResponse(res, {
    status_code: httpStatus.OK,
    success: true,
    message: 'Spending heatmap retrieved successfully',
    data: result,
  });
});

module.exports = {
  getDashboardSummary,
  getSpendingHeatmap,
};
