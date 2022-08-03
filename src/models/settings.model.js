const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const SettingSchema = mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

SettingSchema.plugin(toJSON);
SettingSchema.plugin(paginate);

SettingSchema.pre('save', async function (next) {
  next();
});

/**
 * @typedef Setting
 */
const Setting = mongoose.model('Setting', SettingSchema);

module.exports = Setting;
