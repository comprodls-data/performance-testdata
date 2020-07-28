const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
var arg2 = process.argv;
// console.log(arg2)
var folderNames={}
// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Drive API.
  authorize(JSON.parse(content), checkIfFolderExists);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Lists the names and IDs of up to 10 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */

function getDate()
{
  var today = new Date()
  var day = today.getDate()
  var month = today.getMonth()+1
  var year = today.getFullYear()
  var fname = day+'-'+month+'-'+year
  // console.log(fname)
  return fname;
}

function listFolderNames(auth,cb) {
  const drive = google.drive({version: 'v3', auth});
  drive.files.list({
  q: "parents='1ukDIIepQsvj7ZH8XaWkH0hFig89txl9A'",
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const files = res.data.files;
    if (files.length) {
      // console.log('Folders:');
      files.map((file) => {
        // console.log(`${file.name}`);
        folderNames[`${file.name}`]=`${file.id}`
      });
    } else {
      console.log('No Folders are present.');
      // cb();
    }
    cb();
  });
}

function createFolder(fname,auth){
  const drive = google.drive({version: 'v3', auth});
  var fileMetadata = {
    'name': fname,
    parents: ['1ukDIIepQsvj7ZH8XaWkH0hFig89txl9A'],
    'mimeType': 'application/vnd.google-apps.folder'
  };
  drive.files.create({
    resource: fileMetadata,
    fields: 'id'
  },
  function (err, file) {
    if (err) {
      console.error(err);
    } else {
      console.log('A New Folder has been created with name '+fname);
      // console.log(file)
      var folderId = file.data.id
      // console.log("folder id is"+folderId)
      uploadFiles(auth,folderId)
    }
  });
}

function uploadFiles(auth,folderId) {
  var fileName = arg2;
  // console.log(fileName.length)
  const drive = google.drive({version: 'v3', auth});
  if(arg2[2]=="NOT_REQUIRED")
  { 
    console.log("No file upload is needed in this scenario")
  }
  else {
    if(arg2[2]) {
      console.log("Files to be uploaded are:")
      for (var j=2; j<fileName.length;j++)
      {
        console.log(fileName[j])
      }
      for(i=2; i<arg2.length; i++) { 
        var fileName = arg2[i]
        // console.log("File to be Uploaded is "+fileName)
        var fileMetadata = {
        'name': arg2[i],
        parents: [folderId],
        'mimeType': 'text/csv'
        };
        var fileToUpload = arg2[i]
        var media = {
        mimeType: 'text/csv',
        body: fs.createReadStream('../bin/'+fileToUpload)
        };
        console.log("Uploading File "+fileToUpload)
        drive.files.create({
          resource: fileMetadata,
          media: media,
          fields: 'id'
        },
        function (err, file) {
          if (err) {
            // Handle error
            console.error(err);
          } else {
            // console.log(file.data.id)
            drive.files.get({
              fileId: file.data.id
            }, function (err1, file1) {
              if(err1) {
                console.log(err1)
              }
              else {
                // console.log(file1)
                console.log("Upload of file "+file1.data.name + " is successful")
              }
            })
            // console.log("Upload of file "+resource.name+" is Successful");
          }
        });
      }
    }
    else {
      console.log("Files to upload are not present in the argument list")
      process.exit(1);
    }
  }
}

function checkIfFolderExists(auth)
{
  var fname = getDate();
  // console.log("Folder to search for is: "+fname)
  listFolderNames(auth, function(){
    // console.log("Json of folders got are: ")
    // console.log(folderNames)
    if(folderNames.hasOwnProperty(fname)) {
      console.log("Folder with name "+fname+ " is already present in Drive")
      var folderId = folderNames[fname]
      // console.log("Folder id of the folder is: "+folderId)
      uploadFiles(auth,folderId)
    }
    else {
    // console.log("Folder is not present")
    createFolder(fname,auth)
    }
  })
}

