/* eslint-disable no-param-reassign */
/* eslint-disable import/newline-after-import */
/* eslint-disable no-console */
/* eslint-disable import/order */
/* eslint-disable spaced-comment */
/* eslint-disable prettier/prettier */
const httpStatus = require('http-status');
const { pick } = require('lodash');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { categoryService, serviceService } = require('../services');
const { convertToCurrency } = require("../services/currency");
const { ObjectId } = require("mongoose").Types;
const model = require('../models');


const parseService = async(req, Service) => {

  Service.startingPrice = await convertToCurrency(Service.startingPriceUnit, req.currency.THREE_LETTER, Service.startingPrice);
  Service.startingPriceSymbol = req.currency.SYMBOL;
  Service.startingPriceUnit = req.currency.THREE_LETTER;
  return Service;
}

const getAllCategory = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['show_on_home', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  

  if(req.site) filter.site_id = req.site;

  const result = await categoryService.queryCategory(filter, options);
  
  const NewResult = result.results.filter(r=>{
    return !r.is_archived;
  });

  res.json({
    results:NewResult
  });

});

const getCategory = catchAsync(async (req, res) => {
  const CategorySlug = req.params.id || req.query.id;
  const Category = await categoryService.getCategoryBySlug(CategorySlug);
  if (!Category) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
  }
  res.send(Category);
});


const getServicesByCategory = catchAsync(async (req, res) => {

  let category;
  const categoryIdOrSlug = req.query.id || req.params.id;
  const offset = parseInt(req.query.offset) || 0;
  const limit = parseInt(req.query.limit) || 100;

  let categoryid = "";
  let categorySlug = "";
  try{
    
    const o_categoryIdOrSlug = ObjectId(categoryIdOrSlug);

    category = await model.Category.findOne({id:categoryIdOrSlug});
    categoryid = categoryIdOrSlug;

  }catch(e){

    category = await model.Category.findOne({slug:categoryIdOrSlug});
    if(!category) res.json({success: false, message:"Invalid Category"})
    categoryid = category.id;
    categorySlug = categoryIdOrSlug; 

  }
  
  const ServiceQuery = {
    categories:categoryid
  };
  if(req.query.serviceType && (req.query.serviceType == "FIXED" || req.query.serviceType == "SUBSCRIPTION")) ServiceQuery.serviceType = req.query.serviceType;

  const Services = await model.Service.find(ServiceQuery)
  .skip(offset)
  .limit(limit)

  if (!Services) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Services not found');
  }

  for(let i = 0; i < Services.length; i++){
    const tempService = Services[i];
    Services[i] = await parseService(req, tempService);
  }
  
  res.json({
    category:{
      id:categoryid,
      slug:categorySlug, 
      title:category.title,
      subtitle: (category.subtitle)?category.subtitle:'',
      banners: category.banners
    },
    results: Services
  });
});

module.exports = {
  getAllCategory,
  getCategory,
  getServicesByCategory,
};
