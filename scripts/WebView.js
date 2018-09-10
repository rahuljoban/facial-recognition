var height = screen.height;
var width = screen.width;
var ctrlHeight = $('#nav-body-ctrls').height();
var tabHeight = $('#nav-body-tabs').height();
var topHeight = $('.browserTop').height();
const electron = require('electron');
const {shell} = require('electron');
const downloadsFolder = require('downloads-folder');
var screenElectron = electron.screen;
var allScreens = screenElectron.getAllDisplays();
var mysql = require('mysql');
const storage = require('electron-json-storage');
var stud_id;
var prog_code;
var studentName;
var con;
var removed_prog_name;
var progress;
var classroom;

storage.get('data', function(error, data) {
		if (error) throw error;
		console.log(data);
		studentName = data['studentName'];
		$("#userName").append("Welcome " + capitalize(studentName));
		con = mysql.createConnection({
			host: "52.43.6.129",
			user: "rsoutsider",
			password: "fF2WBYLRNnSvwUww",
			database: data['database']
		});
});

function capitalize(s) {
  return s[0].toUpperCase() + s.slice(1);
}

function getInfo() {
	storage.get('data', function (error, data) {
	  if (error) throw error;
		console.log(data);
	  stud_id = data['stud_id'];
		prog_code = data['progCode'];

		var sqlSelect = "SELECT * FROM student_programs WHERE stud_id = ? AND prog_code = ?";
		con.query(sqlSelect, [stud_id, prog_code], function (err, result, fields) {
			if (err) {
				console.log('select error');
				throw err
			}
			console.log(result);
			classroom = result[0]['classroom_name'];
			removed_prog_name = result[0]['removed_prog_name'];
			progress = result[0]['progress'];
			$("#courseID").replaceWith("<p id = 'courseID'>" + capitalize(classroom) + " " + removed_prog_name + " Level " + progress + "</p>");
		});
	});
}

$(function() {
	$("#nav-ctrls-url").hide();
	getInfo();
	$( "#nav-body-views" ).css({
  	height: height - (ctrlHeight + tabHeight + topHeight),
		height: '100%',
  	width: '100%'
  });
	$("input#back").on('click', function() {
		storage.clear(function(error) {
    	if (error) throw error;
  	});
	});
});

$(window).resize(function() {
	height = window.innerHeight;
	width = window.innerWidth;
  $( "#nav-body-views").css({
  	height: height - 50 - (ctrlHeight + tabHeight + topHeight),
  	width: width
  });
});

$("input#complete").on( "click", function() {
	shell.showItemInFolder(downloadsFolder());
	if (progress < 12) {
		var sqlUpdatePrograms = "UPDATE student_programs SET progress = progress + 1 WHERE stud_id = ? AND prog_code = ?";
		con.query(sqlUpdatePrograms, [stud_id, prog_code], function (err, result, fields) {
			if (err) {
				console.log('update error');
				throw err
			}
			console.log(result);
			getInfo();
		});
	} else {
		console.log("Progress is " + progress + " setting back to 1");
		var sqlUpdateProgramsOne = "UPDATE student_programs SET progress = 1 WHERE stud_id = ? AND prog_code = ?";
		var sqlUpdateProgName = "UPDATE student_programs SET removed_prog_name = removed_prog_name + 1 WHERE stud_id = ? AND prog_code = ?";
		con.query(sqlUpdateProgramsOne, [stud_id, prog_code], function (err, result, fields) {
			if (err) {
				console.log('update error');
				throw err
			}
			console.log(result);
			getInfo();
		});
		con.query(sqlUpdateProgName, [stud_id, prog_code], function (err, result, fields) {
			if (err) {
				console.log('update error');
				throw err
			}
			console.log(result);
			getInfo();
		});
	}
});

$("input#downloads").on( "click", function() {
	shell.showItemInFolder(downloadsFolder());
});
