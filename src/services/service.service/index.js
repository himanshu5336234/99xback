/* eslint-disable no-plusplus */
const httpStatus = require('http-status');
const { Service, MicroService } = require('../../models');
const ApiError = require('../../utils/ApiError');
const { ObjectId } = require("mongoose").Types;
const { CreateStripeProduct, CreateStripeProductPricing } = require("../../vendor/stripe/stripe");
const { CreateRazorpayPlan } = require("../../vendor/razorpay/razorpay");
const W3Paypal = require("../../vendor/paypal");
const NetworkSites = require("../../constants/sites");

const { convertToCurrency } = require("../../services/currency");

const queryServices = async (filters, options) => {
  return Service.paginate(filters, options);
};

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

const createPaymentGatewayObjects = async(ServiceObject, forceRecreate = null) => {
  
  const PaymentPlans = [
    ["Standard",1],
    // ["Premium",2],
    // ["Enterprise",3]
  ];
  

  const ServiceJson = ServiceObject.toJSON();
  
  PaymentPlans[0][1] = ServiceJson.features.Standard.price.amount;
  // PaymentPlans[1][1] = ServiceJson.features.Premium.price.amount;
  // PaymentPlans[2][1] = ServiceJson.features.Enterprise.price.amount;

  const ServiceId = ServiceJson._id;

  const NetworkName = Object.keys(NetworkSites).filter(e=>NetworkSites[e] === ServiceJson.site_id)
  const ServiceTitle = `${NetworkName}Z - ${ServiceJson.heading}`;

  let StripeProduct = (ServiceObject.paymentMeta && ServiceObject.paymentMeta.stripe && ServiceObject.paymentMeta.stripe.product ) ? ServiceObject.paymentMeta.stripe.product:null;
  const PaypalPlan = (ServiceObject.paymentMeta && ServiceObject.paymentMeta.paypal && ServiceObject.paymentMeta.paypal.billingPlan ) ? ServiceObject.paymentMeta.paypal.billingPlan:null;
  const RazorpayPlan = (ServiceObject.paymentMeta && ServiceObject.paymentMeta.razorpay && ServiceObject.paymentMeta.razorpay.plan ) ? ServiceObject.paymentMeta.razorpay.plan:null;

  if(!StripeProduct || forceRecreate){

    const NewStripeProduct = await CreateStripeProduct(ServiceId, ServiceTitle);
    StripeProduct = NewStripeProduct;

    // eslint-disable-next-line no-param-reassign
    ServiceObject.paymentMeta.stripe= {
      product: NewStripeProduct,
      pricing:{}
    }

    await asyncForEach(PaymentPlans, async(planName)=>{
      // eslint-disable-next-line no-param-reassign

      let ServicePricing = {
        'INR':await CreateStripeProductPricing(
          `IN_${planName[0]}`, 
          StripeProduct.id,  
          planName[1]*75,
          'INR'
        ),
        'USD': await CreateStripeProductPricing(
          planName[0], 
          StripeProduct.id,  
          planName[1],
          'USD'
        )
      }
      ServiceObject.paymentMeta.stripe.pricing[planName[0]] = ServicePricing;


    });
    
    
  }

  if(!PaypalPlan || forceRecreate){

    const Paypal = new W3Paypal();
    const NewPaypalProduct = await Paypal.createProduct(ServiceId, ServiceTitle);

    ServiceObject.paymentMeta.paypal = {
      product: NewPaypalProduct,
      pricing:{}
    }


    await asyncForEach(PaymentPlans, async(planName)=>{
      // eslint-disable-next-line no-param-reassign
      ServiceObject.paymentMeta.paypal.pricing[planName[0]] = await Paypal.createBillingPlan(
        planName[0], 
        NewPaypalProduct.id,  
        planName[1]
      )
    });

  }

  if(!RazorpayPlan || forceRecreate){

    // eslint-disable-next-line no-param-reassign
    ServiceObject.paymentMeta.razorpay = {
      plan:{}
    }
    
    await asyncForEach(PaymentPlans, async(planName)=>{

      let ValueInINR = await convertToCurrency("USD","INR",planName[1])
      // eslint-disable-next-line no-param-reassign
      ServiceObject.paymentMeta.razorpay.plan[planName[0]] = await CreateRazorpayPlan(
        ServiceId, 
        // eslint-disable-next-line prefer-template
        ServiceTitle + ' ' + planName[0], 
        ValueInINR,
        'INR',
        ServiceTitle,
        '99x',
        planName[0],
      );
    });
  
  }
  
  // eslint-disable-next-line no-restricted-syntax
  // for(const ms of ServiceJson.microservices){
  //   const msAmount = (ms.price && ms.price.amount) ? ms.price.amount:ServiceJson.startingPrice;
  //   ms.paymentMeta.stripe = await CreateStripeProductPricing(StripeProduct.id,  msAmount);
  // }

  await ServiceObject.save();
  return ServiceObject;
}


