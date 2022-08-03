/* eslint-disable spaced-comment */
/* eslint-disable no-param-reassign */
/* eslint-disable no-lonely-if */
/* eslint-disable no-self-compare */
/* eslint-disable no-empty */
const httpStatus = require('http-status');
const { pick, method } = require('lodash');
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const { serviceService, } = require('../../services');
const { ObjectId } = require("mongoose").Types;
const { Cart, Payment, Order, OrderThread, User }  = require('../../models');
const config = require('../../config/config');
const jwt = require('jsonwebtoken');
const moment = require('moment')

const { v4 } = require('uuid');
const { ApiSuccessResponse } = require('../../services/api-response.service');
const { convertToCurrency } = require("../../services/currency");
const Stripe = require('../../vendor/stripe/stripe')
const RazorPay = require("../../vendor/razorpay/razorpay")

const PaymentService =  require('../../services/payment.service');
const model = require('../../models');
const CountryMobileData = require("../../data/country-mobile")

const PAYMENT_MODE = {
  1: 'STRIPE',
  2: 'RAZORPAY', 
  3: 'PAYPAL'
}

const TRIAL_DAYS = 7;
const TRIAL_UNIT = 'days'

const parseCartCurrency = async(req, mCart) => {

  let CurrencySymbol = CountryMobileData.filter(e => e.currency_iso_3 === req.user.currency)
  CurrencySymbol = CurrencySymbol[0] ? CurrencySymbol[0].currency_symbol:'$'

  for(let i = 0; i < mCart.length; i++){

    const intialCurrency = mCart[i].price.currency;
    const intialAmount = mCart[i].price.amount;

    mCart[i].price.isCurrencyPrefix = true || req.currency.IS_PREFIX;
    mCart[i].price.currencySymbol = CurrencySymbol || req.currency.SYMBOL;
    mCart[i].price.currency = req.user.currency || req.currency.THREE_LETTER;
    mCart[i].price.amount = await convertToCurrency(intialCurrency, req.user.currency || req.currency.THREE_LETTER, intialAmount);

  }
  return mCart;
}

const parseServiceCurrency = async(req, CurrencyISO3, service) => {

  let CurrencySymbol = CountryMobileData.filter(e => e.currency_iso_3 === CurrencyISO3)
  CurrencySymbol = CurrencySymbol[0] ? CurrencySymbol[0].currency_symbol:'$'

  const serviceTiers = ['Standard','Premium','Enterprise'];

  for(let i=0; i < serviceTiers.length; i++){

    const intialCurrency = service.features[serviceTiers[i]].price.currency;
    const intialAmount = service.features[serviceTiers[i]].price.amount;

    service.features[serviceTiers[i]].price.isCurrencyPrefix = true || req.currency.IS_PREFIX;
    service.features[serviceTiers[i]].price.currencySymbol = CurrencySymbol || req.currency.SYMBOL;
    service.features[serviceTiers[i]].price.currency = CurrencyISO3 || req.currency.THREE_LETTER;
    service.features[serviceTiers[i]].price.amount = await convertToCurrency(intialCurrency, CurrencyISO3 || req.currency.THREE_LETTER, intialAmount);
    
  }

  return service;
  
}

