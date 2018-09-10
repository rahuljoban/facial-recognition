var apiKey;
var azure = require('azure-storage');
var blobSvc;
var webcam = require('./webcam');
var toStream = require('blob-to-stream')
const settings = require('electron-settings');

var userName;
var stud_id;
var imgData;
var database;

var response = document.getElementById('response');

$(function() {
  database = settings.get('database.database');
  var location;
  if (database == 'bc-dunbar1') {
    location = "Dunbar";
  } else if (database == 'on-toronto') {
    location = "Toronto";
  } else {
    location = "Test";
  }
  $(document).attr("title", "Create Account - " + location);
});

$("#detect").keypress(function (e) {
  if (e.keyCode == 13) {
    e.preventDefault();
    webcam.takePicture(getUserName);
    $("#detect").css('filter: brightness(150%)');
    return false;
  }
});

$( "#detect" ).on( "click", function() {
  userName = document.getElementById('nameField').value;
  if (userName.split(" ").length < 2) {
      response.textContent = 'Username must contain a first and last name';
      return;
  }
  webcam.takePicture(getUserName);
});

function capitalize(s)
{
  return s[0].toUpperCase() + s.slice(1);
}
function getUserName(image) {
  imgData = image;
  userName = capitalize(userName);
  response.textContent = 'You are creating an account for: ' + userName;
  $("#response").fadeIn(500).fadeOut(500).fadeIn(500).fadeOut(500).fadeIn(500);
  userName = userName.split(" ");
  getStudentID();
}

function getStudentID() {
  $('canvas').hide();
  $('div.camera').show();
  var conDunbar = mysql.createConnection({
    host: "52.43.6.129",
    user: "rsoutsider",
    password: ,
    database: database,

  });
  conDunbar.connect(function(err) {
    if (err) {
      $("#response").text("Database connect error, please talk to your instructor");
      throw err
    }
    conDunbar.query("SELECT stud_id, first_name, last_name FROM students", function (err, result, fields) {
      if (err) {
        $("#response").text("Database not selected. Please go to settings and choose your location.");
        throw err
      }
      allData = result;
      var student;

  var personFound = false;

  for (i = 0; i < result.length; i++) {
    student = result[i];
    if ((student['first_name'].toUpperCase().trim() == userName[0].toUpperCase().trim())
      && (student['last_name'].toUpperCase().trim() == userName[1].toUpperCase().trim())) {
      stud_id = student['stud_id'];
      createBlob();
      personFound = true;
    }
  }
  student = null;
  if (!personFound) {
    $("p#response").text("You were not found, check the spelling of your name or contact robostorm.");
    alert(userName[0] + " " + userName[1] + " not Found!");
  }
    });
  });

}

function createBlob() {
  blobSvc.createContainerIfNotExists('hello', {publicAccessLevel : 'blob'}, function(error, result, response){
    if(!error){
    }
  });
  blobSvc.createBlockBlobFromStream('hello', stud_id + '.jpg', toStream(imgData), imgData.size, function(error, result, response){
    if(!error){
      createPerson();
    }
    else if (error) {
    }
  });
}

function deleteBlob() {
  blobSvc.deleteBlob('hello', stud_id + '.jpg', function(error, result, response) {
    if(!error){
    }
    else if (error) {
    }
  });
}

//STEP 4
function createPerson() {
    $.ajax({
        url: "https://westus2.api.cognitive.microsoft.com/face/v1.0/persongroups/q/persons",
        beforeSend: function(xhrObj){
            xhrObj.setRequestHeader("Content-Type","application/json");
            xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", apiKey);
        },
        type: "POST",
        data: JSON.stringify({name: stud_id.toString()})
    })
    .done(function(data) {
        addFace(data);
    })
    .fail(function() {
        deleteBlob();
    })
}

//STEP 5
function addFace(data) {
  var personID = data['personId'];
  var data = JSON.stringify(response);
  var params = {
    "personGroupId": "test",
    "personId": personID,
  };
    $.ajax({
     url: "https://westus2.api.cognitive.microsoft.com/face/v1.0/persongroups/q/persons/"
      + params['personId'] + "/persistedFaces",
       beforeSend: function(xhrObj){

           xhrObj.setRequestHeader("Content-Type","application/json");
           xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key",apiKey);
       },
       type: "POST",
       data: JSON.stringify({url: 'https://photosrobotics1.blob.core.windows.net/hello/' + stud_id + '.jpg'}),
    })
    .done(function(data) {
        trainPersonGroup();
    })
    .fail(function() {
       alert("Face not detected, please try again in better lighting");
       deleteBlob();
    })
}

//STEP 6
function trainPersonGroup() {
  $.ajax({
      url: "https://westus2.api.cognitive.microsoft.com/face/v1.0/persongroups/q/train" ,
      beforeSend: function(xhrObj){
          xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", apiKey);
      },
      type: "POST",
      data: "{body}",
  })
  .done(function(data) {
      $("#response").show();
      alert("Success");
      response.textContent = userName[0] + " " + userName[1] + "'s account has been successfully created!";
      username = null;
      faceID = null;
      stud_id = null;
      imgData = null;
  })
  .fail(function() {
      deleteBlob();
  });
}
