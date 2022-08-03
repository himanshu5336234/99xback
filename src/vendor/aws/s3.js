const AWS = require('./aws')
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
})

const putObject = (file) => {

    return new Promise((resolve, reject)=>{
        // Binary data base64
        const fileContent  = Buffer.from(file.data, 'binary');

        const BUCKET_NAME = process.env.AWS_S3_BUCKET

        var timestamp = Math.floor(new Date().getTime() / 1000);
        var params = {
            Bucket: BUCKET_NAME, 
            Key: `u/${timestamp}-${file.name}` , 
            Body: fileContent,
            ACL:'public-read'
        };

        // Uploading files to the bucket
        s3.upload(params, function(err, data) {
            if (err) {
                reject(err);
            }

            data['Location'] = `https://static.99x.network/${data.Key}`
            resolve(data.Location)
        });
    })
    
}

module.exports = {putObject}