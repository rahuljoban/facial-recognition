var apiKey;
var mysql = require('mysql');
var b64toBlob = require('b64-to-blob');

var webcam = require('./webcam');
const storage = require('electron-json-storage');
const settings = require('electron-settings');


var faceID;
var detectFaceResponse;
var companyName;
var stud_id;
var studentName = [];

var contentType;
var dataURL;
var blob;
var database;

$( "#detect" ).on( "click", function() {
  $("#log").show();
  $("#log").fadeIn(500).fadeOut(500).fadeIn(500).fadeOut(500);
  webcam.takePicture(detectFaces);
});

function capitalize(s)
{
  return s[0].toUpperCase() + s.slice(1);
}

function getSchoolName() {
  q = document.getElementById('nameField').value;
  var result = document.getElementById('result');
  if (nameField.length < 2) {
      result.textContent = 'Username must contain at least 2 characters';
  } else {
      result.textContent = 'You are logging into: ' + companyName;
  }
}

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
  $(document).attr("title", "Log In - " + location);
  console.log(database);
  $('canvas').hide();
  $('#log').hide();
  $("#detect").keypress(function (e) {
    if (e.keyCode == 13) {
      $("#detect").click();
      $("#detect").css('filter: brightness(150%)');
      return false;
    }
  });
  $()
});

function detectFaces(image) {
  $("#response").empty();
  $('canvas').hide();
  $('div.camera').show();
  $.ajax({
      url: "https://westus2.api.cognitive.microsoft.com/face/v1.0/detect?returnFaceId=true&returnFaceLandmarks=true",
      beforeSend: function (xhrObj) {
          xhrObj.setRequestHeader("Content-Type", "application/octet-stream");
          xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", apiKey);
      },
      type: "POST",
      data: image,
      processData: false
  })
  .done(function (response) {
      detectFaceResponse = response;
      trainPersonGroup();
  })
  .fail(function (error) {
      $("#response").text(error.getAllResponseHeaders());
  });
}

//STEP 6
function trainPersonGroup() {
  $.ajax({
      url: "https://westus2.api.cognitive.microsoft.com/face/v1.0/persongroups/q/train" ,
      beforeSend: function(xhrObj){
          // Request headers
          xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", apiKey);
      },
      type: "POST",
      // Request body
      data: "{body}",
  })
  .done(function(data) {
      getTrainingStatus();
  })
  .fail(function() {
      alert("Error: person group not trained, please wait and try again");
  });
}

function getTrainingStatus() {
  $.ajax({
          url: "https://westus2.api.cognitive.microsoft.com/face/v1.0/persongroups/q/training?",
          beforeSend: function(xhrObj){
              xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", apiKey);
          },
          type: "GET",
          data: "{body}",
      })
      .done(function(data) {
          if (data['status'] == "running") {
            getTrainingStatus();
          } else {
            identifyFace();
          }
      })
      .fail(function() {
          alert("Too many requests, please wait and try again.");
      });
}

//STEP 7
function identifyFace() {
  var a = detectFaceResponse[0];
  if(a == undefined) {
     $("#response").text("Face not detected, move to better lighting or use password");
  }
  faceID = a['faceId'];
  $.ajax({
      url: "https://westus2.api.cognitive.microsoft.com/face/v1.0/identify",
      beforeSend: function(xhrObj){
          xhrObj.setRequestHeader("Content-Type","application/json");
          xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", apiKey);
      },
      type: "POST",
      data: JSON.stringify({
          personGroupId: 'q',
          faceIds:[
              faceID
          ],
          maxNumOfCandidatesReturned:1,
          confidenceThreshold: 0.5
      }) ,
  })
  .done(function(data) {
      var response = data[0];
      var candidateId = response['candidates'];
      var a = candidateId[0];
      var personID = a['personId'];
      getStudId(candidateId);
  })
  .fail(function() {
      alert("error, person group not trained, and identify failed");
  });
}

