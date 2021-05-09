'use strict';

$(function () {
  if (document.body.contains(document.querySelector('#aboutme'))) {
    $.fn.isInViewport = function () {
      const elementTop = $(this).offset().top;
      const elementBottom = elementTop + $(this).outerHeight();

      const viewportTop = $(window).scrollTop();
      const viewportBottom = viewportTop + $(window).height();

      return elementBottom > viewportTop && elementTop < viewportBottom;
    };

    $(window).on('resize scroll', function () {
      if ($('.aboutme__profile').isInViewport() && $('.aboutme__profile').hasClass('invisible')) {
        $('.aboutme__profile').removeClass('invisible');
      } 
      else if (!$('.aboutme__profile').isInViewport() && !$('.aboutme__profile').hasClass('invisible'))  {
        $('.aboutme__profile').addClass('invisible');
      }
    });
  }
});
