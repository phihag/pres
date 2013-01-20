"use strict";

var _KEYS = {
    TAB: 9,
    ESC: 27,
    SPACE: 32,
    PGUP: 33,
    PGDOWN: 34,
    END: 35,
    HOME: 36,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
};

function pres(presId, presData) {
	var container = document.getElementById('pres_container');
	var osxhi = osxh({allowCSS: true});

	var title,slides;
	var curSlide = 0;
	var slideContainers;

	var slideHTML = function (slideCode) {
		slideCode = slideCode.trim();

		var res = slideCode;
		res = res.replace(/^.*/, '<h1>$&</h1>');
		res = '<osxh>' + res + '</osxh>';
		return res;
	};

	var renderSlides = function() {
		var slideNum = 0;
		slideContainers = slides.map(function(slide) {
			var slideContainer = document.createElement('div');
			slideContainer.setAttribute('class', 'slide slide_hidden');
			if (slideNum == 0) {
				var cls = slideContainer.getAttribute('class');
				slideContainer.setAttribute('class', cls + ' firstslide')
			}
			osxhi.renderInto(slide, slideContainer);
			slideNum++;
			return slideContainer;
		});
		slideContainers.forEach(function(sc) {
			container.appendChild(sc);
		});
	};
	var showSlide = function(newSlideNum) {
		$(slideContainers[curSlide]).addClass('slide_hidden');
		curSlide = newSlideNum;
		$(slideContainers[newSlideNum]).removeClass('slide_hidden');
	};
	var goToSlide = function(newSlideNum) {
		newSlideNum = Math.min(slides.length-1, Math.max(0, newSlideNum));
		location.hash = '#s' + newSlideNum;
	};
	var parseLoc = function() {
		var h = window.location.hash;
		var m = h.match(/^#s([0-9]+)$/);
		if (m) {
			var sn = parseInt(m[1]);
			showSlide(sn);
			return sn;
		}
		return undefined;
	};

	title = presData.split('\n')[0].trim();
	slides = presData.split(/^={3,}$/m).map(slideHTML);

	// Create DOM objects
	$('title').text(title);
	renderSlides();

	// Attach events
	$('body').keydown(function(e) {
	switch(e.keyCode) {
	case _KEYS.PGDOWN:
	case _KEYS.RIGHT:
	case _KEYS.SPACE:
		goToSlide(curSlide+1);
		e.preventDefault();
		break;
	case _KEYS.PGUP:
	case _KEYS.LEFT:
		goToSlide(curSlide-1);
		e.preventDefault();
		break;
	}
	});
	window.addEventListener('hashchange', parseLoc, true);

	// Initialize
	if (parseLoc() === undefined) {
		goToSlide(0);
	}
}

if (document.compatMode != 'CSS1Compat') {
	alert("Not in standards mode, something went wrong ...");
}


$(function() {
	var presId = $('body').attr('data-pres-id');
	var presData = $('body').attr('data-pres-data');
	pres(presId, presData);
});