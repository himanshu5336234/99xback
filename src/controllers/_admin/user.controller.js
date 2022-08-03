/* eslint-disable no-param-reassign */
const httpStatus = require('http-status');
const { pick } = require('lodash');
const { ObjectId } = require("mongoose").Types;
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const { serviceService } = require('../../services');
const model  = require('../../models');
const { userService } = require('../../services');
const { CreateStripeCustomer } = require("../../vendor/stripe/stripe");

const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).json({
    success: true,
    data: user,
  });
});

const getUsers = catchAsync(async (req, res) => {
  if(req.query && req.query.generateStripe){
    model.User.find({},async(err, user)=>{
      console.log(user);
      for(let i = 0; i < user.length; i++){

        const StripeCustomer = await CreateStripeCustomer(user[i].email)
        user[i].payment_meta.stripe = StripeCustomer;
        user[i].save();
        
      }
      return res.json({
        success: true, 
        message:"Updated"
      })
    })
  }
  else{
    const filter = pick(req.query, ['name', 'role']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await userService.queryUsers(filter, options);
    res.send(result);
  }
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  res.send(user);
});

const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.params.userId, req.body);
  res.send(user);
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);
  res.status(httpStatus.NO_CONTENT).send();
});

const addUser = catchAsync(async (req, res)=>{
  let {name, picture, designation, company } = req.body;
  let username = name.replace(/[^a-zA-Z]/g,'-').replace(/--+/g,'-').toLowerCase()
  let email = `${username}@clients.99x.network`
  let User = await userService.createUser({
    name,
    username,
    picture,
    email,
    email_confirmed: true,
    password: '%qpJdg%32KhU',
    location_country:'US',
    meta:{
      designation,
      company
    }
  })
  return res.json({
    success: true, 
    user: User
  })
})


module.exports = {
  createUser,
  getUsers,
  getUser,
  addUser,
  updateUser,
  deleteUser,
};
