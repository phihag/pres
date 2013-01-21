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

var _lst = function(nodeList) {
	var res = [];
	for (var i = 0;i < nodeList.length;i++) {
		res.push(nodeList[i]);
	}
	return res;
};

function pres(presId, presData) {
	var container = document.getElementById('pres_container');
	var osxhi = osxh({allowCSS: true,
		attributes: {
			"data-step": {"tagName": "^.*$", "value": "^"},
			"src": {"tagName": "^img$", "value": "^data:image\/(?:gif|jpeg|png);|^[a-zA-Z0-9_.-]+\.(?:gif|jpeg|jpg|png)$"},
		}
	});

	var title,slides;
	var slideContainers;

	var curSlide = 0;
	var curStep = 0;
	var curContainer = null;

	var slideHTML = function (slideCode) {
		var res = slideCode;
		res = res.replace(/^.*$/m, function(match) {
			return match ? '<h1>' + match + '</h1>' : '<h1>&#160;</h1>'
		});
		res = res.replace('&nbsp;', '&#160;');
		res = res.trim();
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
			var stepCount = 1;
			var stepEls = slideContainer.querySelectorAll('[data-step]');
			_lst(stepEls).forEach(function(se) {
				var sval = se.getAttribute('data-step');
				var m = sval.match(/([0-9]+)-/);
				if (!m) {
					throw {
						name: 'PresentationError',
						message: 'Invalid step value ' + sval
					};
				}
				stepCount = Math.max(stepCount, parseInt(m[1])+1);
			});
			slideContainer.setAttribute('data-step-count', stepCount);
			return slideContainer;
		});
		slideContainers.forEach(function(sc) {
			container.appendChild(sc);
		});
	};
	var showSlide = function(newSlideNum) {
		$(slideContainers[curSlide]).addClass('slide_hidden');
		curSlide = newSlideNum;
		curContainer = slideContainers[newSlideNum];
		$(curContainer).removeClass('slide_hidden');
	};
	var setStep = function(stepNum) {
		curStep = stepNum;
		var sc = slideContainers[curSlide];
		var stepEls = sc.querySelectorAll('[data-step]');
		_lst(stepEls).forEach(function (se) {
			var sval = se.getAttribute('data-step');
			var m = sval.match(/([0-9]+)-/);
			var s = parseInt(m[1]);
			if (s > curStep) {
				$(se).addClass('step_hidden');
			} else {
				$(se).removeClass('step_hidden');
			}
		});
	};
	var restrictSlideNum = function(newSlideNum) {
		return Math.min(slides.length-1, Math.max(0, newSlideNum));
	};
	var goToSlide = function(newSlideNum, stepNum) {
		if (!stepNum) {
			stepNum = 0;
		}
		newSlideNum = restrictSlideNum(newSlideNum);
		location.hash = '#s' + newSlideNum + (stepNum ? '-' + stepNum : '');
	};
	var advance = function(incr) {
		var newSlide = curSlide;
		var newStep = curStep + incr;
		while (newStep < 0) {
			var newSlide = restrictSlideNum(newSlide-1);
			newStep += parseInt(slideContainers[newSlide].getAttribute('data-step-count'));
		}
		while (newStep >= parseInt(slideContainers[newSlide].getAttribute('data-step-count'))) {
			newStep -= parseInt(slideContainers[newSlide].getAttribute('data-step-count'));
			newSlide = restrictSlideNum(newSlide+1);
		}
		goToSlide(newSlide, newStep);
	};
	var parseLoc = function() {
		var h = window.location.hash;
		var m = h.match(/^#s([0-9]+)(?:-([0-9]+))?$/);
		if (m) {
			var sliden = parseInt(m[1]);
			showSlide(sliden);
			var stepn = m[2] ? parseInt(m[2]) : 0;
			setStep(stepn);
			return sliden;
		}
		return undefined;
	};

	title = presData.split('\n')[0].trim();
	var slideCode = presData.split(/\n={3,}\n/);
	slides = slideCode.map(slideHTML);

	// Create DOM objects
	$('title').text(title);
	renderSlides();

	// Attach events
	$('body').keydown(function(e) {
		if (e.altKey || e.ctrlKey || e.shiftKey) {
			return;
		}
		switch(e.keyCode) {
		case _KEYS.PGDOWN:
		case _KEYS.RIGHT:
		case _KEYS.SPACE:
			advance(1);
			e.preventDefault();
			break;
		case _KEYS.PGUP:
		case _KEYS.LEFT:
			advance(-1);
			e.preventDefault();
			break;
		}
	});
	window.addEventListener('hashchange', parseLoc, true);

	// Initialize
	if (parseLoc() === undefined) {
		goToSlide(0, 0);
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