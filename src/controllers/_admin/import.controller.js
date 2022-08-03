/* eslint-disable vars-on-top */
/* eslint-disable no-var */
const httpStatus = require('http-status');
const { pick } = require('lodash');
const { ObjectId } = require("mongoose").Types;
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const { serviceService } = require('../../services');
const model  = require('../../models');

const fs = require('fs');
const util = require('util');

const readFile = util.promisify(fs.readFile);

const csv = require('csvtojson')

const ImportServiceWithMicroService = async (req, res) => {

    const csvFilePath =  "./src/controllers/_admin/_import/service.csv";
    const csv2FilePath =  "./src/controllers/_admin/_import/micro-service.csv";
    
    //const data = await (await readFile("./src/controllers/_admin/_import/service.csv")).toString();
    const data = await csv({
        noheader:true,
        output: "csv"
    }).fromFile(csvFilePath);
    
    const data2 = await csv({
        noheader:true,
        output: "csv"
    }).fromFile(csv2FilePath);
    
    const n = [];
    
    // eslint-disable-next-line no-plusplus
    for(let i = 0; i < data.length; i++){
       
        var d = {
            heading: data[i][0],
            title: data[i][3],
            subtitle: data[i][4],
            slug: data[i][5],
            excerpt: data[i][11],
            startingPrice: data[i][7],
            startingPriceUnit: data[i][8],
            startingPriceSuffix: data[i][9],
            description: data[i][10] || "  Description Here ",
            sampleWork: data[i][11],
            orderCount: data[i][12],
            ratingValue: data[i][13],
            availbleCountries:["IN", "US"],
            serviceType:"SUBSCRIPTION",
            tags:data[i][14].split(",").map(e=>e.trim()),
            categories:[data[i][2]],
            banners:data[i][16].split(",").map(e=>e.trim())
        }
        const r = await serviceService.createService(d);
        

        for(let j = 1;  j < data2.length; j++){
            if(data2[j][1].trim() == data[i][5].trim()){
                await model.MicroService.create({
                    parentService: ObjectId(r.id),
                    serviceCategory:'Standard',
                    title:data2[j][2],
                    slug:data2[j][3],
                    softwares:data2[j][4].split(",").map(e=>e.trim()),
                    items:data2[j][5].split(",").map(e=>e.trim()),
                    deliveryTime:{
                        unit:'day',
                        value:1
                    }
                });
            }else{
                console.log("Comparision Failed:", data2[j][1], data[i][5]);
            }
        }

        n.push(d);
    }
    

    res.send(n);

}

const importData = catchAsync(async (req, res) => {

    const csvFilePath =  "./src/controllers/_admin/_import/service.csv";
    const csv2FilePath =  "./src/controllers/_admin/_import/micro-service.csv";
    
    //const data = await (await readFile("./src/controllers/_admin/_import/service.csv")).toString();
    const data = await csv({
        noheader:true,
        output: "csv"
    }).fromFile(csvFilePath);
    
    const data2 = await csv({
        noheader:true,
        output: "csv"
    }).fromFile(csv2FilePath);
    
    const n = [];

    const getCategoryBySlug = async (slug) => {

        const catObject = await model.Category.findOne({slug});
        

        const catId = catObject ? catObject._id:null;
        console.log("Category Object", slug, catId);

        return catId;
    }
    
    // eslint-disable-next-line no-plusplus
    for(let i = 1; i < data.length; i++){
       
        var serviceCategories = [];
        
        if(data[i][0].indexOf(",") == -1){
            
            serviceCategories = [await getCategoryBySlug(data[i][0].trim())];

        }else{

            const cats = data[i][0].split(",");
            const catIds = [];
            for(let ii = 0; ii < cats.length; ii++){
                
                const cId = await getCategoryBySlug(cats[ii].trim());
                catIds.push(cId);

            }

            serviceCategories = catIds;
    
        }
        var d = {
            heading: data[i][3],
            title: data[i][2],
            subtitle: data[i][3],
            slug: data[i][4],
            excerpt: data[i][5],
            startingPrice: data[i][6],
            startingPriceUnit: data[i][7],
            startingPriceSuffix: data[i][8],
            description: data[i][9] || "  Description Here ",
            sampleWork: data[i][10],
            orderCount: data[i][11],
            ratingValue: data[i][12],
            availbleCountries:["IN", "US"],
            serviceType:data[i][1],
            tags:data[i][13].split(",").map(e=>e.trim()),
            categories: serviceCategories,
            banners:data[i][15].split(",").map(e=>e.trim())
        }
       
        // return res.json(d);
        const r = await serviceService.createService(d);
        
        for(let j = 1;  j < data2.length; j++){

            if(data2[j][0].trim() == data[i][4].trim()){

                const MicroServicePayload = {
                    parentService: ObjectId(r.id),
                    serviceCategory:'Standard',
                    title:data2[j][1],
                    slug:data2[j][2],
                    softwares:data2[j][3].split(",").map(e=>e.trim()),
                    items:data2[j][4].split(",").map(e=>e.trim()),
                    price:{
                        isCurrencyPrefix: true,
                        currencySymbol:"$",
                        currency: data[i][7],
                        amount: data[i][6],
                        unit: data[i][8]
                    },  
                    prices: JSON.stringify({
                        "Standard":{
                            isCurrencyPrefix: true,
                            currencySymbol:"$",
                            currency: data[i][7],
                            amount: data[i][6],
                            unit: data[i][8]
                        },                       
                        "Premium":{
                            isCurrencyPrefix: true,
                            currencySymbol:"$",
                            currency: data[i][7],
                            amount: data[i][6],
                            unit: data[i][8]
                        },                        
                        "Enterprise":{
                            isCurrencyPrefix: true,
                            currencySymbol:"$",
                            currency: data[i][7],
                            amount: data[i][6],
                            unit: data[i][8]
                        }                        
                    }),  
                    deliveryTime:{
                        unit:'day',
                        value:1
                    }
                };

                await model.MicroService.create(MicroServicePayload).catch(e=>{
                
                })

            }else{

                console.log("Comparision Failed:", data2[j][0], data[i][4]);

            }

        }

        n.push(d);

    }
    

    res.send(n);
   

});


module.exports = {
  importData
}
