const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');


const SiteSchema = mongoose.Schema(
  {
    
    title:{
      type: String,
      index: true, 
      unique: true
    },
    
  },
  {
    timestamps: true,
  }
);

SiteSchema.plugin(toJSON);
SiteSchema.plugin(paginate);

SiteSchema.pre('save', async function (next) {
  next();
});

/**
 * @typedef Site
 */
const Site = mongoose.model('Site', SiteSchema);

module.exports = Site;
