const fs = require('fs');
const google = require('googleapis').google;
const credentials = require('./myrv-serviceaccount-credentials.json');

// Gets the google JWT.
const auth = new google.auth.JWT(credentials.client_email, null, credentials.private_key, 'https://www.googleapis.com/auth/drive');
// Gets an instance of google drive with the JWT.
const drive = google.drive({version: 'v3', auth, encoding: null});

let pattern = /!LASTMONTH!/;
let replaceWith = () => {
  let today = new Date();
  today.setMonth(today.getMonth());
  let yyyy = today.getFullYear();
  let mm = today.getMonth()
  if (mm == 0) {
    mm = 12; yyyy = yyyy-1
  } else {
    mm = ('0' + mm).substr(-2);
  }
  return '' + yyyy + mm
}

// // Runs a create request (multipart) with the data provided.
credentials.files.forEach(f => {
  drive.files.update({
    uploadType: 'simple',
    fileId: f.id,
    media: {
      mimeType: f.type,
      body: fs.createReadStream(f.path.replace(pattern, replaceWith))
    }
  }).catch(err => {
      console.log(err);
  });
})
