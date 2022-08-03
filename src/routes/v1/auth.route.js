const express = require('express');
const validate = require('../../middlewares/validate');
const authValidation = require('../../validations/auth.validation');
const authController = require('../../controllers/auth.controller');
const { Cart, UserTeam, UserInvite, User } = require('../../models');
const { ObjectId } = require("mongoose").Types;
const config = require('../../config/config');
const { sendLoginOtp, sendSignupOtp, sendEmail } = require('../../services/email.service');
const { generateOtp } = require('../../services/auth.service');
const { ApiSuccessResponse, ApiFailureResponse } = require('../../services/api-response.service');
const UserService = require('../../services/user.service');
const CountryCode = require("../../data/country-mobile")
const FreshworksObject = require("../../vendor/freshworks")
const FreshWorks = new FreshworksObject()

const w3AuthMiddleware = require('../../middlewares/w3auth');


const router = express.Router();

router.post('/refresh-tokens', validate(authValidation.refreshTokens), authController.refreshTokens);
router.post('/forgot-password', validate(authValidation.forgotPassword), authController.forgotPassword);
router.post('/reset-password', validate(authValidation.resetPassword), authController.resetPassword);


const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');

const USER_TYPE = {
  BUYER: 1, 
  SELLER: 2
}

const ProcessInvitation = async(userObject) => {
  let pendingInvite = await UserInvite.findOne({email:userObject.email});
  if(pendingInvite){
    
    let InvitationTeamId = pendingInvite.team_id

    // Accepting User Invite
    pendingInvite.status = 'ACCEPTED';
    await pendingInvite.save();

    let userTeamObject = await UserTeam.findOne({_id:ObjectId(InvitationTeamId)})

    userTeamObject.members.push({
      user: ObjectId(userObject.id),
      team_role: 3,
      is_active: true, 
      is_confirmed: true
    })

    await userTeamObject.save()


  }else{

    let NewUserTeam = await UserTeam.create({
      site_id: 1, 
      owner: ObjectId(userObject.id),
      team_name:`${userObject.name}'s Team`,
      team_type:'BUYER',
      members:[{
        user: ObjectId(userObject.id),
        team_role: 1, 
        is_active: true, 
        is_confirmed: true
      }]
    })
  }

  let name_split = userObject.name.split(" ")
  let first_name = name_split[0]
  let last_name = name_split[1] || ''
  FreshWorks.createContact({
    first_name: first_name,
    last_name,
    email: userObject.email,
    mobile: userObject.mobile.number
  }).then(d=>console.log("Freshworks Res:", d))

  return true

}

