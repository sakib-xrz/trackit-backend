const httpStatus = require('http-status');
const prisma = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');
const {
  syncMonthlyBudgetSpent,
  resolveExpenseCategory,
} = require('../../utils/businessLogicHelper');

const createSplit = async (creator_id, payload) => {
  return await prisma.$transaction(async (tx) => {
    const split = await tx.expenseSplit.create({
      data: {
        creator_id,
        title: payload.title,
        total_amount: payload.total_amount,
        currency: payload.currency || 'USD',
        note: payload.note || null,
        participants: {
          create: payload.participants.map((p) => ({
            user_id: p.user_id || null,
            participant_name: p.participant_name,
            participant_email: p.participant_email || null,
            share_amount: p.share_amount,
          })),
        },
      },
      include: {
        participants: true,
      },
    });

    // Determine creator's personal share of this expense
    let creatorShare = 0;
    const creatorParticipant = payload.participants.find((p) => {
      const name = (p.participant_name || '').toLowerCase();
      return (
        p.user_id === creator_id ||
        name.includes('me') ||
        name.includes('creator') ||
        name.includes('myself')
      );
    });

    if (creatorParticipant) {
      creatorShare = Number(creatorParticipant.share_amount);
    } else if (payload.participants.length > 0) {
      creatorShare = Number(payload.total_amount) / payload.participants.length;
    } else {
      creatorShare = Number(payload.total_amount);
    }

    // Record the creator's personal share as an EXPENSE transaction
    if (creatorShare > 0) {
      const category = await resolveExpenseCategory(creator_id, payload.title, false);
      const user = await tx.user.findUnique({
        where: { id: creator_id },
        select: { base_currency: true },
      });

      const txDate = new Date();
      await tx.transaction.create({
        data: {
          user_id: creator_id,
          category_id: category.id,
          type: 'EXPENSE',
          amount: creatorShare,
          currency: payload.currency || user?.base_currency || 'USD',
          transaction_date: txDate,
          note: `[SPLIT:${split.id}] Shared Expense: ${payload.title} (My Share)`,
          is_recurring: false,
        },
      });

      await syncMonthlyBudgetSpent(tx, creator_id, txDate);
    }

    return split;
  });
};

const getSplits = async (user_id) => {
  return await prisma.expenseSplit.findMany({
    where: { creator_id: user_id },
    include: {
      participants: true,
    },
    orderBy: { created_date: 'desc' },
  });
};

const addParticipant = async (creator_id, split_id, payload) => {
  const split = await prisma.expenseSplit.findFirst({
    where: { id: split_id, creator_id },
  });

  if (!split) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Expense split record not found');
  }

  return await prisma.expenseSplitParticipant.create({
    data: {
      split_id,
      user_id: payload.user_id || null,
      participant_name: payload.participant_name,
      participant_email: payload.participant_email || null,
      share_amount: payload.share_amount,
    },
  });
};

const settleParticipantShare = async (creator_id, split_id, participant_id) => {
  const split = await prisma.expenseSplit.findFirst({
    where: { id: split_id, creator_id },
  });

  if (!split) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Expense split record not found');
  }

  return await prisma.$transaction(async (tx) => {
    const updatedParticipant = await tx.expenseSplitParticipant.update({
      where: { id: participant_id },
      data: {
        is_settled: true,
        settled_at: new Date(),
      },
    });

    const unsettledCount = await tx.expenseSplitParticipant.count({
      where: { split_id, is_settled: false },
    });

    if (unsettledCount === 0) {
      await tx.expenseSplit.update({
        where: { id: split_id },
        data: { is_settled: true },
      });
    }

    return updatedParticipant;
  });
};

const settleEntireSplit = async (creator_id, split_id) => {
  const split = await prisma.expenseSplit.findFirst({
    where: { id: split_id, creator_id },
  });

  if (!split) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Expense split record not found');
  }

  return await prisma.$transaction(async (tx) => {
    await tx.expenseSplitParticipant.updateMany({
      where: { split_id },
      data: { is_settled: true, settled_at: new Date() },
    });

    return await tx.expenseSplit.update({
      where: { id: split_id },
      data: { is_settled: true },
      include: { participants: true },
    });
  });
};

const deleteSplit = async (creator_id, split_id) => {
  const split = await prisma.expenseSplit.findFirst({
    where: { id: split_id, creator_id },
  });

  if (!split) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Expense split record not found');
  }

  return await prisma.$transaction(async (tx) => {
    // Delete any linked expense transaction and sync budget
    const linkedTx = await tx.transaction.findFirst({
      where: {
        user_id: creator_id,
        note: { contains: `[SPLIT:${split_id}]` },
      },
    });

    if (linkedTx) {
      await tx.transaction.delete({
        where: { id: linkedTx.id },
      });
      await syncMonthlyBudgetSpent(tx, creator_id, new Date(linkedTx.transaction_date));
    }

    await tx.expenseSplitParticipant.deleteMany({
      where: { split_id },
    });

    return await tx.expenseSplit.delete({
      where: { id: split_id },
    });
  });
};

module.exports = {
  createSplit,
  getSplits,
  addParticipant,
  settleParticipantShare,
  settleEntireSplit,
  deleteSplit,
};
