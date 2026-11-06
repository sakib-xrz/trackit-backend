const httpStatus = require('http-status');
const prisma = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');
const { calculatePagination } = require('../../utils/pagination');
const {
  syncMonthlyBudgetSpent,
  cleanTxNote,
} = require('../../utils/businessLogicHelper');

const addTransaction = async (user_id, payload) => {
  const category = await prisma.category.findFirst({
    where: {
      id: payload.category_id,
      OR: [{ is_default: true }, { user_id }],
    },
  });

  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
  }

  const txDate = payload.transaction_date ? new Date(payload.transaction_date) : new Date();

  return await prisma.$transaction(async (tx) => {
    let currency = payload.currency;
    if (!currency) {
      const user = await tx.user.findUnique({
        where: { id: user_id },
        select: { base_currency: true },
      });
      currency = user?.base_currency || 'USD';
    }

    const created = await tx.transaction.create({
      data: {
        user_id,
        category_id: payload.category_id,
        type: payload.type,
        amount: payload.amount,
        currency,
        transaction_date: txDate,
        note: payload.note || null,
        is_recurring: Boolean(payload.is_recurring),
      },
      include: {
        category: true,
      },
    });

    if (payload.type === 'EXPENSE') {
      await syncMonthlyBudgetSpent(tx, user_id, txDate);
    }

    return cleanTxNote(created);
  });
};

const getTransactions = async (user_id, filters, paginationOptions) => {
  const { page, limit, skip, sort_by, sort_order } = calculatePagination(paginationOptions);

  const where = { user_id };

  if (filters.type) {
    where.type = filters.type;
  }
  if (filters.category_id) {
    where.category_id = filters.category_id;
  }
  if (filters.start_date || filters.end_date) {
    where.transaction_date = {};
    if (filters.start_date) where.transaction_date.gte = new Date(filters.start_date);
    if (filters.end_date) where.transaction_date.lte = new Date(filters.end_date);
  }

  const [data, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { category: true },
      orderBy: { [sort_by]: sort_order },
      skip,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
    data: data.map(cleanTxNote),
  };
};

const updateTransaction = async (user_id, transaction_id, payload) => {
  const existing = await prisma.transaction.findFirst({
    where: { id: transaction_id, user_id },
  });

  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Transaction not found');
  }

  return await prisma.$transaction(async (tx) => {
    const updated = await tx.transaction.update({
      where: { id: transaction_id },
      data: {
        ...payload,
        transaction_date: payload.transaction_date ? new Date(payload.transaction_date) : undefined,
      },
      include: { category: true },
    });

    await syncMonthlyBudgetSpent(tx, user_id, new Date(existing.transaction_date));
    if (payload.transaction_date) {
      await syncMonthlyBudgetSpent(tx, user_id, new Date(payload.transaction_date));
    }

    return cleanTxNote(updated);
  });
};

const deleteTransaction = async (user_id, transaction_id) => {
  const existing = await prisma.transaction.findFirst({
    where: { id: transaction_id, user_id },
  });

  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Transaction not found');
  }

  return await prisma.$transaction(async (tx) => {
    await tx.transaction.delete({
      where: { id: transaction_id },
    });

    if (existing.type === 'EXPENSE') {
      await syncMonthlyBudgetSpent(tx, user_id, new Date(existing.transaction_date));
    }
  });
};

module.exports = {
  addTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
};
