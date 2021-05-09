'use strict';

$(function () {
  if (document.body.contains(document.querySelector('.smart-scroll')) && !document.body.contains(document.querySelector('#postEditor'))) {
    let last_scroll_top = 0;
    $(window).on('scroll', function () {
      let scroll_top = $(this).scrollTop();
      if (scroll_top < (last_scroll_top - 8) || scroll_top < $('.smart-scroll').outerHeight()) {
        $('.smart-scroll').removeClass('scrolled-down').addClass('scrolled-up');
        last_scroll_top = scroll_top;
      }
      else if (scroll_top > (last_scroll_top + 8)) {
        $('.smart-scroll').removeClass('scrolled-up').addClass('scrolled-down');
        last_scroll_top = scroll_top;
      }
    });
  }
});
