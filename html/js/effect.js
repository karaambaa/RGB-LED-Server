var color = false;
var sliderBg, firstCircle, secondCircle, shitCircle, leftCircle, myCircle, group;
jQuery(document).ready(function($){	
	//cache DOM elements
	var projectsContainer = $('.cd-projects-container'),
		projectsPreviewWrapper = projectsContainer.find('.cd-projects-previews'),
		projectPreviews = projectsPreviewWrapper.children('li'),
		projects = projectsContainer.find('.cd-projects'),
		navigationTrigger = $('.close'),
		navigation = $('.cd-primary-nav'),
		//if browser doesn't support CSS transitions...
		transitionsNotSupported = ( $('.no-csstransitions').length > 0);

	var animating = false,
		//will be used to extract random numbers for projects slide up/slide down effect
		numRandoms = projects.find('li').length, 
		uniqueRandoms = [];

	//open project
	projectsPreviewWrapper.on('click', 'a', function(event){
		event.preventDefault();
		if( animating == false ) {
			animating = true;
			navigationTrigger.add(projectsContainer).addClass('project-open');
			navigationTrigger.addClass('close-visible');
			openProject($(this).parent('li'));
			knobsize();
			$(window).trigger('resize');
		}
	});
    
	navigationTrigger.on('click', function(event){
		event.preventDefault();
		
		if( animating == false ) {
			animating = true;
			if( navigationTrigger.hasClass('project-open') ) {
				//close visible project
				navigationTrigger.add(projectsContainer).removeClass('project-open');
				navigationTrigger.removeClass('close-visible');
				closeProject();
			}
		}	

		if(transitionsNotSupported) animating = false;
	});

	//scroll down to project info
	projectsContainer.on('click', '.scroll', function(){
		projectsContainer.animate({'scrollTop':$(window).height()}, 500); 
	});

	//check if background-images have been loaded and show project previews
	projectPreviews.children('a').bgLoaded({
	  	afterLoaded : function(){
	   		showPreview(projectPreviews.eq(0));
	  	}
	});

	function showPreview(projectPreview) {
		if(projectPreview.length > 0 ) {
			setTimeout(function(){
				projectPreview.addClass('bg-loaded');
				showPreview(projectPreview.next());
			}, 150);
		}
	}

	function openProject(projectPreview) {
		var projectIndex = projectPreview.index();
		projects.children('li').eq(projectIndex).add(projectPreview).addClass('selected');
		
		if( transitionsNotSupported ) {
			projectPreviews.addClass('slide-out').removeClass('selected');
			projects.children('li').eq(projectIndex).addClass('content-visible');
			animating = false;
		} else { 
			slideToggleProjects(projectPreviews, projectIndex, 0, true);
		}
	}

	function closeProject() {
		projects.find('.selected').removeClass('selected').on('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function(){
			$(this).removeClass('content-visible').off('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend');
			slideToggleProjects(projectsPreviewWrapper.children('li'), -1, 0, false);
		});

		//if browser doesn't support CSS transitions...
		if( transitionsNotSupported ) {
			projectPreviews.removeClass('slide-out');
			projects.find('.content-visible').removeClass('content-visible');
			animating = false;
		}
	}

	function slideToggleProjects(projectsPreviewWrapper, projectIndex, index, bool) {
		if(index == 0 ) createArrayRandom();
		if( projectIndex != -1 && index == 0 ) index = 1;

		var randomProjectIndex = makeUniqueRandom();
		if( randomProjectIndex == projectIndex ) randomProjectIndex = makeUniqueRandom();
		
		if( index < numRandoms - 1 ) {
			projectsPreviewWrapper.eq(randomProjectIndex).toggleClass('slide-out', bool);
			setTimeout( function(){
				//animate next preview project
				slideToggleProjects(projectsPreviewWrapper, projectIndex, index + 1, bool);
			}, 150);
		} else if ( index == numRandoms - 1 ) {
			//this is the last project preview to be animated 
			projectsPreviewWrapper.eq(randomProjectIndex).toggleClass('slide-out', bool).one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function(){
				if( projectIndex != -1) {
					projects.children('li.selected').addClass('content-visible');
					projectsPreviewWrapper.eq(projectIndex).addClass('slide-out').removeClass('selected');
				} else if( navigation.hasClass('nav-visible') && bool ) {
					navigation.addClass('nav-clickable');
				}
				projectsPreviewWrapper.eq(randomProjectIndex).off('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend');
				animating = false;
			});
		}
	}

	//http://stackoverflow.com/questions/19351759/javascript-random-number-out-of-5-no-repeat-until-all-have-been-used
	function makeUniqueRandom() {
	    var index = Math.floor(Math.random() * uniqueRandoms.length);
	    var val = uniqueRandoms[index];
	    // now remove that value from the array
	    uniqueRandoms.splice(index, 1);
	    return val;
	}

	function createArrayRandom() {
		//reset array
		uniqueRandoms.length = 0;
		for (var i = 0; i < numRandoms; i++) {
            uniqueRandoms.push(i);
        }
	}
});

