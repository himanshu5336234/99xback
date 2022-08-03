/* eslint-disable camelcase */
const express = require('express');
// const validate = require('../../middlewares/validate');
// const authValidation = require('../../validations/auth.validation');
// const authController = require('../../controllers/auth.controller');
const { Admin_ServiceController } = require('../../../controllers');

const router = express.Router();

router.get('/', Admin_ServiceController.getAllService);
router.get('/:id', Admin_ServiceController.getService);

router.post('/', Admin_ServiceController.createService);

module.exports = router;
