/* eslint-disable no-lonely-if */
const countryCurrency = require('../data/country-currency');
const { UserConfig } = require('../models/user-config.model');
const { userService } = require('../services');
const CountryCurrencyMap = require('../data/country-currency');
const myCache = require('../utils/Cache');

const AllCurrencies = {
  USD: {
    THREE_LETTER: 'USD',
    SYMBOL: '$',
    IS_PREFIX: true,
    TITLE: 'United States Dollar (USD)'
  },
  EUR: {
    THREE_LETTER: 'EUR',
    SYMBOL: '€',
    IS_PREFIX: true,
    TITLE: 'Euro (EUR)'
  },
  GBP: {
    THREE_LETTER: 'GBP',
    SYMBOL: '£',
    IS_PREFIX: true,
    TITLE: 'Britsh Pound (GBP)'
  },
  AUD: {
    THREE_LETTER: 'AUD',
    SYMBOL: 'A$',
    IS_PREFIX: true,
    TITLE: 'Australlian Dollar (AUD)'
  },
  CAD: {
    THREE_LETTER: 'CAD',
    SYMBOL: 'C$',
    IS_PREFIX: true,
    TITLE: 'Canadian Dollar (CAD)'
  },
  INR: {
    THREE_LETTER: 'INR',
    SYMBOL: '₹',
    IS_PREFIX: true,
    TITLE: 'Indian Rupees (INR)'
  },
  ILS: {
    THREE_LETTER: 'ILS',
    SYMBOL: '₪',
    IS_PREFIX: true,
    TITLE: 'Israeli Shekel'
  },
  BRL: {
    THREE_LETTER: 'BRL',
    SYMBOL: 'R$',
    IS_PREFIX: true,
    TITLE: 'Brazilian Real'
  },
  HKD: {
    THREE_LETTER: 'HKD',
    SYMBOL: 'HK$',
    IS_PREFIX: true,
    TITLE: 'Hong Kong Dollar'
  },
  SEK: {
    THREE_LETTER: 'SEK',
    SYMBOL: 'kr',
    IS_PREFIX: true,
    TITLE: 'Swedish Krona'
  },
  NZD: {
    THREE_LETTER: 'NZD',
    SYMBOL: 'NZ$',
    IS_PREFIX: true,
    TITLE: 'New Zealand Dolla'
  },
  SGD: {
    THREE_LETTER: 'SGD',
    SYMBOL: 'S$',
    IS_PREFIX: true,
    TITLE: 'Singapore Dollar'
  },
  CHF: {
    THREE_LETTER: 'CHF',
    SYMBOL: 'CHF',
    IS_PREFIX: true,
    TITLE: 'Swiss Franc'
  },
  ZAR: {
    THREE_LETTER: 'ZAR',
    SYMBOL: 'R',
    IS_PREFIX: true,
    TITLE: 'South African Rand'
  },
  CNY: {
    THREE_LETTER: 'CNY',
    SYMBOL: '¥',
    IS_PREFIX: true,
    TITLE: 'Chinese Renminbi Yuan '
  },
  MYR: {
    THREE_LETTER: 'MYR',
    SYMBOL: 'RM',
    IS_PREFIX: true,
    TITLE: 'Malaysian Ringgit'
  },
  MXN: {
    THREE_LETTER: 'MXN',
    SYMBOL: '$',
    IS_PREFIX: true,
    TITLE: 'Mexican Peso'
  },
  PKR: {
    THREE_LETTER: 'PKR',
    SYMBOL: '₨',
    IS_PREFIX: true,
    TITLE: 'Pakistani Rupee'
  },
  PHP: {
    THREE_LETTER: 'PHP',
    SYMBOL: '₱',
    IS_PREFIX: true,
    TITLE: 'Philippine Peso'
  },
  TWD: {
    THREE_LETTER: 'TWD',
    SYMBOL: '฿',
    IS_PREFIX: true,
    TITLE: 'Thai Baht'
  },
  TRY: {
    THREE_LETTER: 'TRY',
    SYMBOL: '₺',
    IS_PREFIX: true,
    TITLE: 'Turkish New Lira'
  },
  AED: {
    THREE_LETTER: 'AED',
    SYMBOL: 'د.إ',
    IS_PREFIX: true,
    TITLE: 'United Arab Emirates Dirham'
  }
};

