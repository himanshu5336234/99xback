const Stripe = require('stripe');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const CreateStripeProduct = async(serviceId, serviceTitle) =>{
    
    const product = await stripe.products.create({
        id: serviceId,
        name: serviceTitle,
    });

    return product;

}

const CreateStripeProductPricing = async(PlanName, ProductId, amount, currency) => {

    const unit_amount = amount;
    const price = await stripe.prices.create({
        unit_amount,
        currency: currency,
        recurring: {interval: 'month'},
        nickname: PlanName,
        product: ProductId,
    });

    return price;
}


const CreateCharge = async() => {

    const charge = await stripe.charges.create({
        amount: 2000,
        currency: 'usd',
        source: 'tok_mastercard',
        description: 'My First Test Charge (created for API docs)',
    });

    
};

const CreateStripeSubscription = async(customerId, priceId, trial_end = 'now') => {

    const subscription = await stripe.subscriptions.create({
        customer: customerId,
        trial_end,
        collection_method:'charge_automatically',
        items: [
          {price: priceId},
        ],
     }).catch(e=>{throw new Error(e)});

     
    let invoice = null;
    // if(subscription.status !== "active"){
    //     invoice = await stripe.invoices.pay(
    //         subscription.latest_invoice
    //     );
    // }

    return {
        subscription,
        invoice
    };
}

const CreateStripeCustomer = async(name, email, address) => {

    const Customer = await stripe.customers.create({
        description:' IT Services',
        name,
        email, 
        address
    });

    return Customer;

};

const CreatePaymentIntent = async({
    amount,
    currency, 
    customer = {
        name,
        email,
        address
    },
}) => {

    const StripeCustomer = await CreateStripeCustomer(
        customer.name,
        customer.email,
        customer.address
    );

    const customerId = StripeCustomer.id;

    const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        customer:customerId,
        description:'IT Services',
        payment_method_types: ['card'],
    });

    return paymentIntent;

}
const LinkPaymentMethodToCustomer = async(paymentMethodId, customerId) =>{
    try{

        const paymentMethod = await stripe.paymentMethods.attach(
            paymentMethodId,
            {customer: customerId}
        );

        const customer = await stripe.customers.update(
            customerId,
            {
                invoice_settings: {
                    default_payment_method: paymentMethodId
                },
                address:{
                    line1:"Market Ex",
                    state:"Delhi",
                    country:"IN",
                    postal_code:"110020",
                }
            }
        );

        return [paymentMethod, customer];
    
    }catch(e){

        throw new Error(e)
    
    }
}

const GetPaymentMethod = async(paymentMethodId) => {

    try{
        
        const pm = await stripe.paymentMethods.retrieve(
            paymentMethodId
        );

        return pm;
        
    }
    catch(e){

        throw new Error(e)

    }
}

module.exports = {
    CreateCharge,
    CreatePaymentIntent,
    CreateStripeProduct,
    CreateStripeProductPricing,
    CreateStripeCustomer,
    CreateStripeSubscription,
    LinkPaymentMethodToCustomer,
    GetPaymentMethod
}