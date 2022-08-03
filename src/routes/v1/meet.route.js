const express = require('express');
// const validate = require('../../middlewares/validate');
// const authValidation = require('../../validations/auth.validation');
const meetController = require('../../controllers/meet.controller');
const w3AuthMiddleware = require('../../middlewares/w3auth');

const router = express.Router();

router.get('/:id', w3AuthMiddleware.mandatoryAuth, meetController.verifyCaller);

// const jwt = require('jsonwebtoken');

// router.post('/pay', w3AuthMiddleware, checkoutController.payAtCheckout);

module.exports = router;
