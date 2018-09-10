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
    // var file = document.getElementById('filename').files[0];
    createPersonGroup();
});

function createPersonGroup() {
  $.ajax({
      url: "https://westus2.api.cognitive.microsoft.com/face/v1.0/persongroups/" + companyName,
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
  .fail(function(data) {
      // data = JSON.stringify(data);
      // var response = JSON.parse(data);
      var code = data['status'];
      // var response = data[0];
      // console.log(response);
      // var error = response['responseText'];
      // console.log(error);
      // var code = error['code'];
      if (code == 409) {
        alert ("A group with this name has already been created");
      } else {
        alert("Error, Person Group Not Created");
      }
  });

}