$( document ).ready(function(){
	pipslider();
	sliderSetup();
	$('.cb-value').click(function() {
		  var mainParent = $(this).parent('.toggle-btn');
		  if($(mainParent).find('input.cb-value').is(':checked')) {
			$(mainParent).addClass('active');
			color = true;
		  } else {
			$(mainParent).removeClass('active');
			color = false;
		  }
		});
	
	$('.musicSwitch').click(function() {
		  var mainParent = $(this).parent('.toggle-btn');
		  if($(mainParent).find('input.cb-value').is(':checked')) {
			  var mode, settings;
			  mode = $('ul').find('li.selected').data('name');
			  settings = "Auto";
			  $.bootstrapGrowl(mode + "," + settings, {width: 'auto', allow_dismiss: false});
			  send(mode + "," + settings);
		  }
		});
	
	$(".slide-arrow").click(function() {
		var direction = $(this).attr("id"); //radius = 685
		slider(direction);
		setTimeout(function(){
			$(".Music1").toggle("slide");
			knobsize();
			$(window).resize();
			$(".Music2").toggle("slide");
			return(direction);
		}, 500);
	});
});

function fixSliderPosition(direction) {
	var maxW = $( window ).width(); 
	var maxH = $( window ).height();
	var Position = sliderPosition(maxW);
	var PosY = maxH/2;
	if (direction === "left") {
		var PosX = Position[0];
		shitCircle.fill('#683C3C');
	} else {
		var PosX = Position[1];
		shitCircle.fill('#3c556b');
	}
	sliderBg.size(maxW,maxH)
	.center(maxW/2,maxH/2);
	firstCircle.center(PosX, PosY);
	secondCircle.center(PosX, PosY);
	shitCircle.size(maxW,maxH)
	.center(maxW/2,maxH/2);
	leftCircle.center(PosX, PosY);
	myCircle.center(PosX, PosY);
}

function sliderSetup() {
	var maxW = $( window ).width(); 
	var maxH = $( window ).height();
	var Position = sliderPosition(maxW);
	var PosX = Position[1];
	var PosY = maxH/2;
	
	sliderBg = SVG("slidEffect")
	.size(maxW,maxH)
	.center(maxW/2, PosY)
	.style({overflow:"hidden"});
	
	firstCircle = sliderBg.circle(0)
	.center(PosX, PosY)
	.fill('#3c6b52');

	secondCircle = sliderBg.circle(0)
	.center(PosX, PosY)
	.fill('#c2c2c2');
	
	shitCircle = sliderBg.rect(maxW, maxH)
	.center(maxW/2,maxH/2);
	
	leftCircle = sliderBg.circle(0)
	.attr({fill: '#fff'})
	.center(PosX, PosY);
	
	myCircle = sliderBg.circle(0).addClass('slide-arrow-bg')
	.center(PosX, PosY)
	.fill('#000');
	
	group = sliderBg.group().addClass('slide-arrow-bg')
	.add(leftCircle)
	.add(myCircle);
	shitCircle.maskWith(group);
}

function sliderPosition(maxW) {
	var a = parseFloat($(".slide-arrow").css("width"));
	var s = parseFloat($(".slide-arrow").css("height"));
	var r = (4*a*a + s*s)/(8*a);
	var posR = maxW + r;
	var posL = -r;
	return([posL, posR]);
}

function slider(direction){
	$('#slidEffect').css("z-index", 9100);
	fixSliderPosition(direction);
	var maxW = $( window ).width(); 
	var maxH = $( window ).height();
	var maxR = Math.max(maxW, maxH) * 1.5;
	firstCircle.animate({duration: 500}).radius(maxR); 
	setTimeout(function() {
		secondCircle.animate({duration: 500}).radius(maxR);
		setTimeout(function() {
			leftCircle.animate({duration: 500}).radius(maxR);
			setTimeout(function() {
				firstCircle.radius(0);
				secondCircle.radius(0);
				myCircle.animate({duration: 500}).radius(maxR);
				setTimeout(function() {
					$('#slidEffect').css("z-index", -1);
					resetSlider();
				}, 550);
			}, 800);
		},  300);
	}, 300); 
}

function resetSlider() {
  $('#slidEffect').css("z-index", -1);
  firstCircle.radius(0);
  secondCircle.radius(0);
  leftCircle.radius(0);
  myCircle.radius(0);
}

