const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const MediaSchema = mongoose.Schema(
  {
    uploaded_by:{
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    },
    type: {
      type: String, 
      enum:['image/bmp','image/gif','image/jpeg','image/png','image/jpg'],
      required: true, 
    },
    optimized_url: {
        type: String
    },
    url: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

MediaSchema.plugin(toJSON);
MediaSchema.plugin(paginate);

MediaSchema.pre('save', async function (next) {
  next();
});

/**
 * @typedef Media
 */
const Media = mongoose.model('Media', MediaSchema);

module.exports = Media;
