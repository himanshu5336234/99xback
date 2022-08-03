const express = require('express');
const currencyMiddleware = require('../../middlewares/currency');

const router = express.Router();

router.get('/', currencyMiddleware.setCurrency, async(req, res)=>{

    return res.json({
        currency: req.currency
    });

});

module.exports = router;
