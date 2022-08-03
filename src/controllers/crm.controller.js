const model = require("../models")
const catchAsync = require('../utils/catchAsync');

const FreshworksObject = require("../vendor/freshworks")
const FreshWorks = new FreshworksObject()

const GetDemo = catchAsync(async (req, res)=>{

    const payload = req.body;
    let {first_name, last_name, email, phone,  job_title} = payload

    FreshWorks.createContact({
        first_name, 
        last_name, 
        email, 
        mobile: phone, 
        source_id: 2,
        ticket_size: 11,
        custom_fields:{
            "Job Title": job_title
        }
    })

    return res.json({
        success: true, 
        message:"Query Received"
    })
})
const SaveLead = catchAsync(async (req, res)=>{

    const payload = req.body;
    console.log({payload});
    const {name, phone, email} = payload

    let contact = await FreshWorks.createContact({
        display_name:name, 
        first_name:name,
        email, 
        mobile: phone, 
        source_id: 2,
        ticket_size: 11,
    })
// console.log(JSON.stringify(contact));
    return res.json({
        success: true, 
        message:"Query Received"
    })
})

module.exports = {
    GetDemo, SaveLead
}