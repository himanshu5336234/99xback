/**
 * @Paypal Subscription Document
 * https://developer.paypal.com/docs/archive/subscriptions/#billing-plans
 * 
 */
const fetch = require('node-fetch');
const base64 = require('base-64');

class Paypal{

    constructor(){
        
        this.CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
        this.CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET

        this.access_token = null;

        if(process.env.PAYPAL_MODE && process.env.PAYPAL_MODE.toLocaleLowerCase() == "live"){
            this.base_url = "https://api.paypal.com/v1";
            this.base_url_v2 = "https://api.paypal.com/v2";
        }
        else{
            this.base_url = "https://api.sandbox.paypal.com/v1";
            this.base_url_v2 = "https://api.sandbox.paypal.com/v2";
        }
        
        

    }

    async _GenerateAccessToken(){

        const AuthHeader = `Basic ${base64.encode(`${this.CLIENT_ID}:${this.CLIENT_SECRET}`)}`;

        return await fetch(`${this.base_url}/oauth2/token?grant_type=client_credentials`,{
            method:'POST',
            headers:{
                "Authorization": AuthHeader,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
        }).then(d=>d.json()).then(r=>{
            
            this.access_token = r.access_token;

        });

    }

    async _PaypalFetch(PaypalPath, {
        method = 'GET',
        body
    }){

        const path = this.base_url + PaypalPath;

        if(!this.access_token) await this._GenerateAccessToken();

        const payload = {
            method: method,
            headers:{
                "Authorization":`Bearer ${this.access_token}`,
                "Content-Type":"application/json"
            },
        };

        if(method == "POST" && body){
            payload['body'] = JSON.stringify(body)
        }
        

        return fetch(
            path,
            payload
        ).then(r=>r.json());
    }

    async createProduct(ServiceId, ServiceTitle){

        const PayPalProductPayload = {
            name: ServiceTitle,
            description: ServiceTitle,
            type:"SERVICE",
            category:"SOFTWARE",
        }
        
        const PaypalProduct = await this._PaypalFetch("/catalogs/products",{
            method:"POST",
            body: PayPalProductPayload
        })

        return PaypalProduct
    }

    async createBillingPlan(PlanName, PaypalProductId, Amount){
        
        let  Currency = 'USD';
        const BillingPlan = await this._PaypalFetch(`/billing/plans`,{
            method:'POST',
            body:{
                product_id: PaypalProductId,
                name:PlanName,
                description: `Price for ${PlanName}`,
                type:'fixed',
                billing_cycles:[
                    {
                        frequency: {
                            interval_unit: "DAY",
                            interval_count: 3
                        },
                        tenure_type: "TRIAL",
                        sequence: 1,
                        total_cycles: 1
                    },
                    {
                        frequency: {
                            interval_unit: "MONTH",
                            interval_count: 3
                        },
                        tenure_type: "REGULAR",
                        sequence: 2,
                        total_cycles: 12,
                        pricing_scheme:{
                            fixed_price:{
                                value: Amount, 
                                currency_code:"USD"
                            }
                        }
                    }
                ],
                payment_preferences:{
                    auto_bill_outstanding: true, 
                    setup_fee:{
                        value: 0, 
                        currency_code:'USD'
                    },
                    setup_fee_failure_action:"CONTINUE",
                    payment_failure_threshold: 5
                },
                taxes: {
                    percentage: "0",
                    inclusive: true
                }
            }
        });

        return BillingPlan;

    }

    async getOrderDetails(OrderId){
        return this._PaypalFetch(`checkout/orders/${OrderId}`)
    }

}

module.exports = Paypal;