/* eslint-disable no-self-compare */
/* eslint-disable no-empty */
const httpStatus = require('http-status');
const { pick } = require('lodash');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { serviceService, } = require('../services');
const { ChildServiceGroup, ChildService, Order, Cart, Payment,  OrderThread } = require('../models');
const { ObjectId } = require("mongoose").Types;
const config = require('../config/config');

const { v4 } = require('uuid');

const verifyCaller = catchAsync(async (req, res) => {

    if(req.user && req.params.id){

        const orderId = req.params.id;
        
        let order = await Order.findOne({
            _id: ObjectId(orderId)
        });

        if(order){
            return res.json({
                success: true, 
                message: "Connected"
            })
        }else{
            return res.json({
                success: false, 
                message:"Invalid Room ID"
            })
        }


    }else{

        return res.json({
            success: false, 
            message: "User Not Authenticated"
        })

    }
      
});




module.exports = {
    verifyCaller
};
