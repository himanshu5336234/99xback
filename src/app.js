/* eslint-disable import/order */
/* eslint-disable vars-on-top */
/* eslint-disable object-shorthand */
/* eslint-disable no-var */
/* eslint-disable prefer-const */
/* eslint-disable prefer-destructuring */
/* eslint-disable camelcase */
const express = require('express');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const cors = require('cors');
const passport = require('passport');
const httpStatus = require('http-status');

const config = require('./config/config');
const morgan = require('./config/morgan');
const { jwtStrategy } = require('./config/passport');
const { authLimiter } = require('./middlewares/rateLimiter');
const parseCookie = require('./middlewares/parseCookie');
const routes = require('./routes/v1');
const { errorConverter, errorHandler } = require('./middlewares/error');
const ApiError = require('./utils/ApiError');
const fileUpload = require('express-fileupload')

const app = express();

app.use(cors())

if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// set security HTTP headers
// app.use(helmet());

// parse json request body
app.use(express.json({limit: '50mb'}));

// parse urlencoded request body
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// sanitize request data
app.use(xss());
app.use(mongoSanitize());

// gzip compression
app.use(compression());


app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 },
}));


var whitelist = [
  'https://99xstartup.w3dev-sites.com',
  'https://99xstartups.w3dev-sites.com',
  'https://99xseo.w3dev-sites.com',
  'https://99xstartup.w3dev-sites.com',
  'https://99x-meet.netlify.app',
  
  'https://99xstartup.com',
  'http://99xstartup.local',
  'https://startup.99x.network',
  'http://startup.99x.local',

  'https://99xcontent.com',
  'http://99xcontent.local',
  'https://content.99x.network',
  'http://content.99x.local',
  
  'https://99xdesign.com',
  'http://99xdesign.local',
  'https://design.99x.network',
  'http://design.99x.local',

  'https://99xseo.com',
  'http://99xseo.local',
  'https://seo.99x.network',
  'http://seo.99x.local',

  'https://99xstudio.com',
  'http://99xstudio.local',
  'https://studio.99x.network',
  'http://studio.99x.local',

  'http://admin.99x.local',
  'http://admin.99x.network',
  'http://manage.99x.local',
  'http://manage.99x.network',

  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3001/*',
  'http://localhost:8000'
]

app.use(cors())
app.options('*', cors())

// Parse Cookie
app.use(parseCookie);

app.all('/status-check',(req, res)=>{
  res.json({
    success: true
  })
})

// v1 api routes
app.use('/v1', routes);

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

module.exports = app;
