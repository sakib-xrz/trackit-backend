const httpStatus = require('http-status');
const prisma = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');

const createCategory = async (user_id, payload) => {
  const trimmedName = payload.name.trim();

  const existing = await prisma.category.findFirst({
    where: {
      name: trimmedName,
      type: payload.type,
      OR: [{ is_default: true }, { user_id }],
    },
  });

  if (existing) {
    throw new ApiError(httpStatus.CONFLICT, `Category '${trimmedName}' already exists.`);
  }

  return await prisma.category.create({
    data: {
      user_id,
      name: trimmedName,
      type: payload.type,
      icon: payload.icon || 'ic_default',
      is_default: false,
    },
  });
};

const getCategories = async (user_id, query) => {
  const where = {
    OR: [{ is_default: true }, { user_id }],
  };

  if (query.type) {
    where.type = query.type;
  }

  return await prisma.category.findMany({
    where,
    orderBy: [{ is_default: 'desc' }, { name: 'asc' }],
  });
};

const updateCategory = async (user_id, category_id, payload) => {
  const existing = await prisma.category.findFirst({
    where: { id: category_id, user_id, is_default: false },
  });

  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Custom category not found or cannot modify system default category');
  }

  return await prisma.category.update({
    where: { id: category_id },
    data: payload,
  });
};

const deleteCategory = async (user_id, category_id) => {
  const existing = await prisma.category.findFirst({
    where: { id: category_id, user_id, is_default: false },
  });

  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Custom category not found or cannot delete system default category');
  }

  const txCount = await prisma.transaction.count({
    where: { category_id },
  });

  if (txCount > 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Cannot delete category because ${txCount} transaction(s) are linked to it.`);
  }

  return await prisma.category.delete({
    where: { id: category_id },
  });
};

module.exports = {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
};
