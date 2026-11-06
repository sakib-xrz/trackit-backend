const express = require('express');
const auth = require('../../middlewares/auth');
const validateRequest = require('../../middlewares/validateRequest');
const CategoryValidation = require('./category.validation');
const CategoryController = require('./category.controller');

const router = express.Router();

router.get('/', auth('USER', 'GUEST'), CategoryController.getCategories);
router.post('/', auth('USER', 'GUEST'), validateRequest(CategoryValidation.createCategorySchema), CategoryController.createCategory);
router.patch('/:id', auth('USER', 'GUEST'), validateRequest(CategoryValidation.updateCategorySchema), CategoryController.updateCategory);
router.delete('/:id', auth('USER', 'GUEST'), CategoryController.deleteCategory);

module.exports = router;
