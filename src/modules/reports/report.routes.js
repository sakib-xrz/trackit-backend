const express = require('express');
const auth = require('../../middlewares/auth');
const ReportController = require('./report.controller');

const router = express.Router();

// Accessible by both Registered Users and Guest Users (per Use Case Diagram)
router.get('/dashboard', auth('USER', 'GUEST'), ReportController.getDashboardSummary);
router.get('/spending-heatmap', auth('USER', 'GUEST'), ReportController.getSpendingHeatmap);

module.exports = router;
