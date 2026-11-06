const httpStatus = require('http-status');
const prisma = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');
const {
  syncMonthlyBudgetSpent,
  resolveExpenseCategory,
} = require('../../utils/businessLogicHelper');

const addBill = async (user_id, payload) => {
  const isPaid = Boolean(payload.is_paid);
  const dueDate = new Date(payload.due_date);

  return await prisma.$transaction(async (tx) => {
    const bill = await tx.bill.create({
      data: {
        user_id,
        title: payload.title,
        amount: payload.amount,
        due_date: dueDate,
        repeat_interval: payload.repeat_interval || 'MONTHLY',
        is_subscription: Boolean(payload.is_subscription),
        is_paid: isPaid,
        reminder_days_left: payload.reminder_days_left ?? 3,
      },
    });

    if (isPaid) {
      const category = await resolveExpenseCategory(user_id, bill.title, bill.is_subscription);
      const user = await tx.user.findUnique({ where: { id: user_id }, select: { base_currency: true } });

      await tx.transaction.create({
        data: {
          user_id,
          category_id: category.id,
          type: 'EXPENSE',
          amount: bill.amount,
          currency: user?.base_currency || 'USD',
          transaction_date: dueDate,
          note: `[BILL:${bill.id}] Bill Payment: ${bill.title}`,
          is_recurring: bill.repeat_interval !== 'NONE',
        },
      });

      await syncMonthlyBudgetSpent(tx, user_id, dueDate);
    }

    return bill;
  });
};

const getBillsAndCalendar = async (user_id, query) => {
  const where = { user_id };

  if (query.is_paid !== undefined) {
    where.is_paid = query.is_paid === 'true';
  }
  if (query.is_subscription !== undefined) {
    where.is_subscription = query.is_subscription === 'true';
  }
  if (query.month) {
    const [year, month] = query.month.split('-').map(Number);
    const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    where.due_date = { gte: startOfMonth, lte: endOfMonth };
  }

  return await prisma.bill.findMany({
    where,
    orderBy: { due_date: 'asc' },
  });
};

const markBillAsPaid = async (user_id, bill_id) => {
  const existing = await prisma.bill.findFirst({
    where: { id: bill_id, user_id },
  });

  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Bill not found');
  }

  return await prisma.$transaction(async (tx) => {
    const updatedBill = await tx.bill.update({
      where: { id: bill_id },
      data: { is_paid: true },
    });

    // Check if an expense transaction was already recorded for this bill
    const existingTx = await tx.transaction.findFirst({
      where: {
        user_id,
        note: { contains: `[BILL:${bill_id}]` },
      },
    });

    const paymentDate = new Date();

    if (!existingTx) {
      const category = await resolveExpenseCategory(user_id, existing.title, existing.is_subscription);
      const user = await tx.user.findUnique({ where: { id: user_id }, select: { base_currency: true } });

      await tx.transaction.create({
        data: {
          user_id,
          category_id: category.id,
          type: 'EXPENSE',
          amount: existing.amount,
          currency: user?.base_currency || 'USD',
          transaction_date: paymentDate,
          note: `[BILL:${existing.id}] Bill Payment: ${existing.title}`,
          is_recurring: existing.repeat_interval !== 'NONE',
        },
      });

      await syncMonthlyBudgetSpent(tx, user_id, paymentDate);
    }

    return updatedBill;
  });
};

const updateBill = async (user_id, bill_id, payload) => {
  const existing = await prisma.bill.findFirst({
    where: { id: bill_id, user_id },
  });

  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Bill not found');
  }

  return await prisma.$transaction(async (tx) => {
    const updated = await tx.bill.update({
      where: { id: bill_id },
      data: {
        ...payload,
        due_date: payload.due_date ? new Date(payload.due_date) : undefined,
      },
    });

    // If an associated transaction exists, keep it in sync with updated amount/title
    const linkedTx = await tx.transaction.findFirst({
      where: {
        user_id,
        note: { contains: `[BILL:${bill_id}]` },
      },
    });

    if (linkedTx) {
      const newAmount = payload.amount !== undefined ? payload.amount : linkedTx.amount;
      const newTitle = payload.title || existing.title;
      await tx.transaction.update({
        where: { id: linkedTx.id },
        data: {
          amount: newAmount,
          note: `[BILL:${bill_id}] Bill Payment: ${newTitle}`,
        },
      });
      await syncMonthlyBudgetSpent(tx, user_id, new Date(linkedTx.transaction_date));
    }

    return updated;
  });
};

const deleteBill = async (user_id, bill_id) => {
  const existing = await prisma.bill.findFirst({
    where: { id: bill_id, user_id },
  });

  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Bill not found');
  }

  return await prisma.$transaction(async (tx) => {
    // If an associated transaction was recorded when paid, delete it and sync budget
    const linkedTx = await tx.transaction.findFirst({
      where: {
        user_id,
        note: { contains: `[BILL:${bill_id}]` },
      },
    });

    if (linkedTx) {
      await tx.transaction.delete({
        where: { id: linkedTx.id },
      });
      await syncMonthlyBudgetSpent(tx, user_id, new Date(linkedTx.transaction_date));
    }

    return await tx.bill.delete({
      where: { id: bill_id },
    });
  });
};

// Subscription Detector: scans recurring expenses or repeated identical transaction notes/amounts
const detectSubscriptions = async (user_id) => {
  const expenses = await prisma.transaction.findMany({
    where: {
      user_id,
      type: 'EXPENSE',
    },
    orderBy: { transaction_date: 'desc' },
    take: 200,
  });

  const groups = {};
  for (const tx of expenses) {
    const rawNote = (tx.note || 'unnamed').replace(/^\[(BILL|SPLIT):[^\]]+\]\s*/, '').trim().toLowerCase();
    const key = `${rawNote}_${Number(tx.amount).toFixed(2)}`;
    if (!groups[key]) {
      groups[key] = {
        title: tx.note ? tx.note.replace(/^\[(BILL|SPLIT):[^\]]+\]\s*/, '').trim() : 'Recurring Expense',
        amount: Number(tx.amount),
        currency: tx.currency,
        occurrences: 0,
        last_transaction_date: tx.transaction_date,
        is_flagged_recurring: tx.is_recurring,
      };
    }
    groups[key].occurrences += 1;
  }

  const detected = Object.values(groups).filter(
    (item) => (item.occurrences >= 2 && item.title !== 'Recurring Expense') || item.is_flagged_recurring
  );

  return detected;
};

// Upcoming Bill Reminders & Alerts
const getUpcomingReminders = async (user_id) => {
  const now = new Date();
  const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const upcomingBills = await prisma.bill.findMany({
    where: {
      user_id,
      is_paid: false,
      due_date: {
        gte: now,
        lte: next7Days,
      },
    },
    orderBy: { due_date: 'asc' },
  });

  return upcomingBills.map((bill) => {
    const diffDays = Math.ceil((new Date(bill.due_date) - now) / (1000 * 60 * 60 * 24));
    return {
      ...bill,
      amount: Number(bill.amount),
      days_until_due: diffDays,
      alert_message: `Your bill "${bill.title}" of ${bill.amount} is due in ${diffDays} day(s).`,
    };
  });
};

module.exports = {
  addBill,
  getBillsAndCalendar,
  markBillAsPaid,
  updateBill,
  deleteBill,
  detectSubscriptions,
  getUpcomingReminders,
};