const getCart = catchAsync(async (req, res) => {

    let user_id = null;
    let w3_cart = null;
    let w3_auth = null;
   

    if(req.cookie && req.cookie.w3_cart && req.cookie.w3_cart != "undefined" && req.cookie.w3_cart != undefined)  w3_cart = req.cookie.w3_cart;
    if(req.query.w3_cart && req.query.w3_cart != "undefined" && req.query.w3_cart != undefined)  w3_cart = req.query.w3_cart;

    if(req.cookie && req.cookie.w3_auth && req.cookie.w3_auth != "undefined" && req.cookie.w3_auth != undefined)  w3_auth = req.cookie.w3_auth;
    if(req.query.w3_auth && req.query.w3_auth != "undefined" && req.query.w3_auth != undefined)  w3_auth = req.query.w3_auth;

   
    if(w3_auth){

        user_id = await new Promise((resolve, reject)=>{
          jwt.verify(w3_auth, process.env.JWT_SECRET, (err, data)=>{
              if(!err){
                  user_id = data.user.id;
                  resolve(user_id);
              }else{
                  resolve(null);
                  // return res.status(500).json({
                  //       success: false, 
                  //       message: "Invalid Headers"
                  // });
              }
          });
        });
    }

    if(user_id){

        const cart = await Cart.find(
          {
            user_id: ObjectId(user_id),
            site_id: req.site || 1,
            status:'PENDING'
          },{
            
          },{
            sort:{
              createdAt:-1
            }
        })
        .populate('service')
        .populate('coupon')
           
       
        if(cart.length > 0){

          const pCart = await parseCartCurrency(req, cart);

          let checkoutAmount = String(pCart[0].price.amount);
          if(checkoutAmount.indexOf(".") !== -1) checkoutAmount = checkoutAmount*100;
          checkoutAmount = parseInt(checkoutAmount);
              
          
          if(req.query.paymentMethod){

            const PaymentMethod = req.query.paymentMethod;
            if(PaymentMethod == "STRIPE"){

              const user = await User.findOne({_id:ObjectId(req.user.id)});
              
              const pi = await Stripe.CreatePaymentIntent({
                amount: checkoutAmount, 
                currency: pCart[0].price.currency,
                customer:{
                  name: user.name,
                  email: user.email,
                  address:{
                    line1: 'MarketEx',
                    city: 'New Delhi',
                    country: req.user.currency == "INR" ? "IN":"US",
                    state:"Delhi",
                    postal_code: req.user.currency == "INR" ? "110020":"11002"
                  }
                }
              })

              return ApiSuccessResponse(res, pi);

            }

            if(PaymentMethod == "RP"){

              const pi = await RazorPay.CreateOrder(pCart[0].price.currency, checkoutAmount)
              return ApiSuccessResponse(res, pi);

            }

            if(PaymentMethod == "RP_SUBSCRIPTION"){

              let rp_plan_id = pCart[0].service.paymentMeta.razorpay.plan.Standard.id;
              let starts_at = moment().add(TRIAL_DAYS, TRIAL_UNIT).unix();

              const pi = await RazorPay.CreateSubscription(rp_plan_id, starts_at);

              return ApiSuccessResponse(res, pi);

            }

          }
          
          let finalCart = [pCart[0]];
          finalCart[0].service = await parseServiceCurrency(req, req.user.currency, pCart[0].service);

          return ApiSuccessResponse(res, finalCart, `User Cart ${user_id}`);

        }else{

          return res.json({
            success: false, 
            message: "Cart Empty. Please add an Order."
          });

        }

    }
  

    if(w3_cart){
    
        const cart = await Cart.find({associated_cookie: w3_cart}).populate('service') // 
        const pCart = await parseCartCurrency(req, cart);

        return ApiSuccessResponse(res, pCart, `User Cart ${w3_cart}`);
    }
    else{
        
        return ApiSuccessResponse(res, "Empty Cart", [req.query]);

    }

      
});

