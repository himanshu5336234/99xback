const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    picture:{
      type: String, 
      default:'https://99xstartups.s3.ap-south-1.amazonaws.com/assets/icons/Profile.png'
    },
    defaultRole:{
      type: String, 
      enum:['BUYER','SELLER'],
      defaul:'BUYER'
    },
    capabilities:[{
      type: String, 
      enum: ['BUYER','SELLER'],
      default:'BUYER'
    }],
    signin:{
      code:{
        type: Number, 
        trim: true,
        private: true
      },
      generateAt:{
        type: String, 
      },
      expireAt:{
        type: String,
      },
      
    },
    username:{
      type: String, 
      unique: true, 
      trim: true, 
      lowercase: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index : {
        unique : true,
        dropDups : true
      }
    },
    email_confirmed: {
      type: Boolean,
      default: false,
    },
    mobile: {
      countryCode: String, 
      number: String
    },
    mobile_confirmed: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      default: null,
      trim: true,
      validate(value) {
        if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
          throw new Error('Password must contain at least one letter and one number');
        }
      },
      private: true, // used by the toJSON plugin
    },
    location_country: {
      type: String,
      defaultValue: 'IN',
    },
    website: {
      type: String,
      defaultValue: null,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed
    },
    payment_meta:{
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
    crm_meta:{
      freshworks:{
        type: mongoose.Schema.Types.Mixed,
      }
    },
    twoFactorEnabled: {
      type: Boolean,
      defaultValue: false,
    },
    twoFactorConfig: {
      type: String,
      get(data) {
        return JSON.parse(data);
      },
      set(data) {
        return JSON.stringify(data);
      },
    },
    about:{
      type: String, 
      default:''
    },
    roles: [
      {
        type: String,
        enum: roles,
        default: 'user',
      },
    ],
    last_active: {
      type: Date,
      default: Date.now,
    },
    is_premium_seller:{
      type: Boolean,
      default: false
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};

/**
 * Check if password matches the user's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
userSchema.methods.isPasswordMatch = async function (password) {
  const user = this;
  const isPasswordMatch = await bcrypt.compare(password, user.password);

  return isPasswordMatch
};

userSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

/**
 * @typedef User
 */
const User = mongoose.model('User', userSchema);

module.exports = User;