function getStudId(data) {
  var response = data[0];
  var personID = response['personId'];
  var params = {
    "personGroupId": 'q',
    "personId": personID,
  };
  $.ajax({
      url: "https://westus2.api.cognitive.microsoft.com/face/v1.0/persongroups/q/persons/" + params['personId'],
      beforeSend: function(xhrObj){
          xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", apiKey);
      },
      type: "GET",
      data: "{body}",
  })
  .done(function(data) {
      stud_id = data['name'];
      getStudentName();
  })
  .fail(function() {
    $("#response").text("Too many requests, wait and try again");
  });
}

function getStudentName() {
  var personFound;
  var con = mysql.createConnection({
    host: "52.43.6.129",
    user: "rsoutsider",
    password: "fF2WBYLRNnSvwUww",
    database: database,
  });

  con.connect(function(err) {
    if (err) {
      $("#response").text("Database connect error, please talk to your instructor");
      throw err
    }
    con.query("SELECT stud_id, first_name, last_name FROM students", function (err, result, fields) {
      if (err) {
        $("#response").text("Database not selected. Please go to settings and choose your location.");
        throw err
      }
      personFound = false;
      var student;
      for (i = 0; i < result.length; i++) {
        student = result[i];
        if (student['stud_id'] == stud_id) {
          studentName[0] = student['first_name'];
          studentName[1] = student['last_name'];
          personFound = true;
        }
      }
      if (personFound) {
          $('#log').hide();
          $("#response").append("Welcome to class: " + capitalize(studentName[0]) + " " + capitalize(studentName[1]) +"! ");
          getProgram();
      } else {
        alert("Student not found!");
        $("#response").text("You could not be found, please make sure you have slected the correct location, or move to better light");
      }
    });
  });

}

function getProgram() {
  var programFound;

  var programInfo = [];
  var progCode = [];
  var courseLevel = [];
  var courseNumber = [];
  var classroomName = [];
  var URL;

  var d = new Date();
  var days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  var dayOfTheWeek = days[d.getDay()];

  var hour = new Date();
  hour = hour.getHours();

  var con = mysql.createConnection({
    host: "52.43.6.129",
    user: "rsoutsider",
    password: ,
    database: database,
  });

  con.connect(function(err) {
    if (err) {
      alert('connect error for student programs');
      throw err
    }
    con.query("SELECT * FROM student_programs", function (err, result, fields) {
      if (err) {
        throw err
      }
      programFound = false;
      var student;
      for (i = 0; i < result.length; i++) {
        student = result[i];
        if (student['stud_id'] == stud_id && student['active'] == "T") {

          //programInfo[0] = student['removed_prog_name'];
          //programInfo[1] = student['progress'];
          programInfo.push(student['removed_prog_name']);
          programInfo.push(student['progress']);
          programInfo.push(student['prog_code']);
          programInfo.push(student['classroom_name']);
          programFound = true;
        }
      }
        if (programFound) {
            for (i = 0; i < programInfo.length; i+=4) {
              courseLevel[i] = programInfo[i];
              courseNumber[i] = programInfo[i + 1];
              progCode[i] = programInfo[i + 2];
              console.log(progCode[i] + " :i HIGH");
              classroomName[i] = programInfo[i + 3];
              if (progCode[i].toUpperCase().includes("CODING")) {
                URL = 'maincoding.roboedu.ca';
              } else {
                URL = 'mainrobotic.roboedu.ca';
              }
              $("#response").append("<br> You are in: " + capitalize(classroomName[i]) + " " + courseLevel[i] +
                ", " + courseNumber[i] + "! ");
              $("#response").append("<button class = 'start" + i + "'><a href=WebView.html?"
                + URL + "?&>Click to Start " + capitalize(classroomName[i])+ "!</a></button>");
              $("button.start" + i).on('click', {progCode: progCode[i]}, setData);

            }
        } else {
          alert("program not found!");
          $("#response").append("</br> Your program was not found, please contact Robostorm");
        }
    });
  });
  function setData(event) {
    storage.set('data', {stud_id: stud_id, progCode: event.data.progCode,
      database: database, studentName: studentName[0]}, function(error) {
        if (error) throw error;
    });
  }
}

function showImage() {
    var canvas = document.getElementById("myCanvas");
    var context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);

    var input = document.getElementById("filename");
    var img = new Image;

    img.onload = function () {
        context.drawImage(img, 0, 0);
    }
    img.src = URL.createObjectURL(input.files[0]);
}
