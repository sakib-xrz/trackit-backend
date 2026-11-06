const httpStatus = require('http-status');
const prisma = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');

const calculateCurrentSpent = async (user_id, monthStr) => {
  const [year, month] = monthStr.split('-').map(Number);
  const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  const expenseAgg = await prisma.transaction.aggregate({
    where: {
      user_id,
      type: 'EXPENSE',
      transaction_date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    _sum: { amount: true },
  });

  return expenseAgg._sum.amount || 0;
};

// Create a budget: enforce only one budget per month
const createBudget = async (user_id, payload) => {
  const existing = await prisma.budget.findUnique({
    where: {
      user_id_month: {
        user_id,
        month: payload.month,
      },
    },
  });

  if (existing) {
    throw new ApiError(httpStatus.CONFLICT, `Budget for ${payload.month} has already been set. You can edit or delete the existing budget.`);
  }

  const currentSpent = await calculateCurrentSpent(user_id, payload.month);

  const created = await prisma.budget.create({
    data: {
      user_id,
      month: payload.month,
      amount: payload.amount,
      spent: currentSpent,
    },
  });

  const amountNum = Number(created.amount);
  const spentNum = Number(created.spent);
  const remaining = Number((amountNum - spentNum).toFixed(2));
  const usage_percentage = amountNum > 0 ? Number(((spentNum / amountNum) * 100).toFixed(2)) : 0;

  return {
    id: created.id,
    month: created.month,
    amount: amountNum,
    spent: spentNum,
    remaining,
    usage_percentage,
    is_exceeded: spentNum > amountNum,
    created_at: created.created_at,
    updated_at: created.updated_at,
  };
};

// Get list of all budgets for user
const getBudgets = async (user_id) => {
  const budgets = await prisma.budget.findMany({
    where: { user_id },
    orderBy: { month: 'desc' },
  });

  // Calculate real-time metrics for each budget
  const results = [];
  for (const b of budgets) {
    const currentSpent = await calculateCurrentSpent(user_id, b.month);
    const amountNum = Number(b.amount);
    const spentNum = Number(currentSpent);
    const remaining = Number((amountNum - spentNum).toFixed(2));
    const usage_percentage = amountNum > 0 ? Number(((spentNum / amountNum) * 100).toFixed(2)) : 0;

    results.push({
      id: b.id,
      month: b.month,
      amount: amountNum,
      spent: spentNum,
      remaining,
      usage_percentage,
      is_exceeded: spentNum > amountNum,
      created_at: b.created_at,
      updated_at: b.updated_at,
    });
  }

  return results;
};

// Update an existing budget
const updateBudget = async (user_id, budget_id, payload) => {
  const existing = await prisma.budget.findFirst({
    where: { id: budget_id, user_id },
  });

  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Budget not found');
  }

  const currentSpent = await calculateCurrentSpent(user_id, existing.month);

  const updated = await prisma.budget.update({
    where: { id: budget_id },
    data: {
      amount: payload.amount,
      spent: currentSpent,
    },
  });

  const amountNum = Number(updated.amount);
  const spentNum = Number(updated.spent);
  const remaining = Number((amountNum - spentNum).toFixed(2));
  const usage_percentage = amountNum > 0 ? Number(((spentNum / amountNum) * 100).toFixed(2)) : 0;

  return {
    id: updated.id,
    month: updated.month,
    amount: amountNum,
    spent: spentNum,
    remaining,
    usage_percentage,
    is_exceeded: spentNum > amountNum,
    created_at: updated.created_at,
    updated_at: updated.updated_at,
  };
};

// Delete a budget
const deleteBudget = async (user_id, budget_id) => {
  const existing = await prisma.budget.findFirst({
    where: { id: budget_id, user_id },
  });

  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Budget not found');
  }

  await prisma.budget.delete({
    where: { id: budget_id },
  });
};

const getBudgetReport = async (user_id, monthQuery) => {
  const now = new Date();
  const defaultMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const month = monthQuery || defaultMonth;

  const budget = await prisma.budget.findUnique({
    where: {
      user_id_month: {
        user_id,
        month,
      },
    },
  });

  if (!budget) {
    return {
      month,
      budget_set: false,
      amount: 0,
      spent: 0,
      remaining: 0,
      usage_percentage: 0,
      is_exceeded: false,
    };
  }

  const currentSpent = await calculateCurrentSpent(user_id, month);
  const amountNum = Number(budget.amount);
  const spentNum = Number(currentSpent);
  const remaining = Number((amountNum - spentNum).toFixed(2));
  const usage_percentage = amountNum > 0 ? Number(((spentNum / amountNum) * 100).toFixed(2)) : 0;

  return {
    id: budget.id,
    month: budget.month,
    budget_set: true,
    amount: amountNum,
    spent: spentNum,
    remaining,
    usage_percentage,
    is_exceeded: spentNum > amountNum,
  };
};

module.exports = {
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget,
  getBudgetReport,
};
