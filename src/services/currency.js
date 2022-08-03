const {ConvertCurrency} = require('../vendor/rapidapi/currency13');

const convertToCurrency = async (from, to, value) => {

    if(from == to) return value;

    if(from == "USD" && to == "INR"){
        return value*75;
    }

    const NewValue = await ConvertCurrency(from, to, value);
    
    return NewValue;

}

module.exports = {
    convertToCurrency
}