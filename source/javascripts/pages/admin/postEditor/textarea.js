'use strict';

$(function(){
  if (document.body.contains(document.querySelector('#postEditor'))) {
    const title = document.querySelector('#title');
    function resizeTitle() {
      title.style.height = '46px';
      title.style.height = (title.scrollHeight) + 'px';
    }
    $('#title').on('input', resizeTitle);
    $(window).on('resize', resizeTitle);
    resizeTitle();
    
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
