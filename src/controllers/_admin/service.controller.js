/* eslint-disable spaced-comment */
const httpStatus = require('http-status');
const { pick } = require('lodash');
const { ObjectId } = require("mongoose").Types;
const { isValidObjectId } = require('mongoose')
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const { serviceService } = require('../../services');
const { MicroService } = require('../../models');
const { v4 } = require('uuid');
const Str = require('@supercharge/strings')
const model = require('../../models');
const csvjson = require('csvjson');


/** Not Controller Function Start */

const generateUniqueSlugFromTitle = async function(title){
  let slug = "";
  slug = title.replace(/[\W_]+/g, '-').toLowerCase();
  slug += `-${Str.random(8)}`;
  return slug
};

/** Not Controller Function End */

const getAllService = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role', 'slug', 'is_archived']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  if(req.query.export){
    const service = await model.Service.find({})
    const AllService = [];

    for(let i=0; i<service.length; i++){
      const SingleService = service[i].toJSON();
      delete SingleService.paymentMeta;
      delete SingleService.faq;

      SingleService.categories = SingleService.categories.join(",");
      SingleService.list1 = SingleService.list1.join(",");
      SingleService.list2 = SingleService.list2.join(",");
      SingleService.availbleCountries = SingleService.availbleCountries.join(",");
      SingleService.tags = SingleService.tags.join(",");
      SingleService.banners = SingleService.banners.join(",");
      SingleService.microservices = SingleService.microservices.join(",");

      AllService.push(SingleService)
    }

    const csvData = csvjson.toCSV(AllService, {
      headers: 'key'
    });
    
    res.setHeader('content-type', 'application/csv');
    res.setHeader('content-disposition', 'attachment; filename=service.csv');
    res.send(csvData);

  }
  else{
    options.sortBy = "createdAt:desc";
    const result = await serviceService.queryServices(filter, options);
    return res.json(result);
  }

});

const getService = catchAsync(async (req, res) => {
  const Service = await serviceService.getServiceBySlug(req.params.id);
  if (!Service) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Service not found');
  }
  Service.categories = Service.categories.join(",");
  // Service.microservices = Service.microServices;
  
  Service['standard-multipler'] = 1;
  Service['premium-multipler'] = 1.5;
  Service['enterprise-multipler'] = 2;

  for(let i =0 ; i < Service.microservices.length; i++){
    Service.microservices[i].deliveryTime = Service.microservices[i].deliveryTime.value;
    Service.microservices[i].toolsUsed = Service.microservices[i].softwares.join(",");
    Service.microservices[i].includedServices = Service.microservices[i].items.join(",");
  }

  return res.send(Service);
});

const createService = catchAsync(async (req, res) => {

    const requiredFields = [
      'title', 
    //   'heading', 
      'subtitle', 
      'excerpt',
      'description',
      'serviceType',
      'categories',
      'site_id'
    ];
    
    // eslint-disable-next-line no-restricted-syntax
    for(const  field of requiredFields){
      if(req.body[field] === undefined) throw new Error(`${field} is required`)
    }

    const {title, heading, subtitle, excerpt, description, serviceType, startingPrice, banners, site_id } = req.body;
    let microServices = req.body['microServices'];

    // Optional Variable
    let { 
      slug,
      startingPriceUnit,
      startingPriceSuffix,
      sampleWork,
      orderCount,
      ratingValue,
      availbleCountries,
      tags, 
      categories,
      standard_multipler,
      premium_multipler,
      enterprise_multipler
    } = req.body;

    if(!slug){
      slug = await generateUniqueSlugFromTitle(title);
    }
  
    if(!startingPriceSuffix){
      startingPriceSuffix = "Per Item";
    }
    if(!startingPriceUnit){
      startingPriceUnit = "USD";
    }

    if(!sampleWork) sampleWork = '';
    if(!orderCount) orderCount = 100;
    if(!ratingValue) ratingValue = "4.5";
    if(!availbleCountries) availbleCountries = ["IN", "US"];
    if(!tags) tags = [];
    
    // if(!microServices){
    //   if(serviceType == 'FIXED')     
    //     throw new Error("Add atleast 1 micro service")
    // }

    // if(!banners){
    //   throw new Error("Add at least a Image");
    // }

    if(typeof categories == "string") categories = [categories];
    
    if(microServices){
      for(let i=0; i < microServices.length; i++){
        microServices[i].softwares = microServices[i].toolsUsed.split(",");
        microServices[i].items = microServices[i].includedServices.split(",");
      }
    }

    const Service = await serviceService.createService({
      site_id,
      title, 
      heading, 
      subtitle,
      slug, 
      banners,
      startingPrice,
      startingPriceSuffix, 
      startingPriceUnit,
      excerpt, 
      description, 
      tags,
      serviceType,
      categories,
      sampleWork, 
      orderCount, 
      ratingValue,
      availbleCountries,
      microServices,
      standard_multipler,
      premium_multipler,
      enterprise_multipler,
    });

    return res.json({
      success: true, 
      message:`Serviced added with ID ${Service.id}`,
      
    });

});

