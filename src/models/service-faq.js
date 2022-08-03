const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const ServiceFaqSchema = mongoose.Schema(
  {
    service: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Service',
    },
    question: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

ServiceFaqSchema.plugin(toJSON);
ServiceFaqSchema.plugin(paginate);

ServiceFaqSchema.pre('save', async function (next) {
  next();
});

/**
 * @typedef ServiceFaq
 */
const ServiceFaq = mongoose.model('ServiceFaq', ServiceFaqSchema);

module.exports = ServiceFaq;
