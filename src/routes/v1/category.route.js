const express = require('express');
// const validate = require('../../middlewares/validate');
// const authValidation = require('../../validations/auth.validation');
const categoryController = require('../../controllers/category.controller');
const currencyMiddleware  = require('../../middlewares/currency');
const w3AuthMiddleware = require('../../middlewares/w3auth');

const router = express.Router();

router.get('/', w3AuthMiddleware.optionalAuth, currencyMiddleware.setCurrency, categoryController.getAllCategory);
router.get('/:id', w3AuthMiddleware.optionalAuth, currencyMiddleware.setCurrency, categoryController.getCategory);
router.get('/:id/service', w3AuthMiddleware.optionalAuth, currencyMiddleware.setCurrency, categoryController.getServicesByCategory);

module.exports = router;
 