const mongoose = require('mongoose');
const { toJSON, paginate, Algolia } = require('./plugins');
const { SITES } = require("../constants");

const serviceSchema = mongoose.Schema(
  {
    owner:{
      type: mongoose.Types.ObjectId, 
      ref:'user',
      default: null
    },
    categories: [
      {
        type: mongoose.Types.ObjectId,
        ref: 'category',
      },
    ],
    site_id:{
      type: Number,
      enum: Object.values(SITES),
      default: SITES.X99_STARTUP
    },
    title: {
      type: String,
      required: true,
      trim: true,
      // algoliaIndex: true
    },
    heading: {
      type: String,
      trim: true,
      // algoliaIndex: true
    },
    subtitle: {
      type: String,
      required: true,
      trim: true,
      // algoliaIndex: true
    },
    serviceType: {
      type: String,
      enum: ['FIXED', 'SUBSCRIPTION'],
      default: 'FIXED',
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      index: true,
      unique: true,
    },
    excerpt: {
      type: String,
      require: true,
    },
    list1: [
      {
        type: String,
      },
    ],
    list2: [
      {
        type: String,
      },
    ],
    startingPrice: {
      type: Number,
      required: true,
    },
    startingPriceSymbol: {
      type: String,
      required: true,
      default:'$'
    },
    startingPriceUnit: {
      type: String,
      required: true,
    },
    startingPriceSuffix: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    sampleWork: {
      type: String,
    },
    faq: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Faq',
      },
    ],
    orderCount: {
      type: mongoose.Schema.Types.Number,
      defaultValue: 1,
    },
    ratingCount: {
      type: Number,
      default: 1,
    },
    ratingValue: {
      type: Number,
      default: 10,
    },
    availbleCountries: [
      {
        type: String,
        enum: ['IN', 'US', 'GLOBAL'],
        default: 'GLOBAL',
      },
    ],
    tags: [
      {
        type: String,
      },
    ],
    banners: [
      {
        type: String,
      },
    ],
    cardBanners: [
      {
        type: String, 
      }
    ],
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'question',
      },
    ],
    microservices:[
      {
        type: mongoose.Schema.Types.ObjectId, 
        ref:'microservice',
      }
    ],
    tiers:[
      {
        title: String,
        delivery_in: String, 
        revisions: String,
        price: {
          isCurrencyPrefix:{
            type: Boolean, 
            default: true,
          },
          currencySymbol:{
            type: String, 
            required: true,
            default:'$'
          },
          currency:{
            type: String, 
            required: true,
            default:'USD'
          },
          amount:{
            type: Number, 
            required: true, 
            default: 100
          },
          unit:{
            type: String,
            required: true,
            default:'Per Unit' 
          }
        },
        list: [{
          type: String
        }]
      }
    ],
    features:{
      Standard:{
        subtitle: String,
        price: {
          isCurrencyPrefix:{
            type: Boolean, 
            default: true,
          },
          currencySymbol:{
            type: String, 
            required: true,
            default:'$'
          },
          currency:{
            type: String, 
            required: true,
            default:'USD'
          },
          amount:{
            type: Number, 
            required: true, 
            default: 100
          },
          unit:{
            type: String,
            required: true,
            default:'Per Unit' 
          }
        },
        delivery_in:{
          unit:{
            type: String, 
            default:'Days',
          },
          value:{
            type: String
          }
        },
        revisions:{
          type: String
        },
        list: [{
          type: String
        }],
      },
      Premium:{
        subtitle: String,
        price: {
          isCurrencyPrefix:{
            type: Boolean, 
            default: true,
          },
          currencySymbol:{
            type: String, 
            required: true,
            default:'$'
          },
          currency:{
            type: String, 
            required: true,
            default:'USD'
          },
          amount:{
            type: Number, 
            required: true, 
            default: 100
          },
          unit:{
            type: String,
            required: true,
            default:'Per Unit' 
          }
        },
        delivery_in:{
          unit:{
            type: String, 
            default:'Days',
          },
          value:{
            type: String
          }
        },
        revisions:{
          type: String
        },
        list: [{
          type: String
        }]
      },
      Enterprise:{
        subtitle: String,
        price: {
          isCurrencyPrefix:{
            type: Boolean, 
            default: true,
          },
          currencySymbol:{
            type: String, 
            required: true,
            default:'$'
          },
          currency:{
            type: String, 
            required: true,
            default:'USD'
          },
          amount:{
            type: Number, 
            required: true, 
            default: 100
          },
          unit:{
            type: String,
            required: true,
            default:'Per Unit' 
          }
        },
        delivery_in:{
          unit:{
            type: String, 
            default:'Days',
          },
          value:{
            type: String
          }
        },
        revisions:{
          type: String
        },
        list: [{
          type: String
        }]
      },
    },
    paymentMeta:{
      stripe:{
        type: Object,
        index: true
      },
      paypal:{
        type: Object,
        index: true
      },
      razorpay:{
        type: Object,
        index: true
      }
    },
    is_archived:{
      type: Boolean, 
      default: false
    }
  },

  {
    timestamps: true,
  }
);

serviceSchema.plugin(toJSON);
serviceSchema.plugin(paginate);
// serviceSchema.plugin(Algolia);

/**
 * Check if Service Slug is Taken
 */
serviceSchema.statics.isSlugTaken = async function (slug) {
  const service = await this.findOne({ slug });
  return !!service;
};

serviceSchema.pre('save', async function (next) {
  if(this.categories.length === 0) next(new Error("Category is Required"))
  else {
    if(!this.heading) this.heading = this.title;
    next()
  }
});


/**
 * @typedef Service
 */
const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;
