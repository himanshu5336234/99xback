const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');


const GuestUserSchema = mongoose.Schema(
  {
    ip_addr:{
        type: String,
    },
    user_id:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
  },
  {
    timestamps: true,
  }
);

GuestUserSchema.plugin(toJSON);
GuestUserSchema.plugin(paginate);

GuestUserSchema.pre('save', async function (next) {
  next();
});

/**
 * @typedef GuestUser
 */
const GuestUser = mongoose.model('GuestUser', GuestUserSchema);

module.exports = GuestUser;
