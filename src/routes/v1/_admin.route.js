/* eslint-disable spaced-comment */
/* eslint-disable camelcase */
/* eslint-disable prettier/prettier */
/* eslint-disable import/newline-after-import */
const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const userValidation = require('../../validations/user.validation');
const {Service} = require("../../models");

const { 
  Admin_CategoryController, 
  Admin_ServiceController,
  Admin_UserController, 
  Admin_ImportController, 
  Admin_OrderController,
  Admin_CouponController,
} = require('../../controllers');

const router = express.Router();

// router.get('/user', userController.getUsers )
// router.post('/user', userController.createUser)

const AwsS3 = require('../../vendor/aws/s3')
router.post('/upload', async(req, res)=>{
  
  let uploadRes = null

  try{
    if(req.files && req.files.file)
    uploadRes = await AwsS3.putObject(req.files.file)

    return res.json({
      success: true, 
      data: uploadRes
    })
  }catch(e){
    res.json({
      success: false, 
      error: e
    })
  }
})
router.post('/import', Admin_ImportController.importData);
router.post('/coupon', Admin_CouponController.addCoupon);

router.get('/category', Admin_CategoryController.getAllCategory)
router.get('/category/:id', Admin_CategoryController.getCategory)
router.get('/category/:id/service', Admin_CategoryController.getServicesByCategory)
router.put('/category/:id', Admin_CategoryController.updateCategory)
router.post('/category', Admin_CategoryController.createCategory);
//.post(auth('manageUsers'), validate(userValidation.createUser), userController.createUser)
//.get(auth('getUsers'), validate(userValidation.getUsers), userController.getUsers);
router.post('/user', Admin_UserController.addUser)
router.get('/user', Admin_UserController.getUsers)
router.get('/user/:userId', Admin_UserController.getUser)
router.patch('/user/:userId', Admin_UserController.updateUser)
router.delete('/user/:userId', Admin_UserController.deleteUser)  
// .get(auth('getUsers'), validate(userValidation.getUser), userController.getUser)
// .patch(auth('manageUsers'), validate(userValidation.updateUser), userController.updateUser)
// .delete(auth('manageUsers'), validate(userValidation.deleteUser), userController.deleteUser);

router
  .post('/service', Admin_ServiceController.createService)
  .put('/service', Admin_ServiceController.editService)
  // .put('/service/:slug', Admin_ServiceController.editService)
  .put('/service/:slug', Admin_ServiceController.editServiceNew)
  .get('/service', Admin_ServiceController.getAllService)

router.get('/service/:id', Admin_ServiceController.getService)
router.post('/service/:id/upload-assets', Admin_ServiceController.uploadAssets)
router.post('/service/:id/micro-service', Admin_ServiceController.createMicroService)

router
  .post('/order', Admin_OrderController.getAllOrders)
  .post('/order/assign', Admin_OrderController.assignSellerToOrder)
  .put('/order', Admin_OrderController.getAllOrders)
  .get('/order', Admin_OrderController.getAllOrders)
  .get('/order/:id', Admin_OrderController.getOrder)
  .get('/order/:id/thread', Admin_OrderController.getOrderThread)

router.all('*', (req, res)=>{
  return res.send("Invalid Route")
})

module.exports = router;
