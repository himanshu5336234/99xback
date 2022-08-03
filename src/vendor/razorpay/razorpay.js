const fetch = require('node-fetch');

const BaseUrl =  "https://api.razorpay.com/v1/";
const KeyId = process.env.RAZORPAY_KEY_ID || "rzp_test_Sy9mAkGWSYjIS6";
const KeySecret = process.env.RAZORPAY_KEY_SECRET || "LCDmKMqWuj9Z4CJybpWnpDx8";
const AuthKey = Buffer.from(`${KeyId}:${KeySecret}`).toString('base64');
const ApiHeaders = {
    'Authorization':`Basic ${AuthKey}`,
    'Content-Type': 'application/json'
};

const CreateOrder = async(Currency, Amount) => {

    const Payload = {
        "amount": Amount,
        "currency": Currency,
        "receipt": "rcptid_11",
        "payment_capture": 1
    };    

    return fetch(`${BaseUrl}orders`,{
        method:'POST',
        headers:{
            'Authorization':`Basic ${AuthKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(Payload)
    }).then(r=>r.json());

}

const CreateSubscription = async(PlanID, start_at = 'now') => {
    
    const Payload = {
        "plan_id": PlanID,
        "total_count": 1,
        "quantity": 1,
        "customer_notify": 1
    };    

    // Trial
    if(start_at != 'now'){
        Payload.start_at = start_at;
    }

    return fetch(`${BaseUrl}subscriptions`,{
        method:'POST',
        headers:{
            'Authorization':`Basic ${AuthKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(Payload)
    }).then(r=>r.json());
    
}

const CreateRazorpayPlan = async(serviceId, PlanName, amount, currency,description, siteName, productPlan) =>{
    return fetch(`${BaseUrl}plans`,{
        method: 'POST',
        headers: {...ApiHeaders},
        body: JSON.stringify({
            period:'monthly',
            interval: 1,
            item:{
                name: PlanName,
                amount,
                currency,
                description,
            },
            notes:{
                site:siteName,
                plan:productPlan,
                serviceId,
            }
        })  
    }).then(r=>r.json())    
    .catch(e=>console.error(e));
}

module.exports = {
    CreateOrder,
    CreateSubscription,
    CreateRazorpayPlan
}