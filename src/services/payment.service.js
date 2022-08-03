const PaypalObject = require('../vendor/paypal/index');

const Paypal = new PaypalObject();


const PaypalOrderDetails = async(OrderId) =>{

    return Paypal.getOrderDetails(OrderId);

}

module.exports = {
    PaypalOrderDetails
}