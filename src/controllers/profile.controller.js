const httpStatus = require('http-status');
const { pick } = require('lodash');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService } = require('../services');
const { ApiSuccessResponse } = require('../services/api-response.service');
const serviceService = require('../services/service.service');
const config = require('../config/config');
const { v4 } = require('uuid');
const myCache = require('../utils/Cache');
const {convertToCurrency} = require('../services/currency');

const Aws = require('aws-sdk');
Aws.config.update({region:'ap-south-1'});
const { User } = require('../models');
Aws.config.accessKeyId = "AKIATRXCQQT2NUV4CTVE";
Aws.config.secretAccessKey = "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";
Aws.config.region = "ap-south-1";
Aws.config.region = "ap-south-1";

const AwsBucketName = "99xstartups";
const AwsS3Bucket = new Aws.S3( { params: {Bucket: AwsBucketName} } );

const setUserConfig = catchAsync(async(req, res)=>{
    
    if(req.user && req.user.id){

        let Response = {}

        const userId = req.user.id;
        await userService.setUserConfig(userId, {
            currency: req.body.currency
        });

        Response.currency = req.currency.THREE_LETTER;
        Response.currency_multiplier_usd = await convertToCurrency("USD", Response.currency, 1)
        // Response.w3_user = NewUserId;
        Response.__debug = "1.0"

        return ApiSuccessResponse(res, Response, "Currency Changed");

    }else{

        let Response = {}
        
        if(req.cookie && req.cookie.w3_user || req.query.w3_user){

            const AnonUserId = req.cookie ? req.cookie.w3_user:req.query.w3_user;

            myCache.set(`currency_${AnonUserId}`, req.body.currency);

            Response.currency = req.body.currency;
            Response.currency_multiplier_usd = await convertToCurrency("USD", Response.currency, 1)
            Response.w3_user = AnonUserId;
            Response.__debug = "1.1"
        
            return ApiSuccessResponse(res, Response, "Slow Response");
            
        }
        
        const NewUserId = v4();
        myCache.set(`currency_${NewUserId}`, req.currency.THREE_LETTER);
        
        res.cookie('w3_user',NewUserId, config.cookie.settings());

        Response.currency = req.currency.THREE_LETTER;
        Response.currency_multiplier_usd = await convertToCurrency("USD", Response.currency, 1)
        Response.w3_user = NewUserId;
        Response.__debug = "1.2"

        return ApiSuccessResponse(res, Response)

    }
    
});

const getUserConfig = catchAsync(async(req, res)=>{
    
    
    if(req.user && req.user.id){

        const userId = req.user.id;
        const userCurrency = await userService.getUserConfig(userId, 'currency');

        let Response = {}
        Response.currency = req.currency.THREE_LETTER;
        
        if(userCurrency){
        
            Response.__debug = "1.1"
            Response.currency = userCurrency
        
        }else{

            const defaultCurrency = req.currency.THREE_LETTER;
            await userService.setUserConfig(userId, {
                currency: defaultCurrency
            });

            Response.__debug = "1.2"
            Response.currency = defaultCurrency
            
             
        }

        Response.currency_multiplier_usd = await convertToCurrency("USD", Response.currency, 1)
        ApiSuccessResponse(res, Response);
        return true

    }else{

        if(req.cookie && req.cookie.w3_user || req.query.w3_user){

            const AnonUserId = req.cookie ? req.cookie.w3_user:req.query.w3_user;
            const CachedCurrency = myCache.get(`currency_${AnonUserId}`);

            if(CachedCurrency == undefined){

                myCache.set(`currency_${AnonUserId}`, req.currency.THREE_LETTER);
                let currency_multiplier_usd = await convertToCurrency("USD", req.currency.THREE_LETTER, 1);
                return ApiSuccessResponse(res, {
                    __debug:"2.1",
                    currency: req.currency.THREE_LETTER,
                    currency_multiplier_usd
                })

            }else{

                let currency_multiplier_usd = await convertToCurrency("USD", CachedCurrency, 1);
                return ApiSuccessResponse(res, {
                    __debug:"2.2",
                    currency: CachedCurrency,
                    currency_multiplier_usd
                });

            }

        }
        
        const NewUserId = v4();
        myCache.set(`currency_${NewUserId}`, req.currency.THREE_LETTER);
        
        let Response = {__debug:"3.1"}
        Response.currency = req.currency.THREE_LETTER;
        Response.currency_multiplier_usd = await convertToCurrency( "USD",req.currency.THREE_LETTER,  1)
        
        res.cookie('w3_user',NewUserId, config.cookie.settings());    
        return ApiSuccessResponse(res, Response)
        
    }
    
});

const setUserProfilePicture = catchAsync(async(req, res)=>{

    const userId = req.user.id
    const buf = Buffer.from(req.body.imageBinary.replace(/^data:image\/\w+;base64,/, ""),'base64');

    const payloadData = {
        Key: '', 
        Body: buf,  
        ContentEncoding: 'base64',
        ContentType: 'image/jpeg'
    };

    payloadData.Key = `users/${req.user.id}/${v4()}.jpg`;

    return AwsS3Bucket.putObject(payloadData, (err, data)=>{
        if (err) { 
            return res.json({
                success: false, 
                error: err
            })
        } 
        let profileImgUrl = `https://99xstartups.s3.ap-south-1.amazonaws.com/${payloadData.Key}`
        
        userService.setUserProperty(userId, {
            picture: profileImgUrl
        });

        return res.json({
            success: true, 
            data,
            src:profileImgUrl
        });
    });
    
})

module.exports = {
    getUserConfig,
    setUserConfig,
    setUserProfilePicture,
}