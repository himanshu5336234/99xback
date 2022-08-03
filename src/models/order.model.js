const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const { SITES } = require("../constants");

const orderSchema = mongoose.Schema(
  {
    site_id:{
      type: Number,
      enum: Object.values(SITES),
      default: SITES.X99_STARTUP
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    team:{
      id: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'UserTeam'
      },
      members:[
        {
          type: mongoose.Schema.Types.ObjectId, 
          ref: 'User'
        }
      ]
    },
    sellers:[
      {
        type: mongoose.Schema.Types.ObjectId,
        ref:'User'
      }
    ],
    cart_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Cart',
      index: true,
      unique: true,
    },
    payment_id:{
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Payment',
    },
    total_hours:{
      type: Number, 
      default: 0
    },
    remaining_hours:{
      type: Number, 
      default: 0,
    },
    order_type:{
      type: String, 
      enum:['FIXED','SUBSCRIPTION'],
      default:'FIXED'
    },
    next_due_date:{
      type: Date, 
      default: Date.now
    },
    order_status:{
      type: String,
      enum:['PAID','UNPAID','CANCELLED'],
      default: 'PAID'
    },
    order_current_timeline:{
      type: String,
      enum:['ORDER_PLACED', 'REQUIREMENT_SUBMITTED', 'IN_PROGRESS', 'IN_PROGRESS_REVISION', 'REVIEW', 'COMPLETE'],
      default:'ORDER_PLACED'
    }
  },
  {
    timestamps: true,
  }
);

orderSchema.plugin(toJSON);
orderSchema.plugin(paginate);

orderSchema.pre('save', async function (next) {
  next();
});

/**
 * @typedef Order
 */
const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
