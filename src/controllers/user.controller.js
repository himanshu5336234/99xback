const httpStatus = require('http-status');
const { pick } = require('lodash');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService } = require('../services');
const model = require("../models/index");
const { ObjectId } = require("mongoose").Types;
const EmailService = require("../services/email.service")

const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).json({
    success: true,
    data: user,
  });
});

const getUsers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await userService.queryUsers(filter, options);
  res.send(result);
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

const getUserDashboard = catchAsync(async (req, res) => {
  
  const userId = req.user.id;
  const User = await model.User.findOne({_id:ObjectId(userId)}).catch(e=>{throw new Error(e)})

  // return res.json({u:res.user})
  const resData = {};

  resData.user = {
    name: User.name,
    email_confirmed: User.email_confirmed, 
    phone_confirmed: User.phone_confirmed,
    picture: User.picture || ''
  }

  resData.orders = await userService.getUserOrders({userId, site:req.site})
  resData.team = [];

  return res.json({
    success: true, 
    data: resData
  });
 
  // return User;

});

const getUserProfile = catchAsync(async (req, res) => {
  
  const userId = req.user.id;
  const User = await model.User.findOne({_id:ObjectId(userId)}).catch(e=>{throw new Error(e)})

  const resData = {};
  resData.user = {
    name: User.name,
    email_confirmed: User.email_confirmed, 
    phone_confirmed: User.phone_confirmed,
    about: User.about,
    email: User.email,
    phone: User.phone,
    picture: User.picture || ''
  }

  resData.team = [];

  return res.json({
    success: true, 
    data: resData
  });
 
  // return User;

});

const InviteUserToTeam = catchAsync(async (req, res)=>{

  const userId = req.user.id;
  const userName = req.user.name || 'Someone'
  const team_type = (req.body.type && req.body.type == 'BUYER') ? 'BUYER':'SELLER';
  const invite_user_email = req.body.email;

  if(!invite_user_email) return res.json({success:false, message:'Email is Required'})

  let UserTeam = await model.UserTeam.findOne({
    site_id: req.site,
    owner: ObjectId(userId),
    team_type
  });
  
  if(!UserTeam) {
    const User = await model.User.findOne({_id:ObjectId(userId)}).catch(e=>{throw new Error(e)})
    UserTeam = await model.UserTeam.create({
      site_id: req.site, 
      owner: ObjectId(userId),
      team_name:`${User.name}'s Team`,
      team_type,
      members:[{
        user: ObjectId(userId),
        team_role: 1, 
        is_active: true, 
        is_confirmed: true
      }]
    })
  }

  const InvitedUser = await model.User.findOne({
    email: invite_user_email
  });

  // If Already Exists on the Platform
  if(InvitedUser){

    let teamMembers = UserTeam.members;
    let user_already_exists = false;
    for(let i=0; i< teamMembers.length; i++){
      
      let teamMember = teamMembers[i];

      if(teamMember.user.equals(InvitedUser.id)){
        user_already_exists = true;
        break;
      }

    }

    if(user_already_exists) return res.json({
      success: false,
      message:"User already in team"
    });

    UserTeam.members.push({
      user: ObjectId(InvitedUser.id),
      team_role: 3,
      is_active: true, 
      is_confirmed: true
    });

    await UserTeam.save();


    // Not required as Directly Added by Default
    // 
    // let userInviteObject = await model.UserInvite.create({
    //   inviter: ObjectId(userId),
    //   inviter_mode:'BUYER',
    //   email:invite_user_email,
    //   team_id: ObjectId(UserTeam._id)
    // })
    // await EmailService.sendInviteToUser(invite_user_email, userInviteObject._id, userName)

    return res.json({
      success: true, 
      message:'User Invited'
    })

  }else{

    let invite_user = await model.UserInvite.findOne({
      email: invite_user_email
    })

    if(invite_user){
      await EmailService.sendInviteToUser(invite_user_email, invite_user.id, userName)
      return res.json({
        success: true, 
        message:"User Invited Again"
      })
    }else{
      
      let userInviteObject = await model.UserInvite.create({
        inviter: ObjectId(userId),
        inviter_mode:'BUYER',
        email:invite_user_email,
        team_id: ObjectId(UserTeam._id)
      })

      if(userInviteObject){

        await EmailService.sendInviteToUser(invite_user_email, userInviteObject._id, userName)

        return res.json({
          success: true, 
          message:'Invitation Sent'
        })
      }
      else{
        return res.json({
          success: false, 
          message:'Unknwon Error Occured'
        })
      }
    }

  }



});

const GetUserPaymentMethod = catchAsync(async(req, res)=>{

  const userId = req.user.id;
  const User = await model.User.findOne({_id:ObjectId(userId)}).catch(e=>{
    throw new Error(e);
  })

  let paymentMethods = [];

  if(
    User && 
    User.payment_meta &&
    User.payment_meta.stripe && 
    User.payment_meta.stripe.payment_method && 
    User.payment_meta.stripe.payment_method.card
  ){

    let userCard = User.payment_meta.stripe.payment_method.card;
    
    paymentMethods.push({
      type:'card',
      method:'STRIPE',
      card:{
        last4: userCard.last4,
        country: userCard.country,
        brand: userCard.brand, 
        exp_month: userCard.exp_month, 
        exp_year: userCard.exp_year
      }
    })

  }else{
    if(paymentMethods.length == 0){
      paymentMethods.push({
        type:'platform',
        method:'RAZORPAY'
      })
    }
  }

  return res.json({
    success: true, 
    data: paymentMethods
  })


});

const GetUserTeam = catchAsync(async(req, res)=>{

  const userId = req.user.id;
  const team_type = (req.query.user_mode && req.query.user_mode == 'BUYER') ? 'BUYER':'SELLER';

  let UserTeam = await model.UserTeam.findOne({
    owner: ObjectId(userId),
    site_id: req.site,
  }).populate('members.user');


  if(UserTeam){

    return res.json({
      success: true,
      data: UserTeam
    })

  }

  

  return res.json({
    success: false, 
    data: null,
    message:"No Such Team"
  });

});


module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getUserDashboard,
  getUserProfile,
  GetUserPaymentMethod,
  InviteUserToTeam,
  GetUserTeam
};
