
$(document).ready(function(){
	basil = new window.Basil();
	$( "#host" ).val(basil.get('host'));
	$( "#port" ).val(basil.get('port'));
	$( "#checkbox" ).prop('checked',basil.get('power'));
	
    $( "#host" ).change(function() {
		var host = $( "#host" ).val();
		localStorage.hostname = host;
		basil.set('host', host);
	});
	
	$( "#port" ).change(function() {
		var port = $( "#port" ).val();
		localStorage.portnumber = port;
		basil.set('port', port);
	});
	
	var Power = document.querySelector('.js-switch');
	var switchery = new Switchery(Power, { 
		color: '#41b7ee'
	  , secondaryColor    : '#dfdfdf'
	  , jackColor         : '#fff'
	  , jackSecondaryColor: null
	});
	
	Power.onchange = function() {
  		var OnOff = Power.checked;
		localStorage.power = OnOff;
		basil.set('power', OnOff);
	};
});