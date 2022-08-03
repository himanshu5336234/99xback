const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const jwt = require('jsonwebtoken');
const { authService, userService, tokenService, emailService } = require('../services');

const register = catchAsync(async (req, res) => {

  const payload = req.body;
  payload.username = payload.email.replaceAll(/[^a-zA-Z0-9]/g, "");

  const user = await userService.createUser(payload);
  const tokens = await tokenService.generateAuthTokens(user);
  res.status(httpStatus.CREATED).send({ user, tokens });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  res.send({ user, tokens });
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.query.token, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

const switchUserMode = catchAsync(async (req, res)=>{

  let userType = req.body.user_type;
  if(req.body.user_type == 2) userType = 2
  else userType = 1

  let NewUser = req.user;
  NewUser.type = userType;
  
  const NewToken = jwt.sign({
    user: NewUser
  }, process.env.JWT_SECRET);
  return res.json({
    success: true, 
    data: {
      type: userType,
      token: NewToken
    }
  })

})

module.exports = {
  register,
  login,
  refreshTokens,
  forgotPassword,
  resetPassword,
  switchUserMode
};
