/* eslint-disable prettier/prettier */
module.exports.Token = require('./token.model');
module.exports.User = require('./user.model');
module.exports.UserConfig = require('./user-config.model');
module.exports.Category = require('./category.model');
module.exports.Service = require('./service.model');
// module.exports.ChildServiceGroup = require('./child-service-group.model');
// module.exports.ChildService = require('./child-service.model');
module.exports.MicroService = require('./micro-service');
module.exports.Cart = require('./cart.model');
module.exports.Payment = require('./payment.model');
module.exports.Order = require('./order.model');
module.exports.OrderThread = require('./order-thread.model');
module.exports.OrderThreadChild = require('./order-thread-child.model');
module.exports.GuestUser = require('./guest-user.model');
module.exports.UserTeam = require('./user-team.model');

module.exports.UserPayout = require('./user-payout.model')
module.exports.UserEarning = require('./user-earning.model')
module.exports.UserInvite = require("./user-invite.model")
module.exports.Coupon = require('./coupon.model')