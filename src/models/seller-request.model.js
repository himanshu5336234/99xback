const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const sellerRequestSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
    serviceId:{
        type: mongoose.SchemaType.ObjectId, 
        ref:'Service',
        required: true
    },
    status:{
        type: Number, 
        default: 1
    }
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
sellerRequestSchema.plugin(toJSON);

/**
 * @typedef SellerRequest
 */
const SellerRequest = mongoose.model('SellerRequest', sellerRequestSchema);

module.exports = SellerRequest;
