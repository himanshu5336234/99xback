const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const orderThreadChildSchema = mongoose.Schema(
  {
    orderId:{
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Order',
    },
    orderThreadId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'OrderThread',
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
        'meeting',
        'user-add',
        'timeline'
      ]
    },
    title:{
      type: String,
    },
    icon:{
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

orderThreadChildSchema.plugin(toJSON);
orderThreadChildSchema.plugin(paginate);

orderThreadChildSchema.pre('save', async function (next) {
  next();
});

/**
 * @typedef Order
 */
const Order = mongoose.model('OrderThreadChild', orderThreadChildSchema);

module.exports = Order;
