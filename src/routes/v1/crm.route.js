const express = require('express');
const CrmController = require("../../controllers/crm.controller")

const router = express.Router()

router.post('/demo', CrmController.GetDemo)
router.post('/new-lead', CrmController.SaveLead)

module.exports = router