'use strict';

$(function(){
  if (document.body.contains(document.querySelector('#post'))) {
    mediumZoom('.image > img', {
      margin: 24,
      background: '#fff', // default
      scrollOffset: 40, // default
    });
  }
});
