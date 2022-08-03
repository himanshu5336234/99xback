const catchAsync = require("../../utils/catchAsync");
const model  = require('../../models');

const addCoupon = catchAsync(async(req, res)=>{
    
    let payload = req.body;
    let {code, value} = payload;

    let c = await model.Coupon.create({
        code: code.toUpperCase(),
        discount:{
            type: 'FIXED',
            value: parseInt(value)
        }
    })

    return res.json({
        success: true, 
        coupon: c
    })

})

module.exports = {
    addCoupon
}