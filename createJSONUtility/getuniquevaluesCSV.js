const fs = require('fs');
const csv = require('fast-csv');

// Function to remove duplicates from an array
function removeDuplicates(array) {
    return Array.from(new Set(array));
}

// Function to process CSV file synchronously
// function processCSVSync(inputFilePath, outputFilePath, columnName) {
//     const columnValues = [];

//     const fileContent = fs.readFileSync(inputFilePath, 'utf-8');
//     csv.parseString(fileContent, {
//         headers: true,
//         ignoreEmpty: true,
//         trim: true
//     })
//     .on('data', (row) => {
//         columnValues.push(row[columnName]);
//     })
//     .on('end', () => {
//         const uniqueValues = removeDuplicates(columnValues);
//         const outputData = ['Unique_' + columnName].concat(uniqueValues);
//         const csvData = outputData.join('\n');

//         fs.writeFileSync(outputFilePath, csvData);

//         console.log(`Column "${columnName}" extracted and duplicates removed. Saved to ${outputFilePath}`);
//     });
// }


//
function processCSVSync(inputFilePath, outputFilePath, classidColumn, categoryColumn) {
    const uniqueEntries = {};

    // Read and parse the CSV file
    fs.createReadStream(inputFilePath)
        .pipe(csv.parse({ headers: true, ignoreEmpty: true, trim: true }))
        .on('data', (row) => {
            const classid = row[classidColumn];
            const category = row[categoryColumn];
            // Only store the first occurrence of a unique classid
            if (!uniqueEntries[classid]) {
                uniqueEntries[classid] = category;
            }
        })
        .on('end', () => {
            // Prepare output data (including headers)
            const outputData = [['classid', 'category']];
            for (const [classid, category] of Object.entries(uniqueEntries)) {
                outputData.push([classid, category]);
            }

            // Write the output data to a CSV file
            const writeStream = fs.createWriteStream(outputFilePath);
            csv.write(outputData, { headers: true })
                .pipe(writeStream)
                .on('finish', () => {
                    console.log(`Unique classid and corresponding category saved to ${outputFilePath}`);
                });
        });
}

// Example usage
//const inputFilePath = 'input.csv';
//const outputFilePath = 'output.csv';
//onst columnName = "classid";

//processCSVSync(inputFilePath, outputFilePath, columnName);
module.exports = { processCSVSync };