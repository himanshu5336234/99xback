/* eslint-disable no-unused-vars */
/* eslint-disable import/order */
/* eslint-disable camelcase */
/* eslint-disable radix */
/* eslint-disable no-else-return */
const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const adminRoute = require('./_admin.route');
const docsRoute = require('./docs.route');
const categoryRoute = require('./category.route');
const serviceRoute = require('./service.route');
const checkoutRoute = require('./checkout.route');
const orderRoute = require('./order.route');
const meetRoute = require('./meet.route');
const metaRoute = require('./meta.route');
const profileRoute = require('./profile.route');

const config = require('../../config/config');

const { Cart, GuestUser } = require('../../models');


const router = express.Router();

router.use('/_admin', adminRoute);

router.use("/crm", require("./crm.route"))

router.use('/auth', authRoute);
router.use('/users', userRoute);

router.use('/docs', docsRoute);
router.use('/profile', profileRoute);
router.use('/service', serviceRoute);
router.use('/category', categoryRoute);

router.use('/cart', checkoutRoute)
router.use('/orders', orderRoute)
router.use('/meet', meetRoute)

router.use('/meta', metaRoute);
router.get('/home', async(req, res)=>{

  let guest;

  if(req.cookie && req.cookie.w3_user){

    guest = {
      id: req.cookie.w3_user
    }
  }
  else{
    
    guest = await GuestUser.create({
      ip_addr:"127.0.0.1"
    });

    res.cookie('w3_user', guest.id, config.cookie.settings());

  }

  res.json({
    success:true, 
    title:"99x Startups",
    guest
  });

});

// Crash Checking
// const catchAsync = require("../../utils/catchAsync")
// router.get('/t', catchAsync(async (req, res)=>{

//   throw new Error("Crash")

// }));







// router.use('/', (req, res) => {
//   return res.json({
//     message: 'Home',
//   });
// });


module.exports = router;
