/* eslint-disable no-console */
/* eslint-disable prettier/prettier */
const httpStatus = require('http-status');
const { Category, Service } = require('../models');
const ApiError = require('../utils/ApiError');

const queryCategory = async (filters, options) => {
  return Category.paginate(filters, options);
};

const getCategoryBySlug = async (slug) => {
  const service = Category.findOne({ slug });
  if (!service) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Service Not Found');
  }
  return service;
};

const getServicesByCategoryId = async (categoryId, filters, options) => {
  const services = Service.paginate(filters, options).find({
    categoryId,
  })
  if (!services) {
    throw new ApiError(httpStatus.NOT_FOUND, 'services Not Found');
  }
  return services;
};

const createCategory = async (reqBody) => {
  if (await Category.isSlugTaken(reqBody.site_id, reqBody.slug)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Slug is already taken');
  }
  const s = await Category.create(reqBody);
  return s;
};

module.exports = {
  queryCategory,
  getCategoryBySlug,
  createCategory,
  getServicesByCategoryId,
};
