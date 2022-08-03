const httpStatus = require('http-status');
const { pick } = require('lodash');
const { ObjectId } = require("mongoose").Types;
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const { serviceService } = require('../../services');
const model  = require('../../models');


const getHome = catchAsync(async (req, res) => {
  
    let topCategories = "";

});


module.exports = {
  getHome
}
