const cookie = require('cookie');

const parseCookies = (req, res, next) => {
  
    if(req.headers.cookie){
        req.cookie = cookie.parse(req.headers.cookie);
    }

    next();

}

module.exports = parseCookies