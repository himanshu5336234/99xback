const mongoose = require('mongoose');

const { Schema } = mongoose;
const { toJSON, paginate } = require('./plugins');
const { SITES } = require("../constants");

const categorySchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    site_id:{
      type: Number,
      enum: Object.values(SITES),
      default: SITES.X99_STARTUP
    },
    slug: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle:{
      type: String, 
      required: true, 
      trim: true
    },
    banners: [
      {
        type: String,
        default:''
      },
    ],
    unit: {
      type: String,
      // required: true,
    },
    weight:{
      type: Number, 
      default: 0,
    },
    show_on_home:{
      type: Boolean, 
      default: false
    },
    is_archived:{
      type:  Boolean, 
      default: false
    }
  },
  {
    timestamps: true,
  }
);

categorySchema.index({
  site_id: 1, 
  slug: 1
},{
  unique: true
})

categorySchema.plugin(toJSON);
categorySchema.plugin(paginate);

categorySchema.pre('save', async function (next) {
  next();
});

/**
 * Check if Service Slug is Taken
 */
categorySchema.statics.isSlugTaken = async function (site_id, slug) {
  const category = await this.findOne({ site_id, slug });
  return !!category;
};

/**
 * @typedef Category
 */
const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
