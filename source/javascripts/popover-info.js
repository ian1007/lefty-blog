'use strict';

$(function(){
  if (document.body.contains(document.querySelector('.form__info__icon'))) {
    $('.form__info__icon').each(function () {
      $(this).popover({
        container: 'body',
        html: true,
        trigger: 'hover',
        content: function content() {
          return $(this).find('.d-none').html();
        },
      });
    });
  }
});
