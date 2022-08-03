/* eslint-disable no-self-compare */
/* eslint-disable no-empty */
const httpStatus = require('http-status');
const { pick } = require('lodash');
const catchAsync = require('../utils/catchAsync');
const { serviceService, userService} = require('../services');
const { ApiFailureResponse, ApiSuccessResponse } = require('../services/api-response.service')
const { ChildServiceGroup, ChildService } = require('../models');
const Models = require("../models")
const { ObjectId } = require("mongoose").Types;
const { Cart, Payment, Order, OrderThread, OrderThreadChild }  = require('../models');
const config = require('../config/config');
const sanitizeHtml = require('sanitize-html');

const { v4 } = require('uuid');
const moment = require('moment'); // require

const { isValidObjectId } = require('mongoose');

const Aws = require('aws-sdk');
Aws.config.update({region:'ap-south-1'});
const { model } = require('../models/token.model');
Aws.config.accessKeyId = "AKIATRXCQQT2NUV4CTVE";
Aws.config.secretAccessKey = "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";
Aws.config.region = "ap-south-1";

const AwsBucketName = "99xstartups";
const AwsS3Bucket = new Aws.S3( { params: {Bucket: AwsBucketName} } );

const USER_SELLER = 2;
const USER_BUYER = 1;

const getAllOrders = catchAsync(async (req, res) => {

    if(req.user && req.user.id){
    
        const userId = req.user.id;

        let Orders;
        
        let getAllTeams = await Models.UserTeam.find({"members.user":ObjectId(userId)})
        getAllTeams = getAllTeams.map(e=>e.toJSON())

        let getAllMembersList = getAllTeams.map(e=>{
          let u = e.members.map(x=>x.user)
          return u
        })



        let User_Team_Members = [];
        for(let i=0; i<getAllMembersList.length;i++){
          for(let j=0; j < getAllMembersList[i].length; j++){
            User_Team_Members.push(getAllMembersList[i][j])
          }
        }

        if(req.user.type && req.user.type == USER_SELLER){

          Orders = await Models.Order.find({
            site_id: req.site || 1,
            sellers: {
              $in: User_Team_Members
            }
          })
          .populate({
            path:'cart_id',
            populate:{
              path:'service'
            }
          })

          Orders = userService.PopulateOrders(Orders)
          
        }
        else{

          Orders = await userService.getUserOrders({
            userId, 
            site: req.site,
            team_members: User_Team_Members
          });

        }

        return res.json({
          success: true, 
          data: Orders,
          meta:{
            user: userId
          }
        });

      }

      else{

        return res.json({
          success:  false,
          data: null
        });
        
      }

      
});

const getOrder = catchAsync(async (req, res) => {

    if(req.user){
    
        const orderId = req.params.order_id;
        const orderObject = await Order.findOne({
          _id: ObjectId(orderId)
        }).populate({
          path: 'cart_id',
          populate: {
            path: 'service',
            model: 'Service'
          } 
        }).populate('sellers')

        const o = orderObject.toJSON()
        o['created_at_readable'] = moment(orderObject.created_at).format('MM/DD/YYYY')

        return res.json({
          success: true, 
          data: o
        })

      }

      else{

        return res.json({
          success:  false,
          data: null
        })
      
      }

      
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
      console.error(err);
    }
    res.json({
      success: true, 
      data,
      src:`https://99xstartups.s3.ap-south-1.amazonaws.com/${payloadData.Key}`
    });
  });

});


