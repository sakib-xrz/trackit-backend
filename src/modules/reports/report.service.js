const prisma = require('../../config/prisma');

const getDashboardSummary = async (user_id, monthQuery) => {
  const now = new Date();
  const defaultMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const month = monthQuery || defaultMonth;
  const [yearNum, monthNum] = month.split('-').map(Number);

  const startOfMonth = new Date(Date.UTC(yearNum, monthNum - 1, 1, 0, 0, 0));
  const endOfMonth = new Date(Date.UTC(yearNum, monthNum, 0, 23, 59, 59, 999));

  const [incomeAgg, expenseAgg, budget, categoryBreakdown] = await Promise.all([
    prisma.transaction.aggregate({
      where: { user_id, type: 'INCOME', transaction_date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { user_id, type: 'EXPENSE', transaction_date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
    prisma.budget.findUnique({
      where: { user_id_month: { user_id, month } },
    }),
    prisma.transaction.groupBy({
      by: ['category_id'],
      where: { user_id, type: 'EXPENSE', transaction_date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
  ]);

  const categories = await prisma.category.findMany({
    where: { id: { in: categoryBreakdown.map((c) => c.category_id) } },
  });

  const categoryMap = {};
  for (const c of categories) {
    categoryMap[c.id] = c;
  }

  const formattedBreakdown = categoryBreakdown.map((item) => ({
    category_id: item.category_id,
    category_name: categoryMap[item.category_id]?.name || 'Unknown',
    icon: categoryMap[item.category_id]?.icon || 'ic_default',
    total_amount: Number(item._sum.amount || 0),
  }));

  const total_income = Number(incomeAgg._sum.amount || 0);
  const total_expense = Number(expenseAgg._sum.amount || 0);
  const net_balance = Number((total_income - total_expense).toFixed(2));

  // Sync stored budget spent if it diverged
  if (budget && Number(budget.spent) !== total_expense) {
    prisma.budget
      .update({
        where: { id: budget.id },
        data: { spent: total_expense },
      })
      .catch(() => {});
  }

  return {
    month,
    total_income,
    total_expense,
    net_balance,
    budget: budget
      ? {
          amount: Number(budget.amount),
          spent: total_expense,
          remaining: Number((Number(budget.amount) - total_expense).toFixed(2)),
        }
      : null,
    expense_by_category: formattedBreakdown,
  };
};

// Generates Daily Spending Heatmap data with intensity levels (0-4) for a month
const getSpendingHeatmap = async (user_id, monthQuery) => {
  const now = new Date();
  const defaultMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const month = monthQuery || defaultMonth;
  const [yearNum, monthNum] = month.split('-').map(Number);

  const startOfMonth = new Date(Date.UTC(yearNum, monthNum - 1, 1, 0, 0, 0));
  const endOfMonth = new Date(Date.UTC(yearNum, monthNum, 0, 23, 59, 59, 999));
  const daysInMonth = endOfMonth.getUTCDate();

  const expenses = await prisma.transaction.findMany({
    where: {
      user_id,
      type: 'EXPENSE',
      transaction_date: { gte: startOfMonth, lte: endOfMonth },
    },
    select: {
      amount: true,
      transaction_date: true,
    },
  });

  const dailyTotals = {};
  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = `${month}-${String(d).padStart(2, '0')}`;
    dailyTotals[dayStr] = { date: dayStr, total_spent: 0, transaction_count: 0 };
  }

  let maxDailySpent = 0;
  for (const exp of expenses) {
    const dStr = new Date(exp.transaction_date).toISOString().split('T')[0];
    if (dailyTotals[dStr]) {
      dailyTotals[dStr].total_spent = Number((dailyTotals[dStr].total_spent + Number(exp.amount)).toFixed(2));
      dailyTotals[dStr].transaction_count += 1;
      if (dailyTotals[dStr].total_spent > maxDailySpent) {
        maxDailySpent = dailyTotals[dStr].total_spent;
      }
    }
  }

  const heatmap = Object.values(dailyTotals).map((entry) => {
    let intensity_level = 0; // 0 = No spend, 1 = Low, 2 = Medium, 3 = High, 4 = Peak
    if (entry.total_spent > 0 && maxDailySpent > 0) {
      const ratio = entry.total_spent / maxDailySpent;
      if (ratio <= 0.25) intensity_level = 1;
      else if (ratio <= 0.5) intensity_level = 2;
      else if (ratio <= 0.75) intensity_level = 3;
      else intensity_level = 4;
    }
    return {
      ...entry,
      intensity_level,
    };
  });

  return {
    month,
    max_daily_spent: maxDailySpent,
    heatmap,
  };
};

module.exports = {
  getDashboardSummary,
  getSpendingHeatmap,
};
