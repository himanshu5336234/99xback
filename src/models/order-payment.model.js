const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const orderPaymentSchema = mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Order',
    },
    type:{
      type: String, 
      enum:[
        'update',
        'kv',
        'text',
        'small-text',
        'task',
        'revision',
        'meeting'
      ]
    },
    title:{
      type: String,
    },
    message: {
      type: String,
      get(data) {
        return JSON.parse(data);
      },
      set(data) {
        return JSON.stringify(data);
      },
    },
    senderUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    IsRead: {
      type: Boolean,
      defaultValue: false,
    },
    IsFromSite:{
      type: Boolean, 
      default: false
    },
    is_archived:{
      type: Boolean, 
      default: false,
    },
    is_deleted:{
      type: Boolean, 
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: {
      getters: true
    }
  }
);

orderPaymentSchema.plugin(toJSON);
orderPaymentSchema.plugin(paginate);

orderPaymentSchema.pre('save', async function (next) {
  next();
});

/**
 * @typedef OrderPayment
 */
const OrderPayment = mongoose.model('OrderPayment', orderPaymentSchema);

module.exports = OrderPayment;
