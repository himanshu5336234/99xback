const express = require('express');
// const validate = require('../../middlewares/validate');
// const authValidation = require('../../validations/auth.validation');
// const authController = require('../../controllers/auth.controller');
const serviceController = require('../../controllers/service.controller');
const currencyMiddleware  = require('../../middlewares/currency');
const w3AuthMiddleware = require('../../middlewares/w3auth');

const router = express.Router();

router.get('/', w3AuthMiddleware.optionalAuth,  currencyMiddleware.setCurrency, serviceController.getAllService);
router.get('/:id', w3AuthMiddleware.optionalAuth, currencyMiddleware.setCurrency,  serviceController.getService);
router.get('/id/:id', w3AuthMiddleware.optionalAuth,  currencyMiddleware.setCurrency, serviceController.getServiceById)

module.exports = router;
