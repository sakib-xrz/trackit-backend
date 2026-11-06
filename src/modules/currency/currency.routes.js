const express = require('express');
const auth = require('../../middlewares/auth');
const CurrencyController = require('./currency.controller');

const router = express.Router();

// Registered Users Only (per Proposal Section 7.1 & Use Case Diagram)
router.get('/rates', auth('USER'), CurrencyController.getExchangeRates);
router.get('/convert', auth('USER'), CurrencyController.convertCurrency);

module.exports = router;
