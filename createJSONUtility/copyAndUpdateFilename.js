const fs = require('fs');
const fsp = require('fs').promises; // Using fs.promises for async operations
const csv = require('csv-parser');
const path = require('path');
const getuniquevaluesCSV = require('./getuniquevaluesCSV.js');

async function copyAndUpdateFilename(type) {
    try {
        let sourceFolder, destinationFolder, startInitial, endInitial, csvFilePath, csvcolumn;

        if (type == 'userprogress') {
            sourceFolder = "./input/userprogress/";
            destinationFolder = "./output/userprogress/";
            startInitial = "-user-";
            endInitial = "--product";
            csvFilePath = "./input/classDetails/input.csv";
            csvcolumn = "uuid";
            
            const rows = await readCSV(csvFilePath);

            for (const row of rows) {
                if (row[csvcolumn]) {
                    const newValue = row[csvcolumn];
                    const category = row["category"];
                    const categorySourceFolder = path.join(sourceFolder, category);
                    const categoryDestinationFolder = path.join(destinationFolder, category);
                    try {
                        // Check if the destination folder exists, if not create it
                        await ensureDirectoryExists(categoryDestinationFolder);

                        // Read files from the source folder
                        const files = await fsp.readdir(categorySourceFolder);
                        const jsonFiles = files.filter(file => file.endsWith('.json'));

                        // Process each JSON file
                        for (const jsonFile of jsonFiles) {
                            const oldFilePath = path.join(categorySourceFolder, jsonFile);
                            const newFileName = updateFileName(jsonFile, startInitial, endInitial, newValue);
                            const newFilePath = path.join(categoryDestinationFolder, newFileName);

                            // Copy JSON file to the destination folder and update its name
                            await fsp.copyFile(oldFilePath, newFilePath);
                            console.log(`JSON file "${jsonFile}" copied and renamed to "${newFileName}"`);
                        }
                    } catch (err) {
                        console.error('Error reading or copying files:', err);
                    }
                } else {
                    console.error(`CSV file should have columns named ${csvcolumn}`);
                }
            }
        } else if (type == 'classproductitemsaggregations') {
            sourceFolder = "./input/classproductitemsaggregations/";
            destinationFolder = "./output/classproductitemsaggregations/";
            startInitial = "--class-";
            endInitial = ".json";
            csvFilePath = "./input/classDetails/input.csv";
            await getuniquevaluesCSV.processCSVSync(csvFilePath, "./input/classDetails/uniqueClass.csv", "classid", "category");
            csvcolumn = "classid";
            csvFilePath = "./input/classDetails/uniqueClass.csv";
            
            const rows = await readCSV(csvFilePath);

            for (const row of rows) {
                if (row[csvcolumn]) {
                    const newValue = row[csvcolumn];
                    const category = row["category"];
                    const categorySourceFolder = path.join(sourceFolder, category);
                    const categoryDestinationFolder = path.join(destinationFolder, category);
                    try {
                        // Check if the destination folder exists, if not create it
                        await ensureDirectoryExists(categoryDestinationFolder);

                        // Read files from the source folder
                        const files = await fsp.readdir(categorySourceFolder);
                        const jsonFiles = files.filter(file => file.endsWith('.json'));

                        // Process each JSON file
                        for (const jsonFile of jsonFiles) {
                            const oldFilePath = path.join(categorySourceFolder, jsonFile);
                            const newFileName = updateFileName(jsonFile, startInitial, endInitial, newValue);
                            const newFilePath = path.join(categoryDestinationFolder, newFileName);

                            // Copy JSON file to the destination folder and update its name
                            await fsp.copyFile(oldFilePath, newFilePath);
                            console.log(`JSON file "${jsonFile}" copied and renamed to "${newFileName}"`);
                        }
                    } catch (err) {
                        console.error('Error reading or copying files:', err);
                    }
                } else {
                    console.error(`CSV file should have columns named ${csvcolumn}`);
                }
            }


        } else if (type == 'usersubmissions') {
            sourceFolder = "./input/usersubmissions/";
            destinationFolder = "./output/usersubmissions/";
            startInitial = "-user-";
            endInitial = "--product";
            csvFilePath = "./input/classDetails/input.csv";
            csvcolumn = "uuid";

            const rows = await readCSV(csvFilePath);

            for (const row of rows) {
                if (row[csvcolumn]) {
                    const newValue = row[csvcolumn];
                    const category = row["category"];
                    const categorySourceFolder = path.join(sourceFolder, category);
                    const categoryDestinationFolder = path.join(destinationFolder, category);
                    try {
                        // Check if the destination folder exists, if not create it
                        await ensureDirectoryExists(categoryDestinationFolder);

                        // Read files from the source folder
                        const files = await fsp.readdir(categorySourceFolder);
                        const jsonFiles = files.filter(file => file.endsWith('.json'));

                        // Process each JSON file
                        for (const jsonFile of jsonFiles) {
                            const oldFilePath = path.join(categorySourceFolder, jsonFile);
                            const newFileName = updateFileName(jsonFile, startInitial, endInitial, newValue);
                            const newFilePath = path.join(categoryDestinationFolder, newFileName);

                            // Copy JSON file to the destination folder and update its name
                            await fsp.copyFile(oldFilePath, newFilePath);
                            console.log(`JSON file "${jsonFile}" copied and renamed to "${newFileName}"`);
                        }
                    } catch (err) {
                        console.error('Error reading or copying files:', err);
                    }
                } else {
                    console.error(`CSV file should have columns named ${csvcolumn}`);
                }
            }
        } else {
            throw new Error("Invalid parameter");
        }
    } catch (error) {
        console.error("Error processing:", error);
    }
}

async function readCSV(filePath) {
    const rows = [];
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath) // Use regular fs for reading CSV
            .pipe(csv())
            .on('data', (row) => {
                rows.push(row);
            })
            .on('end', () => {
                resolve(rows);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}

function updateFileName(fileName, startInitial, endInitial, newValue) {
    const startIndex = fileName.indexOf(startInitial);
    const endIndex = fileName.indexOf(endInitial) + endInitial.length;
    const substringToUpdate = fileName.substring(startIndex, endIndex);
    return fileName.replace(substringToUpdate, startInitial + newValue + endInitial);
}

async function ensureDirectoryExists(dirPath) {
    try {
        await fsp.access(dirPath); // Using fs.promises for access
    } catch (error) {
        // If directory does not exist, create it
        if (error.code === 'ENOENT') {
            await fsp.mkdir(dirPath, { recursive: true }); // Creating directory with fs.promises
        } else {
            throw error;
        }
    }
}

module.exports = { copyAndUpdateFilename };
