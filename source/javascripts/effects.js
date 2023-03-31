'use strict';

$(function () {
  $.fn.inViewport = function () {
    const elementTop = $(this).offset().top;
    const elementBottom = elementTop + $(this).outerHeight();

    const viewportTop = $(window).scrollTop();
    const viewportBottom = viewportTop + $(window).height();

    return (elementBottom - 60) > viewportTop && (elementTop + 30) < viewportBottom;
  };
  $(window).on('resize scroll', function () {
    const animatables = $('.animatable');
    animatables.each(function (i) {
      let animatable = $(this);
      if (animatable.inViewport() && animatable.hasClass('animatable')) {
        animatable.removeClass('animatable').addClass('animated');
      }
    });
  });
  $(window).trigger('scroll');
});