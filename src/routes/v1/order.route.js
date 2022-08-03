const express = require('express');
// const validate = require('../../middlewares/validate');
// const authValidation = require('../../validations/auth.validation');
const orderController = require('../../controllers/order.controller');
const w3AuthMiddleware = require('../../middlewares/w3auth');

const router = express.Router();

router.get('/', w3AuthMiddleware.mandatoryAuth, orderController.getAllOrders);
router.get('/:order_id', w3AuthMiddleware.mandatoryAuth, orderController.getOrder);
router.get('/:order_id/thread', w3AuthMiddleware.mandatoryAuth, orderController.getOrderThread);

router.post('/:order_id/thread/upload', w3AuthMiddleware.mandatoryAuth, orderController.uploadThreadAttachment);
router.post('/:order_id/thread/:thread_id/assign', w3AuthMiddleware.mandatoryAuth, orderController.assignUserToThread);
router.post('/:order_id/thread/:thread_id', w3AuthMiddleware.mandatoryAuth, orderController.addChildThread);
router.post('/:order_id/thread', w3AuthMiddleware.mandatoryAuth, orderController.addOrderThread);



module.exports = router;
