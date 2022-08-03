require("dotenv").config()
const nodemailer = require('nodemailer');
const config = require('../config/config');
var mg = require('nodemailer-mailgun-transport');

var mgAuth = {
  auth: {
    api_key: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN
  }
}


const transport = nodemailer.createTransport(mg(mgAuth));

/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @returns {Promise}
 */
const sendEmail = async (to, subject, text) => {
  
  const msg = { from: config.email.from, to, subject, text };

  await transport.sendMail(msg);
  return true
};

/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendResetPasswordEmail = async (to, token) => {
  const subject = 'Reset password';
  const resetPasswordUrl = `http://api.99x.network/reset-password?token=${token}`;
  const text = `Dear user,
  To reset your password, click on this link: ${resetPasswordUrl}
  If you did not request any password resets, then ignore this email.`;
  await sendEmail(to, subject, text);
};


const sendSignupOtp = async(email, code) => {
  
  const Subject = `99xStartup Confirmation code : ${code}`;
  const Body = `Your signup code for signing up on 99xStartup is ${code}`;
  await sendEmail(email, Subject, Body);

}

const sendLoginOtp = async(email, code) => {

  const Subject = `99xStartup Confirmation code : ${code}`;
  const Body = `Your login code for logging in to 99xStartup is ${code}`;
  await sendEmail(email, Subject, Body);

}

const sendInviteToUser = async(invite_to, invite_code, inviter_name) => {

  const Subject = `${inviter_name} is inviting you to join team on 99xApps`;
  const Body = `Join team by clicking on the link: https://startup.99x.network/invite/${invite_code}`;
  await sendEmail(invite_to, Subject, Body)

}

// (async function(){
//   try{

//     await sendEmail("manoj@w3dev.email","Testing","Test")

//   }catch(e){
//     console.error(e)
//   }
// })();

module.exports = {
  transport,
  sendEmail,
  sendResetPasswordEmail,
  sendLoginOtp, 
  sendSignupOtp,
  sendInviteToUser
};
