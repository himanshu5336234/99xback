/* eslint-disable no-self-compare */
/* eslint-disable no-empty */
const httpStatus = require('http-status');
const { pick } = require('lodash');
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const { serviceService, userService} = require('../../services');
const { ApiFailureResponse, ApiSuccessResponse } = require('../../services/api-response.service')
const { ChildServiceGroup, ChildService } = require('../../models');
const { ObjectId } = require("mongoose").Types;
const { Cart, Payment, Order, OrderThread, User }  = require('../../models');
const config = require('../../config/config');
const sanitizeHtml = require('sanitize-html');
const model = require("../../models");

const { v4 } = require('uuid');
const moment = require('moment'); // require

const Aws = require('aws-sdk');
Aws.config.update({region:'ap-south-1'});

Aws.config.accessKeyId = "AKIATRXCQQT2NUV4CTVE";
Aws.config.secretAccessKey = "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";
Aws.config.region = "ap-south-1";

const AwsBucketName = "99xstartups";
const AwsS3Bucket = new Aws.S3( { params: {Bucket: AwsBucketName} } );

const getAllOrders = catchAsync(async (req, res) => {

    const Orders = await model.Order
      .find({})
      .sort({
        createdAt:-1
      })
      .populate({
          path: 'cart_id',
          populate: {
            path: 'service',
            model: 'Service'
          } 
      })
      .populate('sellers')

    const AllOrders = [];
    for(let i = 0; i < Orders.length; i++){
        
        const NewOrder = Orders[i].toJSON();
        NewOrder.created_at_readable = moment( NewOrder.created_at ).format('MMM DD, h:m a');

        AllOrders.push(NewOrder);
    }

    return res.json({
        success: true,
        data:AllOrders
    });
      
});

const getOrder = catchAsync(async (req, res) => {

    const orderId = req.params.id;
    const orderObject = await Order.findOne({
      _id: ObjectId(orderId)
    }).populate({
      path: 'cart_id',
      populate: {
        path: 'service',
        model: 'Service'
      } 
    });

    return res.json({
      success: true, 
      data: orderObject
    })
      
});

const uploadThreadAttachment = catchAsync(async (req, res)=>{

  const payload = req.body;
  
  const orderId = req.params.order_id;
  const buf = Buffer.from(req.body.imageBinary.replace(/^data:image\/\w+;base64,/, ""),'base64');

  const payloadData = {
    Key: '', 
    Body: buf,  
    ContentEncoding: 'base64',
    ContentType: 'image/jpeg'
  };

  payloadData.Key = `threads/${orderId}/${v4()}.jpg`;

  return AwsS3Bucket.putObject(payloadData, (err, data)=>{
    if (err) { 
      console.log(err);
    } 
    res.json({
      success: true, 
      data,
      src:payloadData.Key
    });
  });

});


const getOrderThread = catchAsync(async (req, res) => {

    const order_id = req.params.id;

    const ot = await OrderThread.find({orderId: order_id}).populate('senderUserId');
    const OThread = [];

    for(let i = 0; i < ot.length; i++){
      const SingleOrderThread = ot[i].toJSON();

      if(SingleOrderThread.message && SingleOrderThread.message.html && typeof SingleOrderThread.message.html === "string"){
        SingleOrderThread.message.html =  SingleOrderThread.message.html.replace(/&lt;/ig,"<");
      }
      
      SingleOrderThread.created_at_readable = moment( SingleOrderThread.created_at ).format('MMM DD, h:mm a');

      OThread.push(SingleOrderThread)
    }
    return ApiSuccessResponse(res, OThread);

});

const addOrderThread = catchAsync(async (req, res) => {

    const user_id = req.user.id;
    const order_id = req.params.order_id;

    let o_user_id; let o_order_id;
    
    try{
      o_user_id = ObjectId(user_id);
      o_order_id = ObjectId(order_id);
    }catch(e){
      return res.status(500).json({
        success: false, 
        message: "Invalid Values"
      })
    }

    const {title, type, message } = req.body;
    await OrderThread.create({
      orderId: order_id, 
      title,
      type,
      message,
      senderUserId: user_id,
    })

    return res.json({
      success: true, 
      message: "Message Sent"
    })

});

const assignSellerToOrder = catchAsync(async(req, res)=>{

  let {order_id, seller_email} = req.body;

  if(!order_id || !seller_email) return res.json({success:false, message:'Invalid Parameters'})

  let NUser = await User.findOne({email: seller_email});
  if(!NUser) return res.json({success:false, message:'No Such User'})

  let NOrder = await Order.findOne({_id:ObjectId(order_id)})
  if(!NOrder) return res.json({success:false, message:'No Such Order'});

  if(NOrder.sellers.length == 0){

    NOrder.sellers.push(ObjectId(NUser.id));
    await NOrder.save();
    return res.json({success: true, message:`Order Assigned to ${NUser.name}`})
    
  }else{
    return res.json({success:false, message:'Order Already Assigned to Someone'});
  }


});


module.exports = {
  getOrder,
  getAllOrders,
  getOrderThread,
  addOrderThread,
  assignSellerToOrder,
  uploadThreadAttachment
};
