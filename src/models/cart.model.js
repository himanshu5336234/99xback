const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const { SITES } = require("../constants");

const CartSchema = mongoose.Schema(
  {
    status:{
      type: String, 
      enum:['PENDING','COMPLETED'],
      default: 'PENDING'
    },
    site_id:{
      type: Number,
      enum: Object.values(SITES),
      default: SITES.X99_STARTUP
    },
    user_id:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    service:{
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Service'
    },
    site_id:{
      type: Number,
      enum: Object.values(SITES),
      default: SITES.X99_STARTUP
    },
    serviceQuantity:{
      type: Number, 
      default: 1
    },
    servicePlan:{
      type: String, 
      default:'Standard'
    },
    serviceObject:{
      type: String,
      get(data) {
        return JSON.parse(data);
      },
      set(data) {
        return JSON.stringify(data);
      },
    },
    items:[
      {
        microsServiceId:{
          type: mongoose.Schema.Types.ObjectId,
          ref: 'MicroService'        
        },
        items:[
            {
              key:{
                type: String, 
                required: true
              },
              quantity:{
                type: Number,
                required: true
              }
            }
        ]
      }
    ],
    coupon:{
      type: mongoose.Schema.Types.ObjectId, 
      ref:'Coupon'
    },
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
      }
    },
    order_id:{
      type:mongoose.Schema.Types.ObjectId,
      ref:'Order'
    },
    payment_id:{
      type: mongoose.Schema.Types.ObjectId,
      ref:'Payment'
    },
    starts_at:{
      type: Date,
      default: Date.now,
    },
    associated_cookie: {
        type: String, 
        // index: true, 
        // unique: true
    },
    // orderSubTotal: {
    //   type: Number,
    //   required: true,
    // },
    // orderAdditionalCharges: {
    //   type: String,
    //   get(data) {
    //     return JSON.parse(data);
    //   },
    //   set(data) {
    //     return JSON.stringify(data);
    //   },
    // },
    // orderTotal: {
    //   type: Number,
    //   required: true,
    // },
    // orderCurrency: {
    //   type: String,
    //   enum: ['USD', 'INR', 'CAD'],
    //   default: 'USD',
    // },
  },
  {
    timestamps: true,
  }
);

CartSchema.plugin(toJSON);
CartSchema.plugin(paginate);

CartSchema.pre('save', async function (next) {
  next();
});

/**
 * @typedef Cart
 */
const Cart = mongoose.model('Cart', CartSchema);

module.exports = Cart;
