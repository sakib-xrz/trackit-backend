const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const sendResponse = require('../../utils/sendResponse');
const CategoryService = require('./category.service');

const createCategory = catchAsync(async (req, res) => {
  const result = await CategoryService.createCategory(req.user.user_id, req.body);
  sendResponse(res, {
    status_code: httpStatus.CREATED,
    success: true,
    message: 'Category created successfully',
    data: result,
  });
});

const getCategories = catchAsync(async (req, res) => {
  const result = await CategoryService.getCategories(req.user.user_id, req.query);
  sendResponse(res, {
    status_code: httpStatus.OK,
    success: true,
    message: 'Categories retrieved successfully',
    data: result,
  });
});

const updateCategory = catchAsync(async (req, res) => {
  const result = await CategoryService.updateCategory(req.user.user_id, req.params.id, req.body);
  sendResponse(res, {
    status_code: httpStatus.OK,
    success: true,
    message: 'Category updated successfully',
    data: result,
  });
});

const deleteCategory = catchAsync(async (req, res) => {
  await CategoryService.deleteCategory(req.user.user_id, req.params.id);
  sendResponse(res, {
    status_code: httpStatus.OK,
    success: true,
    message: 'Category deleted successfully',
    data: null,
  });
});

module.exports = {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
};
