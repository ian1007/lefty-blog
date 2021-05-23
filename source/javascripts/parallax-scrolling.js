'use strict';

$(function () {
  if (document.body.contains(document.querySelector('#parallaxScrolling'))) {
    $.fn.isInViewport = function () {
      const elementTop = $(this).offset().top;
      const elementBottom = elementTop + $(this).outerHeight();

      const viewportTop = $(window).scrollTop();
      const viewportBottom = viewportTop + $(window).height();

      return elementBottom > viewportTop && elementTop < viewportBottom;
    };

    $(window).on('resize scroll', function () {
      if ($('#parallaxScrolling').isInViewport() && $('#parallaxScrolling').hasClass('invisible')) {
        $('#parallaxScrolling').removeClass('invisible');
      } 
      else if (!$('#parallaxScrolling').isInViewport() && !$('#parallaxScrolling').hasClass('invisible'))  {
        $('#parallaxScrolling').addClass('invisible');
      }
    });
  }
});