const getServiceBySlug = async (slug) => {
  const service = await new Promise((resolve, reject)=>{  
    Service.findOne({ slug })
      .populate('microservices')
      .exec((e, data)=> {
        resolve(data)
      });
  }) 


  if (!service) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Service Not Found');
  }

  const serviceJson = service.toJSON();

  const microServiceObject = serviceJson.microservices;

  const ms = microServiceObject;
  for(let i=0; i <ms.length; i++){

    const {items} = ms[i];

    const itemQuantity = serviceJson.serviceType == 'SUBSCRIPTION' ? 1:0;
    for(let j=0; j < items.length; j++){
      ms[i].items[j] = [ms[i].items[j], itemQuantity]
    }

    
    
  }
  
  for(let i=0;  i < ms.length; i++){

    const temp_price = ms[i].price;
    ms[i].prices = {
      "Standard": temp_price, 
      "Premium": temp_price, 
      "Enterprise": temp_price
    };


  }
  serviceJson.OldmicroService = ms;

  return serviceJson;
};

const getServiceById= async (slug) => {

  const service = await Service.findOne({ _id:ObjectId(slug) });
  if (!service) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Service Not Found');
  }

  return getServiceBySlug(service.slug);
};

const createService = async (reqBody) => {

  if (await Service.isSlugTaken(reqBody.slug)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Slug is already taken');
  }
  if(reqBody.serviceType === "FIXED"){
  
    // if(!reqBody.microServices) throw new ApiError(httpStatus.BAD_REQUEST, 'At least 1 Microservice is required');
    // if(reqBody.microServices.length == 0) throw new ApiError(httpStatus.BAD_REQUEST, 'At least 1 Microservice is required');
    
    let microServicesObject = reqBody.microServices;
    delete reqBody.microServices;
  
    reqBody.features = {
      Standard:{
        price:{
          amount: parseInt(reqBody.standard_multipler*100)
        }
      },
      Premium:{
        price:{
          amount: parseInt(reqBody.premium_multipler*100)
        }
      },
      Enterprise:{
        price:{
          amount: parseInt(reqBody.enterprise_multipler*100)
        }
      },
    }

    const s = new Service(reqBody);

    await s.save();
    return s;
  
  }else if(reqBody.serviceType === "SUBSCRIPTION"){

    let standardPrice = reqBody['standard_multipler'];
    let premiumPrice = reqBody['premium_multipler'];
    let enterprisePrice = reqBody['enterprise_multipler'];
    if(!standardPrice || !premiumPrice || !enterprisePrice) throw new Error("Please Enter Plan Pricing");

    reqBody['features'] = {
      Standard:{
        price: {
          amount:parseInt(standardPrice*100),
          isCurrencyPrefix: true, 
        }
      },
      Premium:{
        price: {
          amount:parseInt(premiumPrice*100),
          isCurrencyPrefix: true, 
        }
      },
      Enterprise:{
        price: {
          amount:parseInt(enterprisePrice*100),
          isCurrencyPrefix: true, 
        }
      }
    }

    const s = new Service(reqBody);
    await s.save()

    await createPaymentGatewayObjects(s);
    return s;

  }

};


const getServiceForUser = () => {
  
}

module.exports = {
  queryServices,
  getServiceBySlug,
  getServiceById,
  createService,
  createPaymentGatewayObjects
};