function pipslider() {
	"use strict";

$("#flat-slider-gain")
    .slider({
        max: 40,
        min: 0,
        range: "min",
        value: 16,
        orientation: "vertical",
        step: 2
    });

$("#flat-slider-treble")
    .slider({
        max: 20,
        min: -20,
        range: "min",
        value: 0,
        orientation: "vertical",
        step: 2
    });

    $("#flat-slider-mids")
    .slider({
        max: 20,
        min: -20,
        range: "min",
        value: 8,
        orientation: "vertical",
        step: 2
    });

$("#flat-slider-bass")
    .slider({
        max: 20,
        min: -20,
        range: "min",
        value: 12,
        orientation: "vertical",
        step: 2
    });

    $("#flat-slider-gain, #flat-slider-treble, #flat-slider-mids, #flat-slider-bass")
    .slider("pips", {
        first: "pip",
        last: "pip"
    })
    .slider("float")
	.on("slidechange", function() {
			var value = [];
			var settings = "#";
			$(".music-slider").each(function () { 
				value.push($(this).slider("option", "value"));
			});
			for (var i = 1; i < 4; i++) { 
				settings += Math.round((value[i] * 0.05 + 1) * value[0] * 0.1 * 100) / 100 + "#";
			}
			settings = settings.substring(1, settings.length-1);
			send("Music1," + settings);
    	});
}

 /*
 * BG Loaded
 * Copyright (c) 2014 Jonathan Catmull
 * Licensed under the MIT license.
 */
 (function($){
 	$.fn.bgLoaded = function(custom) {
	 	var self = this;

		// Default plugin settings
		var defaults = {
			afterLoaded : function(){
				this.addClass('bg-loaded');
			}
		};

		// Merge default and user settings
		var settings = $.extend({}, defaults, custom);

		// Loop through element
		self.each(function(){
			var $this = $(this),
				bgImgs = $this.css('background-image').split(', ');
			$this.data('loaded-count',0);
			$.each( bgImgs, function(key, value){
				var img = value.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
				$('<img/>').attr('src', img).on("load", function() {
					$(this).remove(); // prevent memory leaks
					$this.data('loaded-count',$this.data('loaded-count')+1);
					if ($this.data('loaded-count') >= bgImgs.length) {
						settings.afterLoaded.call($this);
					}
				});
			});

		});
	};
})(jQuery);

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function hslToHex(h, s, l){
	/*
	 * takes normalized hsl values 
	 * from 0 to 1
	 */
    var r, g, b;

    if(s === 0){
        r = g = b = l; // achromatic
    }else{
        var hue2rgb = function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
	var hex = "#" + componentToHex(Math.round(r * 255)) + componentToHex(Math.round(g * 255)) + componentToHex(Math.round(b * 255));
    return (hex);
}

// Slider
$(function($) {
	
	var f,T,steps;
	$(window).resize(); //initially run the centering
	$(".logknob").knob({
		release : function (value) {
			var mode = $('ul').find('li.selected').data('name');
			/*T=.25883515625 (Step = 2) schnell
			f=1/T=3.86 Hz
			T=1.29417578125 (Step = .1)
			f=1/T=.77 Hz
			T=25.883515625 (Step = .02) langsam
			f=1/T=.0386 Hz*/
			f=(value/10);
			T=1/f;
			steps=(0.25883515625*2)*f/T;
			if (color === true){
				steps = -steps;
			}
			//$.bootstrapGrowl(mode + "," + steps, {width: 'auto', allow_dismiss: false});
			send(mode + "," + steps);
		}
	});
	$(".knobjq").knob({
        change : function (v) { 
          var hex = hslToHex(v / 360, 1, 0.5);
    	  send("Music," + hex);
		  $(".music1").css("background-color", hex);
        }
    });
});
function callHUE() {
    $(".knobjq").knob({
        change : function (v) { 
          var hex = hslToHex(v / 360, 1, 0.5);
    	  send("Music," + hex);
		  $(".music1").css("background-color", hex);
        }
    });
}

function knobsize() {
  var wMax = $(".chart").width();
  $(".HUEknob").css("margin", -1 * wMax * 0.315);
}

// centering
$(window).resize(function(){

	$('#knob').css({
		position:'absolute',
		left: ($(window).width() - $('.cd-section').outerWidth())/2,
		top: ($(window).height() - $('.cd-section').outerHeight())/2
	});	
	
	$('.center').css({
		position:'absolute',
		left: ($(window).width() - $('.cd-section').outerWidth())/2,
		top: ($(window).height() - $('.cd-section').outerHeight())/2
	});	
	
	knobsize();
	
});