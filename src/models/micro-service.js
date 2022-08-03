const mongoose = require('mongoose');

const { Schema } = mongoose;
const { toJSON, paginate } = require('./plugins');

const microServiceSchema = mongoose.Schema(
  {
    parentService: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
    },
    serviceCategory:{
      type: String,
      enum:['Standard','Premium','Enterprise'],
      default: 'Standard',
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subTitle:{
      type: String, 
      trim: true,
    },
    longTitle:{
      type: String, 
      trim: true
    },
    slug: {
      type: String,
      trim: true,
    },
    softwares: [{
      type: String,
      required: true,
    }],
    price:{
      isCurrencyPrefix:{
        type: Boolean, 
        default: true,
      },
      currencySymbol:{
        type: String, 
        required: true,
        default:'$'
      },
      currency:{
        type: String, 
        required: true,
        default:'USD'
      },
      amount:{
        type: Number, 
        required: true, 
        default: 100
      },
      unit:{
        type: String,
        required: true,
        default:'Per Unit' 
      }
    },
    deliveryTime:{
      unit:{
        type: String, 
        default:'day'
      },
      value:{
        type: Number, 
        default: 1
      }
    },
    max_order: {
      type: Number,
      default: 0, // For Unlimited : -1
    },
    active_orders: {
      type: Number,
      default: 0,
    },
    items: [
      {
        type: String,
      },
    ],
    paymentMeta:{
      stripe:{
        type: Object,
        index: true
      },
      paypal:{
        type: Object,
        index: true
      },
      razorpay:{
        type: Object,
        index: true
      }
    }
  },
  {
    timestamps: true,
  }
);

microServiceSchema.plugin(toJSON);
microServiceSchema.plugin(paginate);

microServiceSchema.pre('save', async function (next) {
  next();
});

/**
 * @typedef Service
 */
const MicroService = mongoose.model('microservice', microServiceSchema);

module.exports = MicroService