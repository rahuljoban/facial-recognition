var b64toBlob = require('b64-to-blob');
var width = 320;
var height = 0;

var streaming = false;

var video = null;
var canvas = null;
var photo = null;
var startbutton = null;

  var imgData;

$(function() {
  $('canvas').hide();
});

$( window ).resize(function() {
  $('video').width($(window).width());
  $('video').height('100%');
});

$('#cameraInput').on('change', function(e){
  var data = e.originalEvent.target.files[0];
  var reader = new FileReader();
  reader.onload = function(evt){
    $('#photo').attr('src',evt.target.result);
    reader.readAsDataUrl($data);
  }
});

window.addEventListener("load", function startup() {
  video = document.getElementById('video');
  canvas = document.getElementById('canvas');
  photo = document.getElementById('photo');
  startbutton = document.getElementById('detect');
  var hdConstraints = {
    video: {
      mandatory: {
        minWidth: 1280,
        minHeight: 720
      }
    }
  };
      navigator.mediaDevices.getUserMedia(hdConstraints)
      .then(function(stream) {
        video.srcObject = stream;
        video.play();
      })
      .catch(function(err) {
        console.log("An error occured! " + err);
      });
  video.addEventListener('canplay', function(ev){
    if (!streaming) {
      height = video.videoHeight / (video.videoWidth / width);
      $('video').css({height: 720,
           width: 1280});
      $('canvas').css({height: 720,
           width: 1280});
      streaming = true;
    }
  }, false);
  clearPhoto();
});
function clearPhoto() {
  var context = canvas.getContext('2d');
  context.fillStyle = "#AAA";
  context.fillRect(0, 0, canvas.width, canvas.height);

  var data = canvas.toDataURL('image/png');
}

function takePicture(callback) {
  $('canvas').show();
  var context = canvas.getContext('2d');
  if (width && height) {
    canvas.width = width;
    canvas.height = height;
    context.drawImage(video, 0, 0, width, height);
    var ctx;
    $('div.camera').hide();
    var contentType = 'image/png';
    var dataURL = canvas.toDataURL("image/png");
    dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
    dataURL = dataURL.substring(dataURL.indexOf(',') + 1, dataURL.length);
    var blob = b64toBlob(dataURL, contentType);
    callback(blob);
  } else {
    clearPhoto();
  }
}
  module.exports = {
    takePicture: takePicture,
    canvas: canvas
  }
