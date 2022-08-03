const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

// Coupons Always applies in USD Format
const CouponSchema = mongoose.Schema(
    {
        code:{
            type: String, 
            required: true
        },
        valid_on:{
            type: String, 
            enum:['FIXED','SUBSCRIPTION'],
            default:'FIXED'
        },
        discount:{
            type:{
                type: String, 
                enum:['FIXED','PERCENTAGE'],
                required: true
            },
            value:{
                type: Number, // 2 Decimals in case of Fixed. i.e. 100 is $1
                required: true 
            }
        },
        payment_gateways:{
            stripe: mongoose.Schema.Types.Mixed,
            paypal: mongoose.Schema.Types.Mixed,
            razorpay: mongoose.Schema.Types.Mixed,
        }
    },
    {
        timestamps: true
    }
)

CouponSchema.plugin(toJSON)
CouponSchema.plugin(paginate)

const Coupon = mongoose.model('Coupon', CouponSchema)
module.exports = Coupon