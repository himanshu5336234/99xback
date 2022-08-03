
const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const { SITES } = require("../constants");

const PaymentSchema = mongoose.Schema(
  {
    site_id:{
      type: Number,
      enum: Object.values(SITES),
      default: SITES.X99_STARTUP
    },
    user_id:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    cart_id: {
      type: mongoose.Schema.Types.ObjectId, 
      ref:'Cart'
    },
    type:{
      type: String, 
      enum:['FIXED','SUBSCRIPTION'],
      default: 'FIXED'
    },
    method:{
      type: String,
      enum:['STRIPE','RAZORPAY','PAYPAL'],
      required: true
    },
    data:{
      type: mongoose.Schema.Types.Mixed,
      // required: true
    },
    associated_cookie: {
        type: String, 
    }
  },
  {
    timestamps: true,
  }
);

PaymentSchema.plugin(toJSON);
PaymentSchema.plugin(paginate);

PaymentSchema.pre('save', async function (next) {
  next();
});

/**
 * @typedef Payment
 */
const Payment = mongoose.model('Payment', PaymentSchema);

module.exports = Payment;
