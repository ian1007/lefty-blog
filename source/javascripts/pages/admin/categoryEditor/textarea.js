'use strict';

$(function(){
  if (document.body.contains(document.querySelector('#categoryEditor'))) {
    const description = document.querySelector('#description');
    function resizeDescription() {
      description.style.height = 'auto';
      description.style.height = (description.scrollHeight) + 'px';
    }
    $('#description').on('input', resizeDescription);
    $(window).on('resize', resizeDescription);
    resizeDescription();
  }
});
