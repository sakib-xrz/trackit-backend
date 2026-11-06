const express = require('express');
const authRoutes = require('../modules/auth/auth.routes');
const categoryRoutes = require('../modules/categories/category.routes');
const transactionRoutes = require('../modules/transactions/transaction.routes');
const budgetRoutes = require('../modules/budgets/budget.routes');
const billRoutes = require('../modules/bills/bill.routes');
const expenseSplitRoutes = require('../modules/expense_splits/expenseSplit.routes');
const reportRoutes = require('../modules/reports/report.routes');
const currencyRoutes = require('../modules/currency/currency.routes');

const router = express.Router();

const moduleRoutes = [
  { path: '/auth', route: authRoutes },
  { path: '/categories', route: categoryRoutes },
  { path: '/transactions', route: transactionRoutes },
  { path: '/budgets', route: budgetRoutes },
  { path: '/bills', route: billRoutes },
  { path: '/expense-splits', route: expenseSplitRoutes },
  { path: '/reports', route: reportRoutes },
  { path: '/currency', route: currencyRoutes },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

module.exports = router;
