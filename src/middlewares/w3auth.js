/* eslint-disable no-lonely-if */

const jwt = require('jsonwebtoken');

const optionalAuth = (req, res, next) => {

    let w3_auth = null;
    if(req.cookie && req.cookie.w3_auth) w3_auth = req.cookie.w3_auth;

    if(req.query.w3_auth) w3_auth = req.query.w3_auth;

        if(w3_auth){

            return jwt.verify(w3_auth, process.env.JWT_SECRET, (err, data)=>{
            
                if(!err){
                    req.user = data.user;
                    return next();
            
                }else{

                    console.error("INVALID_AUTH");
                    return next()
                    // res.status(500).json({
                    //     success: false, 
                    //     message: "Invalid Auth"
                    // });
                }
            });
        }else{
            
         return next()

        }
};

const mandatoryAuth = (req, res, next) => {

    let w3_auth = null;
    if(req.cookie && req.cookie.w3_auth) w3_auth = req.cookie.w3_auth;
    if(req.query.w3_auth) w3_auth = req.query.w3_auth;
    
    let w3_cart = null;
    if(req.cookie && req.cookie.w3_auth) w3_auth = req.cookie.w3_auth;
    if(req.query.w3_auth) w3_auth = req.query.w3_auth;

    if(w3_auth || w3_cart){

        // User is Logged IN 
        if(w3_auth){
            jwt.verify(w3_auth, process.env.JWT_SECRET, (err, data)=>{
                if(!err){
                    req.user = data.user;
                    next();
                }else{
                    res.status(500).json({
                        success: false, 
                        message: "Invalid Auth"
                    });
                }
            });
        }

        // Not to be entertained
        else if(w3_cart){
            res.status(500).json({
                success: false, 
                message: "User must be logged in "
            });
        }

    }else{

        if(req.headers.authorization){

            const authHeader = req.headers.authorization;
            const userToken = authHeader.substring(7, authHeader.length)
            
            jwt.verify(userToken, process.env.JWT_SECRET, (err, data)=>{
                if(!err){

                    req.user = data.user;
                    next();

                }else{
                    res.status(500).json({
                        success: false, 
                        message: "Invalid Auth"
                    });
                }
            })

        }else{

            return res.status(500).json({
                success: false, 
                message: "Invalid Request"
            });

        }
        

    }   

};

module.exports = {
    optionalAuth,
    mandatoryAuth
}