const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const userPayoutSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
    currency:{
      type: String, 
      enum:['USD','EUR','GBP','AUD','CAD','INR','ILS','BRL','HKD','SEK','NZD','SGD','CHF','ZAR','CNY','MYR','MXN','PKR','PHP','TWD','TRY','AED'],
      defaultValue: 'USD'
    }
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
userPayoutSchema.plugin(toJSON);

/**
 * @typedef UserPayout
 */
const UserPayout = mongoose.model('UserPayout', userPayoutSchema);

module.exports = UserPayout;
