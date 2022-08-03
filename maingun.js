const mailgun = require("mailgun-js");
const DOMAIN = 'mail1.99x.network';
const api_key = '5c9bc072d418d2d622fd314f53f0afe7-a3c55839-6514239b'
const mg = mailgun({apiKey: api_key, domain: DOMAIN});
const data = {
	from: 'no-reply@mail1.99x.network',
	to: 'ashutosh@w3dev.in',
	subject: 'Hello',
	text: 'Testing some Mailgun awesomness!'
};
mg.messages().send(data, function (error, body) {
    console.error(error)
	console.log(body);
});