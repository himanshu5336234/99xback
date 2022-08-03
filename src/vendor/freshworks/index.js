const fetch = require('node-fetch');
const base64 = require('base-64');

class Freshworks { 
    
    constructor(){
        this.TOKEN = "2LqrDMQLPiREBgowZH3PZA"
        this.BASE_URL = "https://network99x.myfreshworks.com/crm/"
    }

    async _fetchRequest(path, postBody){
        
        let fetchOptions = {
            method: postBody ? 'POST':'GET',
            headers:{
                "Authorization":`Token token=${this.TOKEN}`,
                "Content-Type":"application/json"
            }
        }
        if(postBody) fetchOptions.body = JSON.stringify(postBody)
        return await fetch(`${this.BASE_URL}${path}`,fetchOptions).then(d=>d.json())

    }

    async createContact({first_name, last_name, mobile, email, ticket_size, source_id, custom_fields}){

        let payload = {
            "contact": {
                "first_name": first_name,
                "last_name": last_name,
                "mobile_number": mobile,
                "emails":[
                    {
                        "value": email
                    }
                ],
                "custom_field": {
                    "cf_ticket_size": ticket_size || 10
                },
                "lead_source_id": source_id || 1
            }
        }

        if(custom_fields) payload.contact.custom_field = {...payload.contact.custom_field, ...custom_fields}

        let res = await this._fetchRequest("sales/api/contacts", payload)
        
        return res

    }

}

module.exports = Freshworks