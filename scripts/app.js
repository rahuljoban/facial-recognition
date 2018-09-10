//This is the full chain of server requests to set up a person group, add a list of people and identify a person.
var faceID;
var detectFaceResponse;
var apiKey;
var companyName;


function getUserName() {
  companyName = document.getElementById('nameField').value;
  var result = document.getElementById('result');

  if (nameField.length < 2) {
      result.textContent = 'Username must contain at least 2 characters';
      //alert('Username must contain at least 3 characters');
  } else {
      result.textContent = 'Your username is: ' + companyName;
      //alert(nameField);
  }
}

var subButton = document.getElementById('subButton');
subButton.addEventListener('click', getUserName, false);

//ENTRY POINT
$('#detect').click(function () {
    var file = document.getElementById('filename').files[0];
    detectFaces(file);
});

$("#filename").change(function () {
    showImage();
});

//STEP 1
function detectFaces(file) {
  // Call the API
  $.ajax({
      url: "https://westcentralus.api.cognitive.microsoft.com/face/v1.0/detect?returnFaceId=true&returnFaceLandmarks=true",
      beforeSend: function (xhrObj) {
          xhrObj.setRequestHeader("Content-Type", "application/octet-stream");
          xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", apiKey);
          $("#response").text("Calling api...");
      },
      type: "POST",
      data: file,
      processData: false
  })
  .done(function (response) {
      // Process the API response.
      detectFaceResponse = response;
      processResult(response);
  })
  .fail(function (error) {
      // Oops, an error :(
      $("#response").text(error.getAllResponseHeaders());
  });
}

//STEP 2
function processResult(response) {
  var arrayLength = response.length;

  if (arrayLength > 0) {
      var canvas = document.getElementById('myCanvas');
      var context = canvas.getContext('2d');

      context.beginPath();

      // Draw face rectangles into canvas.
      for (var i = 0; i < arrayLength; i++) {
          var faceRectangle = response[i].faceRectangle;
          context.rect(faceRectangle.left, faceRectangle.top, faceRectangle.width, faceRectangle.height);
      }

      context.lineWidth = 3;
      context.strokeStyle = 'red';
      context.stroke();
  }

  // Show the raw response.
  var a = response[0];
  faceID = a['faceId'];
  var data = JSON.stringify(response);
  $("#response").text(JSON.stringify(faceID) + " = faceID");
  console.log('Im processing the result');
  createPersonGroup();
}

//STEP 3
function createPersonGroup() {
  $.ajax({
      url: "https://westcentralus.api.cognitive.microsoft.com/face/v1.0/persongroups/" + companyName,
      beforeSend: function(xhrObj){
          // Request headers
          xhrObj.setRequestHeader("Content-Type","application/json");
          xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", apiKey);
      },
      type: "PUT",
      // Request body
      data: JSON.stringify({"name": companyName,}),
  })
  .done(function(data) {
      alert("Success, Person Group Created");
  })
  .fail(function() {
      alert("error Person Group Not Created");
  })
  createPerson();
}

//STEP 4
function createPerson() {
  people.forEach(function(person) {
    console.log(person.name);
    $.ajax({
        url: "https://westcentralus.api.cognitive.microsoft.com/face/v1.0/persongroups/" + companyName + "/persons",
        beforeSend: function(xhrObj){
            // Request headers
            xhrObj.setRequestHeader("Content-Type","application/json");
            xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key",apiKey);
        },
        type: "POST",
        // Request body
        data: JSON.stringify({name: person.name})
    })
    .done(function(data) {
         //alert("Success");
        console.log(person.name);
        console.log(data);
        addFace(data);
    })
    .fail(function() {
        alert("error");
    })
  });
}


//STEP 5
function addFace(data) {
  var personID = data['personId'];
  var data = JSON.stringify(response);
  var params = {
    "personGroupId": companyName,
    "personId": personID,
  };
  people.forEach(function(person) {
    $.ajax({
     url: "https://westcentralus.api.cognitive.microsoft.com/face/v1.0/persongroups/" + companyName + "/persons/"
      + params['personId'] + "/persistedFaces",
       beforeSend: function(xhrObj){
           // Request headers
           xhrObj.setRequestHeader("Content-Type","application/json");
           xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key",apiKey);
       },
       type: "POST",
       // Request body

       data: JSON.stringify({url: person.photo}),
    })
    .done(function(data) {
        //alert("Success");
    })
    .fail(function() {
       alert("error");
    })
   });
  trainPersonGroup();
}

//STEP 6
function trainPersonGroup() {
  $.ajax({
      url: "https://westcentralus.api.cognitive.microsoft.com/face/v1.0/persongroups/"+ companyName +"/train" ,
      beforeSend: function(xhrObj){
          // Request headers
          xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", apiKey);
      },
      type: "POST",
      // Request body
      data: "{body}",
  })
  .done(function(data) {
       alert("Success, Person group has been trained");
      identifyFace();
  })
  .fail(function() {
      alert("error, person group not trained");
  });

}

//STEP 7
function identifyFace() {
  var a = detectFaceResponse[0];
  faceID = a['faceId'];
  $.ajax({
      url: "https://westcentralus.api.cognitive.microsoft.com/face/v1.0/identify?",
      beforeSend: function(xhrObj){
          // Request headers
          xhrObj.setRequestHeader("Content-Type","application/json");
          xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", apiKey);
      },
      type: "POST",
      // Request body
      data: JSON.stringify({
          personGroupId: companyName,
          faceIds:[
              faceID
          ],
          maxNumOfCandidatesReturned:1,
          confidenceThreshold: 0.5
      }) ,
  })
  .done(function(data) {
       //alert("Success");
      console.log(data + " identifying!");
      var response = data[0];
      var candidateId = response['candidates'];
      console.log(candidateId);
      var a = candidateId[0];
      var personID = a['personId'];
      $("#response").text("This person is: " + personID);
  })
  .fail(function() {
      alert("error");
  });
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
