const RESPONSE_CODE = {

    /** Standard HTTP Codes */
    OK: 200, 
    CREATED: 201, 
    ACCEPTED: 202, // 
    NO_CONTENT: 204, 
    
    ERROR: 400,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401, 
    PAYMENT_REQUIRED: 402, 
    FORBIDDEN: 403, 
    NOT_FOUND: 404, 
    METHOD_NOT_ALLOWED: 405, 
    REQUEST_TIMEOUT: 408,

    TOO_MANY_REQUEST: 429,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503, 
    GATEWAY_TIMEOUT: 504,

    /** Standard HTTP Codes END */

};

const ApiSuccessResponse = (...args) =>{

    const res = args[0];
    const responsePayload = {success: true};
    
    if(args[1]){
        if(typeof args[1] == "object"){
            responsePayload.data = args[1];
        }
        if(typeof args[1] == "string"){
            responsePayload.message = args[1];
        }
    }

    if(args[2]){
        if(typeof args[2] == "object"){
            responsePayload.data = args[2];
        }
        if(typeof args[2] == "string"){
            responsePayload.message = args[2];
        }
    }

    res.status(RESPONSE_CODE.OK).json(responsePayload);

};

const ApiFailureResponse = (...args) =>{

    const res = args[0];

    const responsePayload = {success: false};
    
    if(args[1]){
        if(typeof args[1] == "object"){
            responsePayload.data = args[1];
        }
        if(typeof args[1] == "string"){
            responsePayload.message = args[1];
        }
    }

    if(args[2]){
        if(typeof args[2] == "object"){
            responsePayload.data = args[2];
        }
        if(typeof args[2] == "string"){
            responsePayload.message = args[2];
        }
    }
    return res.status(RESPONSE_CODE.ERROR).json(responsePayload);
    
};

const ApiSuccessResponseCreated = (...args) => {

    const res = args[0];
    return res.status(RESPONSE_CODE.CREATED).json({

    })
}

module.exports = {
    ApiSuccessResponse,
    ApiFailureResponse,
    ApiSuccessResponseCreated,
}