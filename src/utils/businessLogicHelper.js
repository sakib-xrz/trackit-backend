const prisma = require('../config/prisma');

/**
 * Recalculate and update the user's budget spent for the month of given date
 */
const syncMonthlyBudgetSpent = async (txOrPrisma, user_id, dateObj) => {
  const client = txOrPrisma || prisma;
  const date = dateObj ? new Date(dateObj) : new Date();
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const monthKey = `${year}-${month}`;

  const startOfMonth = new Date(Date.UTC(year, date.getUTCMonth(), 1, 0, 0, 0));
  const endOfMonth = new Date(Date.UTC(year, date.getUTCMonth() + 1, 0, 23, 59, 59, 999));

  const expenseAgg = await client.transaction.aggregate({
    where: {
      user_id,
      type: 'EXPENSE',
      transaction_date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    _sum: {
      amount: true,
    },
  });

  const totalSpent = expenseAgg._sum.amount || 0;

  await client.budget.updateMany({
    where: { user_id, month: monthKey },
    data: { spent: totalSpent },
  });

  return Number(totalSpent);
};

/**
 * Intelligent category resolver based on title / description & subscription flag
 */
const resolveExpenseCategory = async (user_id, title = '', isSubscription = false) => {
  const lower = (title || '').toLowerCase();

  let targetCategoryName = 'Bills & Utilities';
  if (
    isSubscription ||
    lower.includes('netflix') ||
    lower.includes('spotify') ||
    lower.includes('subscription') ||
    lower.includes('prime') ||
    lower.includes('membership') ||
    lower.includes('gym')
  ) {
    targetCategoryName = 'Subscriptions';
  } else if (
    lower.includes('food') ||
    lower.includes('dinner') ||
    lower.includes('lunch') ||
    lower.includes('breakfast') ||
    lower.includes('restaurant') ||
    lower.includes('cafe') ||
    lower.includes('coffee') ||
    lower.includes('burger') ||
    lower.includes('pizza') ||
    lower.includes('meal') ||
    lower.includes('sushi')
  ) {
    targetCategoryName = 'Food & Dining';
  } else if (
    lower.includes('travel') ||
    lower.includes('trip') ||
    lower.includes('hotel') ||
    lower.includes('flight') ||
    lower.includes('air')
  ) {
    targetCategoryName = 'Travel';
  } else if (
    lower.includes('taxi') ||
    lower.includes('uber') ||
    lower.includes('bus') ||
    lower.includes('gas') ||
    lower.includes('fuel') ||
    lower.includes('ride') ||
    lower.includes('train') ||
    lower.includes('metro')
  ) {
    targetCategoryName = 'Transportation';
  } else if (
    lower.includes('shop') ||
    lower.includes('cloth') ||
    lower.includes('grocer') ||
    lower.includes('market') ||
    lower.includes('store')
  ) {
    targetCategoryName = 'Shopping';
  } else if (
    lower.includes('doctor') ||
    lower.includes('med') ||
    lower.includes('health') ||
    lower.includes('pharmacy') ||
    lower.includes('hospital')
  ) {
    targetCategoryName = 'Healthcare';
  } else if (
    lower.includes('course') ||
    lower.includes('book') ||
    lower.includes('school') ||
    lower.includes('tuition') ||
    lower.includes('college')
  ) {
    targetCategoryName = 'Education';
  } else if (
    lower.includes('movie') ||
    lower.includes('game') ||
    lower.includes('concert') ||
    lower.includes('ticket')
  ) {
    targetCategoryName = 'Entertainment';
  }

  // 1. Try to find the matching category for user or default
  let category = await prisma.category.findFirst({
    where: {
      name: targetCategoryName,
      type: 'EXPENSE',
      OR: [{ is_default: true }, { user_id }],
    },
  });

  // 2. Fallback to default Bills & Utilities
  if (!category) {
    category = await prisma.category.findFirst({
      where: {
        name: 'Bills & Utilities',
        type: 'EXPENSE',
      },
    });
  }

  // 3. Fallback to any default EXPENSE category
  if (!category) {
    category = await prisma.category.findFirst({
      where: {
        type: 'EXPENSE',
        OR: [{ is_default: true }, { user_id }],
      },
    });
  }

  return category;
};

/**
 * Strips internal technical tags like [BILL:uuid] or [SPLIT:uuid] from transaction notes
 */
const cleanTxNote = (tx) => {
  if (!tx) return tx;
  return {
    ...tx,
    amount: Number(tx.amount),
    note: tx.note ? tx.note.replace(/^\[(BILL|SPLIT):[^\]]+\]\s*/, '') : tx.note,
  };
};

module.exports = {
  syncMonthlyBudgetSpent,
  resolveExpenseCategory,
  cleanTxNote,
};

