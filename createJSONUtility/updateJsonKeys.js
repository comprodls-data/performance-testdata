const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");
const createFile = require("./copyAndUpdateFilename.js");

var csvData;
var classProductPendingSubmissionData,
  classrecordsData,
  crossProdAggData,
  classProductUsersaggregationsData;
let fileNames = [];
var productName;
var csvFilePath = "./input/classDetails/input.csv";

// Function to read and parse CSV file
function readCSVFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        reject("Error reading the file: " + err);
        return;
      }

      // Split the CSV data into rows
      const rows = data.split("\n");

      // Split each row into columns and convert to an array of arrays
      const arrayData = rows.slice(1).map((row) => row.split(","));

      // Resolve with the array data
      resolve(arrayData);
    });
  });
}

function readJsonFiles(folderPath) {
  console.log("reading json files");
  return new Promise((resolve, reject) => {
    console.log(folderPath);

    fs.readdir(folderPath, (err, files) => {
      if (err) {
        return reject(err);
      }

      const jsonFiles = [];
      fileNames = [];
      const readPromises = files
        .map((filename) => {
          const filePath = path.join(folderPath, filename);
          if (path.extname(filename) === ".json") {
            return new Promise((res, rej) => {
              fs.readFile(filePath, "utf-8", (err, data) => {
                if (err) {
                  return rej(err);
                }
                try {
                  jsonFiles.push(JSON.parse(data));
                  fileNames.push(filename);

                  res();
                } catch (parseErr) {
                  rej(parseErr);
                }
              });
            });
          }
        })
        .filter((p) => p); // Filter out undefined values for non-JSON files

      Promise.all(readPromises)
        .then(() => {
          console.log("json files read");
          resolve(jsonFiles);
        })
        .catch(reject);
    });
  });
}

function createClassProductPendingSubmissionJson(obj, newKeys, category) {
  console.log(
    "--------ClassProductPendingSubmission Json Creation STARTED----------------\n"
  );

  const outputFolder = "./output/classproductpendingsubmissions";
  const outputFolder_cat = path.join(outputFolder, category);
  if (!fs.existsSync(outputFolder_cat)) {
    console.log("Creating Folder: ", `${outputFolder_cat}`)
    fs.mkdirSync(outputFolder_cat, { recursive: true });
  }
  let classIds = newKeys.map((subArray) => subArray[0]);
  let uniqueClassIds = [...new Set(classIds)];
  for (let i = 0; i <= uniqueClassIds.length - 1; i++) {
    if (i == 0) {
      let old_files = fs.readdirSync(outputFolder_cat);
      for (const old_file of old_files) {
        const filePath = path.join(outputFolder_cat, old_file);
        fs.unlinkSync(filePath);
      }
      console.log(`${outputFolder_cat}` + " CLEARED");
    }
    let userIdsOfClass = [];
    for (let j = 0; j < newKeys.length; j++) {
      if (newKeys[j][0] == uniqueClassIds[i])
        userIdsOfClass.push(newKeys[j][1]);
    }
    
    for (let j = 0; j < obj.length; j++) {
      let regex = /Id-product-([^-]+)--class/;
      const match = fileNames[j].match(regex);
      if (match && match[1]) {
        productName = match[1];
      }

      let keyToAdd = {
        "1544591089661/1544591412698/1544591582869": { timestamp: Date.now() },
      };
      let newObj = {};
      for (let k = 0; k < 100; k++) {
        if (userIdsOfClass[k] != undefined)
          newObj[userIdsOfClass[k]] = keyToAdd;
      }
      let newObj1 = {};
      newObj1["items"] = newObj;
      newObj1.countPendingSubmissions = 100;
      const fileName = `Id-product-${productName}--class-${uniqueClassIds[i]}.json`;
      saveJsonToFile(outputFolder_cat, fileName, newObj1);
      console.log("Completed creating ClassProductPendingSubmission json");
    }
  }
  console.log(
    "--------ClassProductPendingSubmission Json Creation ENDED----------------\n==============================================================="
  );
}