const getOrderThread = catchAsync(async (req, res) => {

    const user_id = req.user.id;
    const order_id = req.params.order_id;

    const orderThreadQuery = {orderId: order_id};
    if(req.query.type){
      const threadType = req.query.type;
      if(threadType == "task"){
        orderThreadQuery.type = "task"
      } 
      if(req.query.task_type){
        const TaskType = req.query.task_type;
        switch(TaskType){
          case 'active':
            orderThreadQuery.status = "TASK_IN_PROGESS"
            break;
          case 'queued':
            orderThreadQuery.status = "TASK_IN_QUEUE";
            break;
          case 'in-revision':
            orderThreadQuery.status = "TASK_IN_REVISION";
            break;
          case 'awaiting-approval':
            orderThreadQuery.status = "TASK_SUBMITTED";
            break;
          case 'completed':
            orderThreadQuery.status = "TASK_COMPLETED";
            break;
          default:
            console.log("Hello");
        }
      }
    }

    if(!isValidObjectId(order_id)) return ApiFailureResponse(req, "Invalid Order ID")

    let o_user_id; let o_order_id;
    try{
      o_user_id = ObjectId(user_id);
      o_order_id = ObjectId(order_id);
    }catch(e){
      return ApiFailureResponse(res, "Invalid Value")
    }

    const OrderObject = await Order.findOne({_id:ObjectId(order_id)})
    const OrderType = OrderObject.order_type; // FIXED, SUBSCRIPTION

    const ot = await OrderThread.find(orderThreadQuery)
      .populate('senderUserId')
      .populate('childThreads')
      .populate('assignedTo')
    
      const OThread = [];

    for(let i = 0; i < ot.length; i++){
      const SingleOrderThread = ot[i].toJSON();

      if(SingleOrderThread.message && SingleOrderThread.message.html && typeof SingleOrderThread.message.html === "string"){
        SingleOrderThread.message.html =  SingleOrderThread.message.html.replace(/&lt;/ig,"<");
      }
      
      if(SingleOrderThread.message && SingleOrderThread.message.description && typeof SingleOrderThread.message.description === "string"){
        SingleOrderThread.message.description =  SingleOrderThread.message.description.replace(/&lt;/ig,"<");
      }
      
      SingleOrderThread.is_sender = (SingleOrderThread.senderUserId && SingleOrderThread.senderUserId.id && SingleOrderThread.senderUserId.id == user_id) ? true:false;
      SingleOrderThread.created_at_readable = moment( SingleOrderThread.created_at ).format('MMM DD, h:mm a');

      if(SingleOrderThread.childThreads && SingleOrderThread.childThreads.length > 0){
        
        for(let j=0; j<SingleOrderThread.childThreads.length; j++){

          SingleOrderThread.childThreads[j].message = SingleOrderThread.childThreads[j].message.replace(/&lt;/ig,"<");

        }

      }

      OThread.push(SingleOrderThread)

    }

    if(OThread.length < 1 && req.user.type == 1){
      
      if(OrderType == "FIXED"){
        OThread.push({
          type:"timeline",
          title:"Order Created",
          icon:"https://ik.imagekit.io/99x/_portal/icons/taskUpdate_Cpi3S3Snr.png",
          created_at_readable:moment(OrderObject.created_at).format('MMMM D, h:mm a')
        })
      }

      OThread.push({
        type: "user-input",
        user_input:{
          type: "task",
          title: OrderType == "FIXED" ? 'Let’s get started, share your requirements':'Let’s get started by adding a task!',
          icon: 'https://ik.imagekit.io/99x/_portal/icons/edit_icon_dL1y_Wpp8.svg'
        }
      })
    }

    let lastThread = OThread[OThread.length-1]
    if(lastThread.type == "task" && lastThread.status == "TASK_CREATED"){          

      if(req.user.type == 1){
        // Buyer
        OThread[OThread.length-1].childThreads = [{
          type:"timeline",
          title:'Your task is added. Sit tight, we’ll get back to you shortly',
          icon: 'https://ik.imagekit.io/99x/_portal/icons/taskUpdate_Cpi3S3Snr.png'
        }];
      }else{

        OThread[OThread.length-1].childThreads = [{
          type:"timeline",
          title:'Task Received',
          icon: 'https://ik.imagekit.io/99x/_portal/icons/taskUpdate_Cpi3S3Snr.png'
        }];
      }
    
    }

    return ApiSuccessResponse(res, OThread);
    // return ApiSuccessResponse(res, {
    //   thread:OThread,
    //   order: await Models.Order.findOne({_id:ObjectId(order_id)})
    // });

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

const assignUserToThread = catchAsync(async(req, res)=>{

  const { user_id } = req.body;
  const thread_id = req.params.thread_id;
  
  let TheOrderThread = await OrderThread.findOne({
    _id:ObjectId(thread_id)
  })

  if(!TheOrderThread) return res.json({
    success: false, 
    message:"Invalid Message"
  })

  if(TheOrderThread.assignedTo.indexOf(user_id) == -1){
    TheOrderThread.assignedTo.push(ObjectId(user_id))
    await TheOrderThread.save();
    return res.json({
      success: true, 
      message:"User Assigned"
    })
  } 
  else{
    return res.json({
      success: false, 
      message:"User Already Exists"
    })
  }


})

const addChildThread = catchAsync(async (req, res) => {

    const user_id = req.user.id;
    const order_id = req.params.order_id;
    const thread_id = req.params.thread_id;

    let o_user_id; let o_order_id, o_thread_id;
    
    try{
    
      o_user_id = ObjectId(user_id);
      o_order_id = ObjectId(order_id);
      o_thread_id = ObjectId(thread_id);
    
    }catch(e){

      return res.status(500).json({
        success: false, 
        message: "Invalid Values"
      })
    
    }

    const {title, type, message } = req.body;

    let NewOrderChild = await OrderThreadChild.create({
      orderId: order_id, 
      orderThreadId: thread_id,
      title,
      type,
      message,
      senderUserId: user_id,
    });

    await OrderThread.findOneAndUpdate({
      _id: o_thread_id,
    },{
      $set:{
        status: req.body.status,
      },
      $push:{
        childThreads: NewOrderChild.id
      }
    }).catch(e=>{
      return res.json({
        success: false, 
        message: e.message
      })
    })

    return res.json({
      success: true, 
      data: NewOrderChild.id,
      message: "Message Sent"
    })

});


module.exports = {
  getOrder,
  getAllOrders,
  getOrderThread,
  addOrderThread,
  addChildThread,
  assignUserToThread,
  uploadThreadAttachment,
};
