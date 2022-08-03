const express = require('express');
// const validate = require('../../middlewares/validate');
// const authValidation = require('../../validations/auth.validation');
const checkoutController = require('../../controllers/checkout.controller/index');
const w3AuthMiddleware = require('../../middlewares/w3auth');
const currencyMiddleware  = require('../../middlewares/currency');

const router = express.Router();

router.get('/', w3AuthMiddleware.mandatoryAuth, currencyMiddleware.setCurrency, checkoutController.getCart);
router.put('/', w3AuthMiddleware.mandatoryAuth, checkoutController.editCart);
router.post('/', w3AuthMiddleware.mandatoryAuth, checkoutController.addToCart);

router.post('/pay', w3AuthMiddleware.mandatoryAuth, currencyMiddleware.setCurrency, checkoutController.payAtCheckout);

router.post('/subscribe/stripe', w3AuthMiddleware.mandatoryAuth, checkoutController.StripeSubscribe)
router.post('/subscribe/paypal', w3AuthMiddleware.mandatoryAuth, checkoutController.PaypalSubscribe)
router.post('/subscribe/rp', w3AuthMiddleware.mandatoryAuth, checkoutController.RazorpaySubscribe)

module.exports = router;
