"use strict";

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
		res = '<osxh>' + res + '</osxh>'
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
	var goToSlide = function(newSlideNum) {
		$(slideContainers[curSlide]).addClass('slide_hidden');
		curSlide = newSlideNum;
		$(slideContainers[newSlideNum]).removeClass('slide_hidden');
	};

	title = presData.split('\n')[0].trim();
	slides = presData.split(/^={3,}$/m).map(slideHTML);

	$('title').text(title);
	renderSlides();
	goToSlide(0);
}

if (document.compatMode != 'CSS1Compat') {
	alert("Not in standards mode, something went wrong ...");
}


$(function() {
	var presId = $('body').attr('data-pres-id');
	var presData = $('body').attr('data-pres-data');
	pres(presId, presData);
});