function createCrossProductAggJson(obj, newKeys, category) {
  console.log(
    "--------CrossProductAgg Json Creation STARTED----------------\n"
  );

  const outputFolder = "./output/crossproductagg"; // The folder where the file will be saved
  const outputFolder_cat = path.join(outputFolder, category);
  if (!fs.existsSync(outputFolder_cat)) {
    console.log("Creating Folder: ", `${outputFolder_cat}`)
    fs.mkdirSync(outputFolder_cat, { recursive: true });
  }
  let classIds = newKeys.map((subArray) => subArray[0]);
  let uniqueClassIds = [...new Set(classIds)];
  for (let i = 0; i <= uniqueClassIds.length - 1; i++) {
    if (i == 0) {
      let old_files = fs.readdirSync(outputFolder_cat);
      for (const old_file of old_files) {
        const filePath = path.join(outputFolder_cat, old_file);
        fs.unlinkSync(filePath);
      }
      console.log(`${outputFolder_cat}` + " CLEARED");
    }
    let userIdsOfClass = [];
    for (let j = 0; j < newKeys.length; j++) {
      if (newKeys[j][0] == uniqueClassIds[i])
        userIdsOfClass.push(newKeys[j][1]);
    }
    for (let j = 0; j < obj.length; j++) {
      const originalKeys = Object.keys(obj[j]);
      let objToUpdate = obj[j];
      let newIndex = 0;
      originalKeys.forEach((key) => {
        if (objToUpdate.hasOwnProperty(key)) {
          if (key == "meta" || key == "debug") {
            if (key == "debug") {
              objToUpdate.debug.lastUpdatedTime = Date.now()
            }
          } else {
            if (userIdsOfClass[newIndex] != undefined) {
              objToUpdate[userIdsOfClass[newIndex]] = objToUpdate[key];
              delete objToUpdate[key];
            } else {
              delete objToUpdate[key];
            }

            newIndex++;
          }
        }
      });
      const fileName = `Id-class-${uniqueClassIds[i]}.json`;
      saveJsonToFile(outputFolder_cat, fileName, objToUpdate);
      console.log("Completed creating createCrossProductAggJson");
    }
  }
  console.log(
    "--------CrossProductAgg Json Creation ENDED----------------\n==============================================================="
  );
}

function createClassrecordJson(obj, newKeys, category) {
  console.log("--------classRecord Json Creation STARTED----------------\n");
  const outputFolder = "./output/classrecords";
  const outputFolder_cat = path.join(outputFolder, category);
  if (!fs.existsSync(outputFolder_cat)) {
    console.log("Creating Folder: ", `${outputFolder_cat}`)
    fs.mkdirSync(outputFolder_cat, { recursive: true });
  }
  let classIds = newKeys.map((subArray) => subArray[0]);
  let uniqueClassIds = [...new Set(classIds)];
  for (let i = 0; i <= uniqueClassIds.length - 1; i++) {
    if (i == 0) {
      let old_files = fs.readdirSync(outputFolder_cat);
      for (const old_file of old_files) {
        const filePath = path.join(outputFolder_cat, old_file);
        fs.unlinkSync(filePath);
      }
      console.log(`${outputFolder_cat}` + " CLEARED");
    }
    let userIdsOfClass = [];
    for (let j = 0; j < newKeys.length; j++) {
      if (newKeys[j][0] == uniqueClassIds[i])
        userIdsOfClass.push(newKeys[j][1]);
    }

    for (let j = 0; j < obj.length; j++) {
      const originalKeys = Object.keys(obj[j]);
      let objToUpdate = obj[j];
      let regex = /Id-product-([^-]+)--class/;
      const match = fileNames[j].match(regex);
      if (match && match[1]) {
        productName = match[1];
      }
      let newIndex = 0;
      originalKeys.forEach((key) => {
        if (objToUpdate.hasOwnProperty(key)) {
          if (key == "meta" || key == "debug") {
          } else {
            if (userIdsOfClass[newIndex] == undefined) {
              delete objToUpdate[key];
            } else {
              objToUpdate[userIdsOfClass[newIndex]] = objToUpdate[key];
              delete objToUpdate[key];
            }
            newIndex++;
          }
        }
      });
      const fileName = `Id-product-${productName}--class-${uniqueClassIds[i]}.json`;
      saveJsonToFile(outputFolder_cat, fileName, objToUpdate);
      console.log("Completed creating classRecord json");
    }
  }
  console.log(
    "--------classRecord Json Creation ENDED----------------\n==============================================================="
  );
}