const addToCart = catchAsync(async (req, res) => {

    const cartId = v4();
  
    const payload = req.body;
    const serviceId = payload.serviceId  || '5f0e2493c15814004eaa754e';
    const ServiceObject = await serviceService.getServiceById(serviceId);
    
    let serviceTier = payload.tier || (payload.servicePlan || "Standard");
    serviceTier = serviceTier == "1" ? 'Standard':(serviceTier == "2"?"Premium":(serviceTier == "3"?"Enterprise":(payload.servicePlan || "Standard")));

    const servicePrice = ServiceObject.features[serviceTier].price;
    const serviceQuantity = payload.quantity || 1;

    const cartPrice = {...servicePrice, amount:servicePrice.amount*serviceQuantity}

    let user_id = null;
    let w3_cart = null;
    let w3_auth = null;

    if(req.cookie && req.cookie.w3_cart)  w3_cart = req.cookie.w3_cart;
    if(req.query.w3_cart)  w3_cart = req.query.w3_cart;

    if(req.cookie && req.cookie.w3_auth)  w3_auth = req.cookie.w3_auth;
    if(req.query.w3_auth)  w3_auth = req.query.w3_auth;


    if(w3_auth){

        user_id = req.user.id || null

    }
  
    if(!payload.items){
      // return res.json({
      //   success: false, 
      //   message: "Invalid Payload"
      // });
    }
    
    const cartItems = [];
    const microsServiceIndex = [];
  
      // eslint-disable-next-line no-plusplus
      // Disabled As Microsercice Concept is Removed
      // for(let i=0; i < payload.items.length; i++){
        
      //   const mIndex = microsServiceIndex.indexOf(payload.items[i].id);
      //   if(mIndex === -1){
  
      //     cartItems.push({
      //       microsServiceId: payload.items[i].id,
      //       items:[
      //         {
      //           key: payload.items[i].item, 
      //           quantity: parseInt(payload.items[i].count)
      //         }
      //       ]
      //     });
  
      //     microsServiceIndex.push(payload.items[i].id);
        
      //   }else{
  
      //     cartItems[mIndex].items.push(
      //       {
      //         key:payload.items[i].item,
      //         quantity: parseInt(payload.items[i].count)
      //       }
      //     );
  
      //   }
  
      // }
  
    let newCart = "";
    const NewCartId = v4();

    if(user_id){

      newCart = await Cart.create({
        site_id: req.site || 1,
        serviceQuantity,
        service: serviceId,
        items: cartItems,
        price: cartPrice,
        user_id: ObjectId(user_id),
        servicePlan:serviceTier,
      });
     
      return ApiSuccessResponse(res, "Added to Cart", newCart);

    }else{

      //  Guest Checkout
      if(w3_cart){
  
        newCart = await Cart.create({
            associated_cookie: w3_cart,
            serviceQuantity,
            service: serviceId,
            items:cartItems,
            price: cartPrice,
            site_id: req.site || 1,
            servicePlan:serviceTier,
        });
    
  
        return ApiSuccessResponse(res, "Added to Cart", newCart);
        
      }
      else{
    
        newCart = await Cart.create({
          associated_cookie: NewCartId,
          serviceQuantity,
          service: serviceId,
          serviceObject: ServiceObject,
          servicePlan:serviceTier,
          items:cartItems,
          price: cartPrice,
          site_id: req.site || 1,
          //user_id
        });
    
        res.cookie('w3_cart', w3_cart, config.cookie.settings("99content.local"));
        return res.json({
          success: true, 
          message: "Added to Cart",
          cartId: newCart.id,
          w3_cart: NewCartId
        });
    
      }
    }
});

const editCart = catchAsync(async(req, res)=>{

  let user_id = req.user.id
  let payload = req.body

  let latestCart = await Cart.findOne(
    {
      user_id: ObjectId(user_id)
    },
    null,
    {
      sort:{
        createdAt: -1
      }
    }
  ).populate('service');

  if(!latestCart) return res.json({success: false, message:"Please Browse Services."})

  if(payload.coupon){

    let coupon_code = payload.coupon.toUpperCase();
    let CouponObject = await model.Coupon.findOne({code:coupon_code})
    if(!CouponObject) return res.json({success:false, message:"Invalid Coupon Code"})

    if(latestCart.service.serviceType != CouponObject.valid_on)
      return res.json({success: false, message:"Coupon Cannot be applied on this Service"})

    if(latestCart.service.serviceType == "SUBSCRIPTION")
      return res.json({success: false, message:"Coupons Cannot be applied to Subscriptions yet."})
    
    if(latestCart.price.currency != "USD"){}
      // Convert Cart to USD 

    if(latestCart.coupon) return res.json({success: false, message:"Coupon Already Applied"})

    
    if(CouponObject.discount.type == "FIXED"){
      if(latestCart.price.amount >= CouponObject.discount.value){
        latestCart.price.amount -= CouponObject.discount.value;
        latestCart.coupon = ObjectId(CouponObject.id)
        await latestCart.save()
        return res.json({
          success: true, 
          message:"Coupon Applied Successfully"
        })
      }
    }
    
    if(CouponObject.discount.type == "PERCENTAGE"){
      if(latestCart.price.amount >= CouponObject.discount.value){
        latestCart.price.amount -= CouponObject.discount.value*latestCart.price.amount/100;
        latestCart.coupon = ObjectId(CouponObject.id)
        await latestCart.save()
        return res.json({
          success: true, 
          message:"Coupon Applied Successfully"
        })
      }
    }
  }

  return res.json({
    success: false, 
    message:"Unknown Error Occured"
  })


})

