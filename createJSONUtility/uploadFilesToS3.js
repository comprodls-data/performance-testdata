const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

AWS.config.update({
  accessKeyId: 'AKIA3GQ2G33CBVIL7KNL',     // Replace with your access key
  secretAccessKey: 'Bj51nvAkgjjistQO8SpRKZ2ySwbhMrNipc8emMbN', // Replace with your secret key
  region: 'us-west-2'                     // e.g., 'us-east-1'
});

// Configure AWS SDK
const s3 = new AWS.S3({
  region: 'us-west-2', // Replace with your AWS region
});

function createLimiter(max) {
  let active = 0;
  const queue = [];

  const next = () => {
    if (queue.length > 0 && active < max) {
      active++;
      const { fn, resolve, reject } = queue.shift();
      fn()
        .then(resolve)
        .catch(reject)
        .finally(() => {
          active--;
          next();
        });
    }
  };

  return function limit(fn) {
    return new Promise((resolve, reject) => {
      queue.push({ fn, resolve, reject });
      next();
    });
  };
}

/* ---------------------------
   Upload a single file
---------------------------- */
const uploadFileToS3 = async (bucketName, filePath, s3Key) => {
  const fileStream = fs.createReadStream(filePath);

  const params = {
    Bucket: bucketName,
    Key: s3Key,
    Body: fileStream,
  };

  try {
    await s3.upload(params).promise();
    console.log(`✅ Uploaded: ${s3Key}`);
  } catch (error) {
    console.error(`❌ Failed: ${s3Key}`, error);
    throw error;
  }
};

/* ---------------------------
   Async generator: walk dir
---------------------------- */
async function* walkDir(dir) {
  const items = await readdir(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stats = await stat(fullPath);

    if (stats.isDirectory()) {
      yield* walkDir(fullPath);
    } else if (item.endsWith('.json')) {
      yield fullPath;
    }
  }
}

/* ---------------------------
   Upload folder with limiter
---------------------------- */
const uploadFolder = async (dir, bucketName, s3Folder) => {
  const maxConcurrent = s3Folder === 'classrecords' ? 10 : 200;
  const limit = createLimiter(maxConcurrent);

  const tasks = [];
  for await (const filePath of walkDir(dir)) {
    const fileName = path.basename(filePath);
    const s3Key = `cup1/orgs/perf-test1-alpha/${s3Folder}/${fileName}`;
    tasks.push(limit(() => uploadFileToS3(bucketName, filePath, s3Key)));
  }

  await Promise.all(tasks);
};

/* ---------------------------
   Main
---------------------------- */
const main = async () => {
  const bucketName = 'dls-cup-alpha-db-service-collections';
  const outputFolder = 'output';
  const topLevelFolders = [
    'classproductitemsaggregations',
    'classproductpendingsubmissions',
    'classproductusersaggregations',
    'crossproductagg',
    'userprogress',
    'usersubmissions',
    'classrecords',
  ];

  try {
    for (const folder of topLevelFolders) {
      const folderPath = path.join(outputFolder, folder);

      if (fs.existsSync(folderPath)) {
        const subFolders = await readdir(folderPath);

        for (const subFolder of subFolders) {
          const subFolderPath = path.join(folderPath, subFolder);

          if ((await stat(subFolderPath)).isDirectory()) {
            console.log(`📂 Processing: ${folder}/${subFolder}`);
            await uploadFolder(subFolderPath, bucketName, folder);
          }
        }
      } else {
        console.log(`⚠️ Folder "${folder}" does not exist. Skipping.`);
      }
    }

    console.log('🎉 All files uploaded successfully!');
  } catch (error) {
    console.error('🚨 Error uploading files:', error);
  }
};

main().catch((error) => console.error('Unexpected error:', error));

// Recursive function to find all JSON files in a directory
// const findAllJsonFiles = async (dir) => {
//   let results = [];
//   const items = await readdir(dir);

//   for (const item of items) {
//     const fullPath = path.join(dir, item);
//     const stats = await stat(fullPath);

//     if (stats.isDirectory()) {
//       const subDirResults = await findAllJsonFiles(fullPath);
//       results = results.concat(subDirResults);
//     } else if (item.endsWith('.json')) {
//       results.push(fullPath);
//     }
//   }

//   return results;
// };

// // Function to upload files with limited concurrency
// const uploadFilesWithLimitedConcurrency = async (files, bucketName, s3Folder) => {
//   const uploadQueue = [];

//   if (s3Folder == "classrecords") {
//     MAX_CONCURRENT_UPLOADS = 10;
//   } else {
//     MAX_CONCURRENT_UPLOADS = 100;
//   }
//   for (const filePath of files) {
//     console.log(MAX_CONCURRENT_UPLOADS)
//     const fileName = path.basename(filePath);
//     const s3Key = `cup1/orgs/perf-test1-alpha/${s3Folder}/${fileName}`;
    
//     // Start upload and add to queue
//     const uploadPromise = uploadFileToS3(bucketName, filePath, s3Key);
//     uploadQueue.push(uploadPromise);

//     // If the queue reaches the max concurrent uploads limit, wait for one to finish
//     if (uploadQueue.length >= MAX_CONCURRENT_UPLOADS) {
//       await Promise.race(uploadQueue);
// 	  uploadQueue.splice(0, uploadQueue.findIndex((p) => p.isFulfilled) + 1); 
//     }
//   }

//   // Wait for all remaining uploads to complete
//   await Promise.all(uploadQueue);
// };

// // Main function to upload folder-by-folder
// const main = async () => {
//   const bucketName = 'dls-cup-alpha-db-service-collections';
//   const outputFolder = 'output';
//   const topLevelFolders = ['classproductitemsaggregations', 'classproductpendingsubmissions', 'classproductusersaggregations', 'crossproductagg', 'userprogress', 'usersubmissions', 'classrecords'];

//   try {
//     for (const folder of topLevelFolders) {
//       const folderPath = path.join(outputFolder, folder);

//       if (fs.existsSync(folderPath)) {
//         const subFolders = await readdir(folderPath);
        
//         for (const subFolder of subFolders) {
//           const subFolderPath = path.join(folderPath, subFolder);

//           // Ensure the path is a directory
//           if ((await stat(subFolderPath)).isDirectory()) {
//             console.log(`Processing folder: ${folder}/${subFolder}`);

//             const files = await findAllJsonFiles(subFolderPath);
//             console.log(`Found ${files.length} JSON files in ${folder}/${subFolder}`);

//             await uploadFilesWithLimitedConcurrency(files, bucketName, `${folder}`);
//           }
//         }
//       } else {
//         console.log(`Folder "${folder}" does not exist. Skipping.`);
//       }
//     }

//     console.log('All files uploaded successfully!');
//   } catch (error) {
//     console.error('Error uploading files:', error);
//   }
// };

// main().catch((error) => console.error('Unexpected error:', error));