function createClassProductUsersaggregations(obj, newKeys, category) {
  //obj->contains all the input files in category folder
  //newKeys->data from input.csv file

  console.log(
    "--------ClassProductUsersaggregations Json Creation STARTED----------------\n"
  );
  const outputFolder = "./output/classproductusersaggregations"; // The folder where the file will be saved
  const outputFolder_cat = path.join(outputFolder, category); // changes path according to category folder.
  if (!fs.existsSync(outputFolder_cat)) {
    console.log("Creating Folder: ", `${outputFolder_cat}`)
    fs.mkdirSync(outputFolder_cat, { recursive: true });
  }
  let classIds = newKeys.map((subArray) => subArray[0]);
  let uniqueClassIds = [...new Set(classIds)];
  for (let i = 0; i <= uniqueClassIds.length - 1; i++) {
    if (i == 0) {
      let old_files = fs.readdirSync(outputFolder_cat);
      for (const old_file of old_files) {
        const filePath = path.join(outputFolder_cat, old_file);
        fs.unlinkSync(filePath);
      }
      console.log(`${outputFolder_cat}` + " CLEARED");
    }
    let userIdsOfClass = [];
    for (let j = 0; j < newKeys.length; j++) {
      if (newKeys[j][0] == uniqueClassIds[i])
        userIdsOfClass.push({
          dlsUserId: newKeys[j][1],
          firstName: newKeys[j][2],
          lastName: newKeys[j][3],
        });
    }

    for (let j = 0; j < obj.length; j++) {
      const originalKeys = Object.keys(obj[j]);
      let objToUpdate = obj[j];
      let regex = /Id-product-([^-]+)--class/;
      const match = fileNames[j].match(regex);
      if (match && match[1]) {
        productName = match[1];
      }

      let newIndex = 0;
      originalKeys.forEach((key) => {
        if (objToUpdate.hasOwnProperty(key)) {
          {
            if (userIdsOfClass[newIndex] == undefined) {
              delete objToUpdate[key];
            } else {
              objToUpdate[userIdsOfClass[newIndex].dlsUserId] =
                objToUpdate[key];
              delete objToUpdate[key];
              objToUpdate[userIdsOfClass[newIndex].dlsUserId].meta.fn =
                userIdsOfClass[newIndex].firstName;
              objToUpdate[userIdsOfClass[newIndex].dlsUserId].meta.ln =
                userIdsOfClass[newIndex].lastName;
              delete objToUpdate[userIdsOfClass[newIndex].dlsUserId].meta.email;
              objToUpdate[userIdsOfClass[newIndex].dlsUserId].meta["username"] =
                userIdsOfClass[newIndex].firstName;
            }
            newIndex++;
          }
        }
      });
      const fileToCreate = `Id-product-${productName}--class-${uniqueClassIds[i]}.json`;
      saveJsonToFile(outputFolder_cat, fileToCreate, objToUpdate);
      console.log("Completed creating ClassProductUserAggregation json");
    }
  }
  console.log(
    "--------ClassProductUsersaggregations Json Creation ENDED----------------\n==============================================================="
  );
}

function saveJsonToFile(outputFolder, fileName, jsonData) {
  // Ensure the output folder exists
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }

  // Define the file path
  const filePath = path.join(outputFolder, fileName);

  // Convert JSON data to string
  const jsonString = JSON.stringify(jsonData); // pretty-print JSON with 2 spaces

  // Write JSON string to file
  fs.writeFileSync(filePath, jsonString, "utf8");
  console.log(`JSON data saved to ${filePath}`);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createJsons() {
  try {
    let folderPath, jsonData;
    csvData = await readCSVFile(csvFilePath);

    console.log("CSV Data Read: ");
    const categoryData = {};

    // Loop through the csvData array
    csvData.forEach((row) => {
      const category = row[row.length - 1].trim();

      if (category) {
        // Skip empty rows or rows without a valid category
        if (!categoryData[category]) {
          categoryData[category] = [];
        }
        categoryData[category].push(row);
      }
    });

    for (const category in categoryData) {
      if (categoryData.hasOwnProperty(category)) {
        folderPath = "./input/classproductpendingsubmissions/" + `${category}` + "/";
        jsonData = await readJsonFiles(folderPath);

        createClassProductPendingSubmissionJson(
          jsonData,
          categoryData[category],
          category
        );
        folderPath = "./input/crossproductagg/" + `${category}` + "/";
        jsonData = await readJsonFiles(folderPath);
        createCrossProductAggJson(jsonData, categoryData[category], category);

        folderPath = "./input/classrecords/" + `${category}` + "/";
        jsonData = await readJsonFiles(folderPath);
        createClassrecordJson(jsonData, categoryData[category], category);

        folderPath = "./input/classproductusersaggregations/" + `${category}` + "/";
        jsonData = await readJsonFiles(folderPath);
        createClassProductUsersaggregations(jsonData, categoryData[category] , category);
      }
    }
  } catch (error) {
    console.error("Error reading files:", error);
  }
}

//  create userprogress json
console.log("--------UserProgress Json Creation STARTED----------------\n")
createFile.copyAndUpdateFilename("userprogress");
console.log("--------UserProgress Json Creation ENDED----------------\n===============================================================")


// create classproductitemsaggregations json
console.log("--------ClassProductItemsAggregations Json Creation STARTED----------------\n");
createFile.copyAndUpdateFilename("classproductitemsaggregations");
console.log("--------ClassProductItemsAggregations Json Creation ENDED----------------\n===============================================================")

//create usersubmissions json
console.log("--------User Submission Json Creation STARTED----------------\n")
createFile.copyAndUpdateFilename("usersubmissions");
console.log("--------User Submission Json Creation Ended ----------------\n")
createJsons();