const ValidateEmail = (email)  => {
  
  // eslint-disable-next-line no-useless-escape
  // eslint-disable-next-line security/detect-unsafe-regex
  if (/^\w+([\.+-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/.test(email)){
    return true;
  }
  return false;

}

const LoginSuccess = async (res, userObject) => {

  let user_country = userObject.location_country;
  let user_currency_map = CountryCode.filter(o => o.country_iso_2 == user_country)
  user_currency_map = user_currency_map[0]

  let user_type = USER_TYPE.BUYER;
  if(userObject.defaultRole && userObject.defaultRole == "SELLER") user_type = USER_TYPE.SELLER
  
  const auth_token = jwt.sign({
    user:{
      id:userObject.id,
      name: userObject.name,
      currency: user_currency_map.currency_iso_3,
      type: user_type
    }
  }, process.env.JWT_SECRET);

  res.cookie('w3_auth', auth_token, config.cookie.settings());
  ApiSuccessResponse(res, "Logged In", {
    user: userObject, 
    user_new: true,
    token: auth_token,
    user_type: user_type,
  });

}

router.post('/init', async(req, res)=>{

  const payload = req.body;
  const email = payload.email;
  if(!payload.email) return ApiFailureResponse(res, "Email is required");

  if(!ValidateEmail(payload.email)) return ApiFailureResponse(res, "Enter a valid email");

  const userObject = await UserService.getUserByEmail(email,{});

  // return ApiSuccessResponse(res,userObject);
  
  if(userObject && userObject.email_confirmed){
    
    let updatePayload = null

    if(payload.mode && payload.mode == "SELLER"){
      updatePayload = {
        defaultRole:'SELLER',
        capabilities: ['BUYER','SELLER']
      }
    }

    let uD = {}
    if(updatePayload){
      uD = await User.updateOne(
        {email},{
          $set: updatePayload,
        },
        {upsert:true}
      );
    }

    return ApiSuccessResponse(res,{user_exists: true, u: userObject.capabilities});

  }else {
    
  
    const signupOtp = generateOtp();
    await sendSignupOtp(email, signupOtp);
    
    if(!userObject){

      const username = payload.email.replace(/[^a-zA-Z0-9]/g, "");

      let createUserPayload = {
        name:"New User", 
        username,
        email,
        email_confirmed: false,
        password:'ASJNJNJN1@1#KJNKJN',
        meta: null,
        signin:{
          code: signupOtp
        }
      }

      if(payload.mode && payload.mode == "SELLER"){
        createUserPayload['defaultRole'] = "SELLER"
        createUserPayload['capabilities'] = ['BUYER','SELLER']
      }

      await UserService.createUser(createUserPayload);

    }
    else{

      let updatePayload = {
        signin:{
          code: signupOtp
        }
      }

      if(payload.mode && payload.mode == "SELLER"){
        updatePayload['defaultRole'] = "SELLER"
        updatePayload['capabilities'] = ['BUYER','SELLER']
      }

      await User.updateOne(
        {email},{
          $set: updatePayload,
        },
        {upsert:true}
      );
    }

    return ApiSuccessResponse(res,{user_exists: false, otp_sent: true});

  }
});

router.post('/create', async(req, res)=>{

  try{

    const payload = req.body;
    if(!payload.email) return ApiFailureResponse(res, "Email is Required");

    const email = payload.email;
    if(!ValidateEmail(email)) return ApiFailureResponse(res, "Enter a valid Email");

    const mobile = payload.mobile;
    if(!mobile.countryCode) return ApiFailureResponse(res, "Enter a Country Code")
    if(!mobile.number) return ApiFailureResponse(res, "Enter a valid Mobile")
    
    if(mobile.number && mobile.number.length < 5) return ApiFailureResponse(res, "Enter a valid Mobile Number")
    
    let UserCountry = CountryCode.filter(e => e.code == mobile.countryCode);

    if(UserCountry.length == 0) return ApiFailureResponse(res, "Enter a valid Country Code");
    UserCountry = UserCountry[0];


    const {name, username, password, code } = payload;

    if(code){

      // Older Flow
      if(code.length != 6) return ApiFailureResponse(res, "Enter a valid Code");

      const userObject = await UserService.getUserByEmail(email);
      if(!userObject) return ApiFailureResponse(res, "User Does't Exists. Reinitiate the session.");
      if(userObject && userObject.email_confirmed) return ApiFailureResponse(res, "Email already exists. Please Login");

      if(userObject.signin.code != code) {
        return ApiFailureResponse(res, "Enter a valid verification code");
      }

      userObject.name = name;
      userObject.username = payload.email.replace(/[^a-zA-Z0-9]/g, "");
      userObject.password = password;
      userObject.mobile = {
        countryCode: mobile.countryCode,
        number: mobile.number
      }

      userObject.location_country = UserCountry.country_iso_2
      userObject.email_confirmed = true
      await userObject.save()

      await ProcessInvitation(userObject)
      
      return LoginSuccess(res, userObject);

    }else{

      const { phone } = payload;
      if(!ValidateEmail(email)) return ApiFailureResponse(res, "Enter a valid email");

      const userObject = await UserService.getUserByEmail(email,{});
      if(userObject){
        if(userObject.email_confirmed){
          return ApiFailureResponse(res, "User Already Exists, Please LogIn");
        }
        return ApiFailureResponse(res, "User Already Exists, Please Login");
      }

      const signupOtp = generateOtp();
      await sendSignupOtp(email, signupOtp);
      
      const username = payload.email.replace(/[^a-zA-Z0-9]/g, "");
      await UserService.createUser({
        name: name, 
        username,
        email,
        phone,
        email_confirmed: false,
        password:'ASJNJNJN1@1#KJNKJN',
        meta: null,
        signin:{
          code: signupOtp
        }
      });

      return ApiSuccessResponse(res,{user_exists: false, otp_sent: true});

    }
 
  }catch(e){

    return ApiFailureResponse(res, e.message);
 
  }
  

});

router.post('/create/confirm', async(req, res)=>{

  let payload = req.body;
  let {email, code} = payload

  const userObject = await UserService.getUserByEmail(email,{});
  if(userObject){
    if(userObject.signin.code != code ) return ApiFailureResponse(res, "Invalid OTP",{
      o: userObject.signin.code, 
      c: code
    });
    
    return LoginSuccess(res, userObject);

  }else{
    return ApiFailureResponse(res, "No Such user, Please Signup");
  }

});

router.post("/login", async(req, res)=>{

  const payload = req.body;
  if(!payload.email) return ApiFailureResponse(res, "Email is required");

  const email = payload.email;
  const loginOtp = generateOtp();

  const userObject = await UserService.getUserByEmail(email);
  if(!userObject) return ApiFailureResponse(res, "No Such User");
  // Validate Email

  if(payload.send_otp){

    await sendLoginOtp(email, loginOtp);
    await userObject.update({email},{
      $set:{
        signin:{
          code: loginOtp
        }
      }
    }).catch(e=> ApiFailureResponse(res, e.message));

    return ApiSuccessResponse(res, "OTP Sent");

  }

  if(payload.resend_otp){

    await sendLoginOtp(email, userObject.signin.code);
    return ApiSuccessResponse(res, "OTP Sent")

  }

  if(payload.otp){

    if(userObject.signin.code != payload.otp ) return ApiFailureResponse(res, "Invalid OTP",{
      o: userObject.signin.code, 
      c: payload.otp
    });
    return LoginSuccess(res, userObject);
  
  }

  if(payload.password){

    if(await userObject.isPasswordMatch(payload.password))
      return LoginSuccess(res, userObject)

    return ApiFailureResponse(res, "Invalid Password");
    

  }

  return ApiFailureResponse(res, "Invalid Call");

});




router.get('/google-login', async (req, res)=>{
  
  let newUser = false;

  const googleToken = req.query.token;
  const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${googleToken}`;
  const resp = await fetch(url).then(r => r.json());
  
  // eslint-disable-next-line no-console
  const { email, name } = resp;
  const user_meta = {
    oauth:['GOOGLE']
  };

  let userObject;
  const existingUserQuery = await UserService.queryUsers({email},{});

  if(existingUserQuery.totalResults === 0){

    newUser = true;
    const username = email.replace(/[^a-zA-Z0-9]/g, "");
    userObject= await UserService.createUser({
      name, 
      email,
      email_confirmed: true,
      username,
      password:'ASJNJNJN1@1#KJNKJN',
      meta: user_meta
    });
    
  }else{
    
    // eslint-disable-next-line prefer-destructuring
    userObject = existingUserQuery.results[0];

  }
 
  if(req.cookie && req.cookie.w3_cart){
    
    const userCart = await Cart.findOneAndUpdate({associated_cookie: req.cookie.w3_cart}, {
        user_id: ObjectId(userObject.id)
    }, {
        returnOriginal: false
    });
  }

  return LoginSuccess(res, userObject);

})

router.post('/switch', w3AuthMiddleware.mandatoryAuth, authController.switchUserMode)


module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication
 */

/**
 * @swagger
 * path:
 *  /auth/register:
 *    post:
 *      summary: Register as user
 *      tags: [Auth]
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required:
 *                - name
 *                - email
 *                - password
 *              properties:
 *                name:
 *                  type: string
 *                email:
 *                  type: string
 *                  format: email
 *                  description: must be unique
 *                password:
 *                  type: string
 *                  format: password
 *                  minLength: 8
 *                  description: At least one number and one letter
 *              example:
 *                name: fake name
 *                email: fake@example.com
 *                password: password1
 *      responses:
 *        "201":
 *          description: Created
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  user:
 *                    $ref: '#/components/schemas/User'
 *                  tokens:
 *                    $ref: '#/components/schemas/AuthTokens'
 *        "400":
 *          $ref: '#/components/responses/DuplicateEmail'
 */

/**
 * @swagger
 * path:
 *  /auth/login:
 *    post:
 *      summary: Login
 *      tags: [Auth]
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required:
 *                - email
 *                - password
 *              properties:
 *                email:
 *                  type: string
 *                  format: email
 *                password:
 *                  type: string
 *                  format: password
 *              example:
 *                email: fake@example.com
 *                password: password1
 *      responses:
 *        "200":
 *          description: OK
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  user:
 *                    $ref: '#/components/schemas/User'
 *                  tokens:
 *                    $ref: '#/components/schemas/AuthTokens'
 *        "401":
 *          description: Invalid email or password
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Error'
 *              example:
 *                code: 401
 *                message: Invalid email or password
 */

/**
 * @swagger
 * path:
 *  /auth/refresh-tokens:
 *    post:
 *      summary: Refresh auth tokens
 *      tags: [Auth]
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required:
 *                - refreshToken
 *              properties:
 *                refreshToken:
 *                  type: string
 *              example:
 *                refreshToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1ZWJhYzUzNDk1NGI1NDEzOTgwNmMxMTIiLCJpYXQiOjE1ODkyOTg0ODQsImV4cCI6MTU4OTMwMDI4NH0.m1U63blB0MLej_WfB7yC2FTMnCziif9X8yzwDEfJXAg
 *      responses:
 *        "200":
 *          description: OK
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/AuthTokens'
 *        "401":
 *          $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * path:
 *  /auth/forgot-password:
 *    post:
 *      summary: Forgot password
 *      description: An email will be sent to reset password.
 *      tags: [Auth]
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required:
 *                - email
 *              properties:
 *                email:
 *                  type: string
 *                  format: email
 *              example:
 *                email: fake@example.com
 *      responses:
 *        "204":
 *          description: No content
 *        "404":
 *          $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * path:
 *  /auth/reset-password:
 *    post:
 *      summary: Reset password
 *      tags: [Auth]
 *      parameters:
 *        - in: query
 *          name: token
 *          required: true
 *          schema:
 *            type: string
 *          description: The reset password token
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required:
 *                - password
 *              properties:
 *                password:
 *                  type: string
 *                  format: password
 *                  minLength: 8
 *                  description: At least one number and one letter
 *              example:
 *                password: password1
 *      responses:
 *        "204":
 *          description: No content
 *        "401":
 *          description: Password reset failed
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Error'
 *              example:
 *                code: 401
 *                message: Password reset failed
 */
