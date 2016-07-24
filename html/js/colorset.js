var host = null;
var port = null;
$(document).ready(function(){
	host = Basil.localStorage.get('hostname');
	port = Basil.localStorage.get('portnumber');
});

var conn = null;
	
function connect() {
	"use strict";
	disconnect();
	conn = new SockJS('http://' + host + ':' + port + '/rgb');
	//$.bootstrapGrowl("Connecting...", {width: 'auto', allow_dismiss: false});
	conn.onopen = function() {
	  $.bootstrapGrowl("Connected", {width: 'auto', allow_dismiss: false});
	};
	conn.onmessage = function(e) {
	  var msg = e.data;
	  $.bootstrapGrowl("received " + msg, {width: 'auto', allow_dismiss: false});
	  /*if (msg.startsWith("rgb")) {
		  var color = msg.substring(msg.lastIndexOf("rgb("),msg.lastIndexOf(")")+1);
		  var Active = $("li.cd-selected").data("menu");
		  if ( Active == "effects" ) {
			  $(".knob").css("color",color);
		  }
	  }*/
	};
	conn.onclose = function() {
	  $.bootstrapGrowl("Disconnected.", {width: 'auto', allow_dismiss: false});
	  conn = null;
	};
  }

function disconnect() {
	if (conn != null) {
	  $.bootstrapGrowl("Disconnecting...", {width: 'auto', allow_dismiss: false});
	  conn.close();
	  conn = null;
	}
  }

function send(msg) {
	conn.send(msg);
	//$.bootstrapGrowl(msg, {width: 'auto', allow_dismiss: false});
	return true;
	}

$(document).ready(function() {
	if (conn == null) {
	  connect();
	}
	return false;
  });