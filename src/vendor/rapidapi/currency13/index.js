/* eslint-disable import/no-extraneous-dependencies */
// Imported From https://rapidapi.com/apiworker.com/api/currency-converter13?
const fetch = require("node-fetch");
const NodeCache = require( "node-cache" );

const myCache = new NodeCache();

const ConvertCurrency = async(from, to, amount)=>{
    

    const RequestQuery = {
        "amount": 1,
        "from": from,
        "to": to
    };

    const CacheKey = `${from}_${to}`;
    const cachedConvAmount = myCache.get(CacheKey);
    
    if(cachedConvAmount == undefined){

        const res = await fetch(`https://currency-converter13.p.rapidapi.com/convert?from=${RequestQuery.from}&to=${RequestQuery.to}&amount=${RequestQuery.amount}`,{
            method:'GET',
            headers:{
                "x-rapidapi-host": "currency-converter13.p.rapidapi.com",
                "x-rapidapi-key": "ae7cd5833amsh35041e4a5601ec6p13c356jsn6cad260e07ef",
                "useQueryString": true
            },
        })
        .then(r=>r.json());
        
        const newAmount = res.amount;
        if(newAmount){

            myCache.set(CacheKey, newAmount, 3600);
            return parseFloat(newAmount*amount).toFixed(2);
        
        }

    }else{
        
        return parseFloat(cachedConvAmount*amount).toFixed(2);
        
    }

    
};

module.exports = {
    ConvertCurrency
};