const setCurrency = (req, res, next) =>{

    req.currency = {
      THREE_LETTER: "USD",
      SYMBOL: "$",
      IS_PREFIX: true
    }


    if(req.user){
        
        const userId = req.user.id;

        // Mandatory Auth
        if(req.baseUrl == "/v1/cart"){

          return userService.getUserCheckoutCurrency(userId).then(userCurrency=>{

         
            if(userCurrency == "INR"){
                    
              req.currency = {
                  THREE_LETTER: "INR",
                  SYMBOL: "₹",
                  IS_PREFIX: true
              }

            }else{

                if(AllCurrencies[userCurrency]){
                    
                    req.currency = AllCurrencies[userCurrency];
                
                }else{
                    req.currency = {
                        THREE_LETTER: "USD",
                        SYMBOL: "$",
                        IS_PREFIX: true
                    }
                }

            }

            return next();

          })

        }else{

          return userService.getUserConfig(userId, 'currency').then(userCurrency=>{

            if(userCurrency){
  
              if(userCurrency == "INR"){
                      
                  req.currency = {
                      THREE_LETTER: "INR",
                      SYMBOL: "₹",
                      IS_PREFIX: true
                  }
  
              }else{
  
                  if(AllCurrencies[userCurrency]){
                      
                      req.currency = AllCurrencies[userCurrency];
                  
                  }else{
                      req.currency = {
                          THREE_LETTER: "USD",
                          SYMBOL: "$",
                          IS_PREFIX: true
                      }
                  }
  
              }
             
  
            }else{
  
              let defaultCurrency = "USD";
              if( req.headers['cf-ipcountry'] ){
                  const currencyIsoThree = CountryCurrencyMap[req.headers['cf-ipcountry']];
                  if(currencyIsoThree == "INR"){
                      
                      defaultCurrency = "INR";
                      req.currency = {
                          THREE_LETTER: "INR",
                          SYMBOL: "₹",
                          IS_PREFIX: true
                      }
  
                  }else{
  
                      if(AllCurrencies[userCurrency]){
                      
                          req.currency = AllCurrencies[userCurrency];
                      
                      }else{
                          req.currency = {
                              THREE_LETTER: "USD",
                              SYMBOL: "$",
                              IS_PREFIX: true
                          }
                      }
  
                  }
              }
  
              userService.setUserConfig(userId, {
                  currency: defaultCurrency
              }).then(d=>console.log(d))
  
              
  
            }
  
            return next();
            
          }).catch(e=>{
  
            console.error("Error Getting User Currency:", e)
            req.currency = {
                THREE_LETTER: "USD",
                SYMBOL: "$",
                IS_PREFIX: true
            }
            return next();
  
          })

        }
       
    

    }else{

        
        let currencyIsoThree = "USD";

        if( req.headers['cf-ipcountry'] ){
          currencyIsoThree = CountryCurrencyMap[req.headers['cf-ipcountry']];
        }
        
        let w3_user = null;
        if(req.cookie && req.cookie.w3_user)  w3_user = req.cookie.w3_user;
        if(req.query.w3_user)  w3_user = req.query.w3_user;
    
        if(w3_user){

          const userCurrency = myCache.get(`currency_${w3_user}`);

          if(userCurrency && userCurrency.length == 3){
            currencyIsoThree = userCurrency;
          }

        }

        if(AllCurrencies[currencyIsoThree]){

          req.currency = AllCurrencies[currencyIsoThree];
        
        }else{

          req.currency = {
            THREE_LETTER: "USD",
            SYMBOL: "$",
            IS_PREFIX: true
          }

        } 
        
     
       
        return next();

    }
        

}


module.exports = {
    setCurrency
}