const editServiceNew = catchAsync(async(req, res)=>{

  let SearchServiceQuery = {}

  const ServiceId = req.params.slug;
  const payload = req.body;

  if(ServiceId.indexOf("-") == -1 && isValidObjectId(ServiceId)){
    SearchServiceQuery = {
      _id: ObjectId(ServiceId)
    }
  }else{
    SearchServiceQuery = {
      slug: ServiceId
    }
  }

  try{

    let ServiceObject = await model.Service.findOne(SearchServiceQuery)
    
    if(payload.features && payload.features.Standard 
      // && payload.features.Standard.list
      ){
      // ServiceObject.features.Standard.list = payload.features.Standard.list;
      ServiceObject.features.Standard.subtitle = payload.features.Standard.subtitle;
      // ServiceObject.features.Standard.delivery_in = payload.features.Standard.delivery_in;
    }
    
    if(payload.features && payload.features.Premium 
      // && payload.features.Premium.list
      ){
      // ServiceObject.features.Premium.list = payload.features.Premium.list;
      ServiceObject.features.Premium.subtitle = payload.features.Premium.subtitle;
      // // ServiceObject.features.Premium.delivery_in = payload.features.Premium.delivery_in;
    }

    if(payload.features && payload.features.Enterprise 
      // && payload.features.Enterprise.list
      ){
      // ServiceObject.features.Enterprise.list = payload.features.Enterprise.list;
      ServiceObject.features.Enterprise.subtitle = payload.features.Enterprise.subtitle;
      // // ServiceObject.features.Enterprise.delivery_in = payload.features.Enterprise.delivery_in;
    }

    if(ServiceObject.serviceType == "SUBSCRIPTION"){
      if(payload.startingPrice && parseInt(payload.startingPrice) != parseInt(ServiceObject.features.Standard.price.amount/100)){
        ServiceObject.startingPrice = payload.startingPrice;
        ServiceObject.features = {
          Standard:{
            ...ServiceObject.features.Standard,
            price: {
              ...ServiceObject.features.Standard.price,
              amount:parseInt(payload.startingPrice*100),
              isCurrencyPrefix: true,  
            }
          },
          Premium:{
            ...ServiceObject.features.Premium,
            price: {
              ...ServiceObject.features.Premium.price,
              amount:parseInt(payload.startingPrice*100),
              isCurrencyPrefix: true, 
            }
          },
          Enterprise:{
            ...ServiceObject.features.Enterprise,
            price: {
              ...ServiceObject.features.Enterprise.price,
              amount:parseInt(payload.startingPrice*100),
              isCurrencyPrefix: true, 
            }
          }
        }
      
        await ServiceObject.save()
        
        ServiceObject = await model.Service.findOne(SearchServiceQuery)
        await serviceService.createPaymentGatewayObjects(ServiceObject, true)

      }else{
        
        await ServiceObject.save()

      }
    }else{

      await ServiceObject.save()

    }

    return res.json({
      success: true, 
      message: "Data Updated",
      data: ServiceObject
    })

  }
  catch(e){

    return res.json({
      sucess: false, 
      error: e.message,
      stack: e
    })
  }

})

