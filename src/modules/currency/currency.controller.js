const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const sendResponse = require('../../utils/sendResponse');
const CurrencyService = require('./currency.service');

const getExchangeRates = catchAsync(async (req, res) => {
  const result = await CurrencyService.fetchRates(req.query.base || 'USD');
  sendResponse(res, {
    status_code: httpStatus.OK,
    success: true,
    message: 'Exchange rates retrieved successfully',
    data: result,
  });
});

const convertCurrency = catchAsync(async (req, res) => {
  const { from, to, amount } = req.query;
  const result = await CurrencyService.convertCurrency({ from, to, amount });
  sendResponse(res, {
    status_code: httpStatus.OK,
    success: true,
    message: 'Currency converted successfully',
    data: result,
  });
});

module.exports = {
  getExchangeRates,
  convertCurrency,
};
