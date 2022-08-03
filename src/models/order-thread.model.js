const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const orderThreadSchema = mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Order',
    },
    status:{
      type: String, 
      enum:[
        
        'NA',

        // For Tasks
        'TASK_CREATED',
        'TASK_IN_QUEUE',
        'TASK_IN_PROGESS',
        'TASK_DUE',
        'TASK_SUBMITTED',
        'TASK_IN_REVISION',
        'TASK_COMPLETED', 
        'TASK_CANCELLED'
      ],
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
        'user-add'
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
    childThreads: [
      {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'OrderThreadChild',
      }
    ],
    assignedTo:[
      {
        type: mongoose.Schema.Types.ObjectId,
        ref:'User'
      }
    ],
    senderUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    DueDate:{
      type: Date,
    },
    DateCompleted:{
      type: Date
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

orderThreadSchema.plugin(toJSON);
orderThreadSchema.plugin(paginate);

orderThreadSchema.pre('save', async function (next) {

  const orderThread = this;

  if(orderThread.type == "task"){
    if(!orderThread.status) orderThread.status = "TASK_CREATED"
  }

  next();
});

/**
 * @typedef Order
 */
const Order = mongoose.model('OrderThread', orderThreadSchema);

module.exports = Order;
