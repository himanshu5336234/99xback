const httpStatus = require('http-status');
const { pick } = require('lodash');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { serviceService, } = require('../services');
const { ChildServiceGroup, ChildService } = require('../models');
const { ObjectId } = require("mongoose").Types;
const { convertToCurrency } = require("../services/currency");

const getAllService = catchAsync(async (req, res) => {

  const filter = pick(req.query, ['name', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  if(req.query.export){
    const service = await serviceService.queryServices({},{});
    return res.json(service);  
  }
  else{
    const result = await serviceService.queryServices(filter, options);
    return res.json(result);
  }
  

});

const getService = catchAsync(async (req, res) => {
  
  const Service = await serviceService.getServiceBySlug(req.params.id);
  if (!Service) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Service not found');
  }
  // for(let i = 0; i < Service.microService.length; i++){
  //   Service.microService[i].prices = {
  //     "Standard": Service.microService[i].price
  //   }
  // }

  Service.microService = Service.microservices;

  Service.startingPrice = await convertToCurrency(Service.startingPriceUnit, req.currency.THREE_LETTER, Service.startingPrice);
  Service.startingPriceSymbol = req.currency.SYMBOL;
  Service.startingPriceUnit = req.currency.THREE_LETTER;

  if(Service.serviceType == "FIXED"){

    for(let i = 0; i < Service.microService.length; i++){

      const intialCurrency = Service.microService[i].price.currency;
      const intialAmount = Service.microService[i].price.amount;

      Service.microService[i].price.isCurrencyPrefix = req.currency.IS_PREFIX;
      Service.microService[i].price.currencySymbol = req.currency.SYMBOL;
      Service.microService[i].price.currency = req.currency.THREE_LETTER;
      Service.microService[i].price.amount = await convertToCurrency(intialCurrency, req.currency.THREE_LETTER, intialAmount);

    }
    delete Service.microservices;
    if(Service.OldmicroService) delete Service.OldmicroService;

  }else if(Service.serviceType == "SUBSCRIPTION"){

    Service.features['Standard'].price.amount = await convertToCurrency(Service.features['Standard'].price.currency, req.currency.THREE_LETTER, Service.features['Standard'].price.amount)
    Service.features['Standard'].price.currency = req.currency.THREE_LETTER;
    Service.features['Standard'].price.currencySymbol = req.currency.SYMBOL;
    
    Service.features['Premium'].price.amount = await convertToCurrency(Service.features['Premium'].price.currency, req.currency.THREE_LETTER, Service.features['Premium'].price.amount)
    Service.features['Premium'].price.currency = req.currency.THREE_LETTER;
    Service.features['Premium'].price.currencySymbol = req.currency.SYMBOL;
    
    Service.features['Enterprise'].price.amount = await convertToCurrency(Service.features['Enterprise'].price.currency, req.currency.THREE_LETTER, Service.features['Enterprise'].price.amount)
    Service.features['Enterprise'].price.currency = req.currency.THREE_LETTER;
    Service.features['Enterprise'].price.currencySymbol = req.currency.SYMBOL;
    
  }
 
  res.send(Service);
});

const getServiceById = catchAsync(async (req, res) => {
  
  const Service = await serviceService.getServiceById(req.params.id);
  if (!Service) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Service not found');
  }
  // for(let i = 0; i < Service.microService.length; i++){
  //   Service.microService[i].prices = {
  //     "Standard": Service.microService[i].price
  //   }
  // }
  
  // Apply Curreny
  Service.startingPrice = await convertToCurrency(Service.startingPriceUnit, req.currency.THREE_LETTER, Service.startingPrice);
  Service.startingPriceUnit = req.currency.THREE_LETTER;

  for(let i = 0; i < Service.microService.length; i++){

    const intialCurrency = Service.microService[i].price.currency;
    const intialAmount = Service.microService[i].price.amount;

    Service.microService[i].price.isCurrencyPrefix = req.currency.IS_PREFIX;
    Service.microService[i].price.currencySymbol = req.currency.SYMBOL;
    Service.microService[i].price.currency = req.currency.THREE_LETTER;
    Service.microService[i].price.amount = await convertToCurrency(intialCurrency, req.currency.THREE_LETTER, intialAmount);

  }

  res.send(Service);
});

const getChildServiceByServiceId = catchAsync(async (req, res) => {
  
  const serviceId = req.params.id;
  ChildServiceGroup.find({
    parentService:ObjectId(serviceId)
  });

});

module.exports = {
  getAllService,
  getService,
  getServiceById,
  getChildServiceByServiceId
};