const editService = catchAsync(async (req, res) => {

    const serviceSlug = req.params.slug || null;

    const requiredFields = ['title', 'heading', 'subtitle', 'excerpt', 'description', 'serviceType', 'categories','site_id'];
    
    if(req.body && req.body.is_archived){

      await model.Service.findOneAndUpdate(
        {
          slug: serviceSlug,
        },
        {
          is_archived: true
        }
      );

    }
    else{
      // eslint-disable-next-line no-restricted-syntax
      for(const  field of requiredFields){
        if(req.body[field] === undefined) throw new Error(`${field} is required`)
      }

      const {title, heading, subtitle, excerpt, description, serviceType, microServices, startingPrice, banners } = req.body;
  

      // Optional Variable
      let { startingPriceUnit, startingPriceSuffix, sampleWork, orderCount, ratingValue, availbleCountries, tags, categories , site_id} = req.body;

    
      if(!startingPriceSuffix){
        startingPriceSuffix = "Per Item";
      }
      if(!startingPriceUnit){
        startingPriceUnit = "USD";
      }

      if(!sampleWork) sampleWork = '';
      if(!orderCount) orderCount = 100;
      if(!ratingValue) ratingValue = "4.5";
      if(!availbleCountries) availbleCountries = ["IN", "US"];
      if(!tags) tags = [];
      
      // if(!microServices){
      //   throw new Error("Add atleast 1 micro service")
      // }

      // if(!banners){
      //   throw new Error("Add at least a Image");
      // }

      if(typeof categories == "string") categories = [categories];
      
      if(microServices){
        for(let i=0; i < microServices.length; i++){
          microServices[i].softwares = microServices[i].toolsUsed.split(",");
          microServices[i].items = microServices[i].includedServices.split(",");
        }
      }

      const ServiceObject = await model.Service.findOne({slug:serviceSlug});

      // eslint-disable-next-line no-restricted-syntax
      for(const  field of requiredFields){
        ServiceObject[field] = req.body[field]
      }

      await ServiceObject.save();
      // await model.Service.findOne()
      
      // const Service = await serviceService.createService({
      //   title, 
      //   heading, 
      //   subtitle,
      //   banners,
      //   startingPrice,
      //   startingPriceSuffix, 
      //   startingPriceUnit,
      //   excerpt, 
      //   description, 
      //   tags,
      //   serviceType,
      //   categories,
      //   sampleWork, 
      //   orderCount, 
      //   ratingValue,
      //   availbleCountries,
      //   microServices
      // });
    }

    return res.send({
      succesS: true, 
      message:'Service Updated'
    });

});



const createMicroService = catchAsync(async (req, res) => {

  const serviceId = req.params.id;
  
  // Fixed Input
  const {serviceCategory, title, softwares, price, items, deliveryTime} = req.body;

  // Optional Variable
  let { slug, startingPriceSuffix } = req.body;

  if(!slug){
    slug = await generateUniqueSlugFromTitle(title);
  }

  if(!startingPriceSuffix){
    startingPriceSuffix = "USD";
  }

  const newGroup = await MicroService.create({
    parentService: ObjectId(serviceId),
    serviceCategory,
    title,
    slug,  
    softwares, 
    price,
    deliveryTime,
    items,
  });

  return res.json({
    success: true, 
    data: newGroup
  });


});

const Aws = require('aws-sdk');
Aws.config.update({region:'ap-south-1'});

const uploadAssetsCloudinary = catchAsync(async(req, res) => {

});

const uploadAssets = catchAsync(async(req, res)=>{

  const serviceId = req.params.id;
  if(!req.files || !req.files.file) return res.json({success:false, message:"Upload a valid file"});

  const mimeType = req.files.file.mimetype;
  const extension = mimeType.split("/")[1];

  const buffer = Buffer.from(req.files.file.data);
  const BodyBuffer= buffer.toString('base64');

  const payloadData = {
    Key: '',
    Body: req.files.file.data,
    //ContentEncoding: 'base64',
    ContentType: mimeType,
    ACL: 'public-read'
  };
 
  payloadData.Key = `public/services/${serviceId}/${v4()}.${extension}`;

  Aws.config.accessKeyId = "AKIATRXCQQT2JM5XTCMS";
  Aws.config.secretAccessKey = "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";
  Aws.config.update({region: "ap-south-1"});

  const AwsBucketName = "99xstartups";
  const AwsS3Bucket = new Aws.S3( { apiVersion: '2006-03-01', params: {Bucket: AwsBucketName} } );

  return AwsS3Bucket.putObject(payloadData, (err, data)=>{
    if(err){
      console.error(err);
      res.send(err)
    }else{
      return res.json({
        success: true, 
        data,
        src: payloadData.key
      })
    }
    
  })

});

module.exports = {
  getAllService,
  getService,
  createService,
  editService,
  editServiceNew,
  createMicroService,
  uploadAssets,
  uploadAssetsCloudinary
};
