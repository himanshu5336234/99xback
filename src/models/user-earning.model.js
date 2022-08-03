const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const userEarningSchema = mongoose.Schema(
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
    },
    operation:{
      type: String, 
      enum: ['deposit', 'withdrawal', 'transfer', 'fee']
    },
    balance:{
      in_review:{
        type: Number, 
        default: 0,
      },
      pending:{
        type: Number, 
        default: 0
      },
      available:{
        type: Number,
        default: 0
      }
    },
    amount:{
      in_review:{
        type: Number, 
        default: 0,
      },
      pending:{
        type: Number, 
        default: 0
      },
      available:{
        type: Number,
        default: 0
      }
    },
    reference:{
      type: mongoose.Schema.Types.Mixed,
      required: true
    }
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
userEarningSchema.plugin(toJSON);

/**
 * @typedef UserConfig
 */
const UserConfig = mongoose.model('UserEarning', userEarningSchema);

module.exports = UserConfig;