const payAtCheckout = catchAsync(async (req, res) => {

    const user_id = req.user.id;
    const mCart = await Cart.findOne(
      {
        user_id: ObjectId(user_id),
        status:'PENDING'
      },
      {},
      { sort: { createdAt: -1 } }
    ).populate({
      path:'service',
      model:'Service'
    })

    let payload = req.body;
    let paymentMethod = payload.method;

    let pMethod = PAYMENT_MODE[paymentMethod];
    let pmData = payload.data;
    let pType = payload.type === 1 ? 'FIXED':'SUBSCRIPTION';

    let orderPayload = {
        payment_id: null,
        user_id: ObjectId(user_id),
        cart_id: ObjectId(mCart.id),
        order_status:'PAID',
        order_type:'',
        site_id: req.site
    }

    if(mCart.service.serviceType == "FIXED"){

      // Validate Onetime Payment
      orderPayload.order_type = "FIXED";

    }
    else if(mCart.service.serviceType == "SUBSCRIPTION"){

      // Validate Subscriptions
      orderPayload.order_type = "SUBSCRIPTION";

    }

    // Create PayCharge
    const PayCharge = await Payment.create({
        site_id: req.site,
        user_id: ObjectId(user_id),
        cart_id: ObjectId(mCart.id),
        type: pType,
        data: pmData,
        method:pMethod
    });

    orderPayload.payment_id =  ObjectId(PayCharge.id);
    const NewOrder = await Order.create(orderPayload);

    // await OrderThread.create({
    //   orderId: NewOrder.id, 
    //   title: "Order Created",
    //   type:"update",
    //   message:"Order Created",
    //   senderUserId: user_id,
    // })

    let NewCart = await Cart.findOneAndUpdate(
      {
        _id: ObjectId(mCart.id),
      },
      {
        $set:{
          status: 'COMPLETED',
          order_id:ObjectId(NewOrder.id),
          payment_id: ObjectId(PayCharge.id)
        }
      },
      {
        new: true
      }
    );

    if(req.cookie) res.clearCookie("w3_cart");

    return ApiSuccessResponse(
      res,
      {
        cart: NewCart, 
        order: NewOrder,
      }, 
      "Order Placed"
    );

   
     
});

const StripeSubscribe = catchAsync(async (req, res) => {

    const payload = req.body;
    const {paymentMethod, Coupon, price} = payload;
    
    const User = await model.User.findOne({_id: ObjectId(req.user.id)})

    let customer = "";
    if(
      User.payment_meta && 
      User.payment_meta.stripe && 
      User.payment_meta.stripe.customer &&
      User.payment_meta.stripe.customer.id
    ){
      
      customer =  User.payment_meta.stripe.customer.id;

      const UserStripeInfo = User.payment_meta.stripe;

      User.payment_meta.stripe = {
        customer: UserStripeInfo.customer,
        payment_method:  await Stripe.GetPaymentMethod(paymentMethod)
      };

      User.save()

    }else{

      const NewStripeCustomer = await Stripe.CreateStripeCustomer(User.name, User.email, {
        line1:"MarketEx",
        city:"New Delhi",
        country: "IN",
        state:"Delhi",
        postal_code:"110020"
      });

      User.payment_meta.stripe = {
        customer:NewStripeCustomer,
        payment_method: await Stripe.GetPaymentMethod(paymentMethod)
      };
      
      User.save()

      customer = NewStripeCustomer.id;

    }


    await Stripe.LinkPaymentMethodToCustomer(paymentMethod, customer).catch(e=>{throw new Error(e)});

    let starts_at = moment().add(TRIAL_DAYS, TRIAL_UNIT).unix();

    const subscription = await Stripe.CreateStripeSubscription(customer, price, starts_at).catch(e=>{throw new Error(e)});
    
    if(subscription)
      return res.json({
        success: true, 
        data: subscription,
      });
    else
      return res.json({
        success: false, 
        message:"Hello"
      })
});

const PaypalSubscribe = catchAsync(async (req, res) => {

    const payload = req.body;
    const {paymentMethod, Coupon, price, customer} = payload;

    const PaypalDetails = await PaymentService.PaypalOrderDetails("68R59897WF894022P");
    return res.send(PaypalDetails);

});
const RazorpaySubscribe = catchAsync(async (req, res) => {

    const payload = req.body;
    const {paymentMethod, Coupon, price, customer} = payload;
    
    const subscription = null;
    
    if(subscription)
      return res.json({
        success: true, 
        data: subscription,
      });
    else
      return res.json({
        success: false, 
        message:"Hello"
      })
});

module.exports = {
  getCart,
  addToCart,
  editCart,
  payAtCheckout,
  StripeSubscribe,
  PaypalSubscribe, 
  RazorpaySubscribe,
};
