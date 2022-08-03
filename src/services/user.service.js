const httpStatus = require('http-status');
const { User, UserConfig } = require('../models');
const ApiError = require('../utils/ApiError');
const { ObjectId } = require("mongoose").Types;
const CountryCurrencyMap = require('../data/country-currency');
const { Cart, Payment, Order, OrderThread }  = require('../models');
const moment = require('moment'); 

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody) => {
  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  const user = await User.create(userBody);
  return user;
};

/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryUsers = async (filter, options) => {
  const users = await User.paginate(filter, options);
  return users;
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getUserById = async (id) => {
  return User.findById(id);
};

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<User>}
 */
const getUserByEmail = async (email) => {
  return User.findOne({ email });
};

/**
 * Update user by id
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  Object.assign(user, updateBody);
  await user.save();
  return user;
};

/**
 * Delete user by id
 * @param {ObjectId} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  await user.remove();
  return user;
};

const setUserConfig = async(user_id, data) =>{
  
  let userConfigObject = await UserConfig.findOne({user:ObjectId(user_id)});
  if(userConfigObject){

    userConfigObject.currency = data.currency;
    await userConfigObject.save();

  }else{

    userConfigObject = await UserConfig.create({
      user: user_id,
      currency: data.currency
    });

  }

  return true;

};


const setUserProperty = async(user_id, data) => {

  try{
    let userObject = await User.findOne({_id:ObjectId(user_id)});

    if(userObject){
      if(data.picture){
        userObject.picture = data.picture;
        await userObject.save();
      }
    }else{
      return false;
    }
  }catch(e){
    console.error("Error Updating Profile:", e);
    return false;
  } 

  return true;
}

const getUserConfig = async(user_id, config_key)=>{
  
  const data = await UserConfig.findOne({user: ObjectId(user_id)});
  
  if(data && data[config_key]) return data[config_key];
  return null;

}
const getUserCheckoutCurrency = async(user_id) => {

  let userCountry = await getUserConfig(user_id, 'location_country')
  let userCountryCurrencyIso3 = CountryCurrencyMap[userCountry]
  
  let finalCurrency= null;
  if(userCountryCurrencyIso3){
    finalCurrency = userCountryCurrencyIso3
  }else{
    finalCurrency = await getUserConfig(user_id, 'currency')
    if(!finalCurrency) finalCurrency = "USD"
  }
  return finalCurrency

}

const PopulateOrders = (orders) => {


  for(let i = 0; i < orders.length; i++){
    
    orders[i] = orders[i].toJSON();

    if(!orders[i]['cart_id'])  continue;
    
    const tc = moment( orders[i].created_at ).format('DD/MM/YYYY');
    const tc_readable = moment( orders[i].created_at ).format('MMM DD');
    orders[i].created_at = tc;
    orders[i].created_at_readable = tc_readable;
    
    orders[i].service = {
      // eslint-disable-next-line dot-notation
      heading: (orders[i]['cart_id']['service']) ? orders[i]['cart_id']['service'].title:'',
    };

    delete orders[i].cart_id;

  }

  return orders


}
const getUserOrders = async({
  userId,
  site = 1,
  team_members = null
}) => {
  
  let initPL = {
    user_id: {
      $in:[ObjectId(userId)]
    },
    site_id: site
  }

  if(team_members) initPL.user_id.$in = team_members

  const orderObject = await Order.find(initPL,{},{sort:{createdAt: -1}})
  .populate({
    path:'cart_id',
    populate:{
      path:'service'
    }
  });

  return PopulateOrders(orderObject)
  
};


module.exports = {
  createUser,
  queryUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
  setUserConfig,
  getUserConfig,
  getUserOrders,
  PopulateOrders,
  getUserCheckoutCurrency,
  setUserProperty
};
