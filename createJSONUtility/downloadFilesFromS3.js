var AWS = require('aws-sdk');
var fs = require('fs');
var csv = require('csv-parser');
var path = require('path');

// AWS.config.update({
//   accessKeyId: '<access_key>',     // Replace with your access key
//   secretAccessKey: '<secret_key>', // Replace with your secret key
//   region: 'us-west-2'                     // e.g., 'us-east-1'
// });

var s3 = new AWS.S3();

var downloadJsonFromS3 = (bucketName, objectKey, downloadPath) => {
  var params = {
    Bucket: bucketName,
    Key: objectKey
  };
  
  var dir = path.dirname(downloadPath);
  if (!fs.existsSync(dir)) {
    console.log("Creating Folder: ", `${dir}`)
    fs.mkdirSync(dir, { recursive: true });
  }

  // Create a writable stream to the file
  var file = fs.createWriteStream(downloadPath);

  // Get the file from S3 and pipe it to the writable stream
  s3.getObject(params)
    .createReadStream()
    .pipe(file)
    .on('finish', () => {
      console.log("Successfully downloaded");
    })
    .on('error', (error) => {
      console.error('Error downloading file:', error);
    });
};

fs.createReadStream('inputFilesForDownload.csv') // Path to your CSV file
  .pipe(csv())
  .on('data', (row) => {
    // Access specific columns in each row
    var folderPath = row['folderPath'];
    var folderName = row['folderName'];
    var category = row['category'];
    var fileName = row['fileName'];
    
    var bucketName = 'dls-cup-alpha-db-service-collections';
    var objectKey = folderPath + folderName + "/" + fileName + ".json"; // Path in S3
    var downloadPath = 'input/' + folderName + "/" + category + "/" + fileName + '.json';          // Local path where you want to save the file

    downloadJsonFromS3(bucketName, objectKey, downloadPath);
    // Example: You can perform any logic for each record here
  })
  .on('end', () => {
    console.log('CSV file successfully processed');
  })
  .on('error', (error) => {
    console.error('Error reading CSV file:', error);
  });
