const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const QuestionSchema = mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum:["STRING","RANGE","ATTACHMENT"]
    },
    question: {
      type: String,
      required: true,
    },
    meta:{
        type: String, 
        required: true,
    }
  },
  {
    timestamps: true,
  }
);

QuestionSchema.plugin(toJSON);
QuestionSchema.plugin(paginate);

QuestionSchema.pre('save', async function (next) {
  next();
});

/**
 * @typedef Question
 */
const Question = mongoose.model('Question', QuestionSchema);

module.exports = Question;
