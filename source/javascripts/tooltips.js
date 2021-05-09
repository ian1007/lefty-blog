'use strict';

$(function(){
  if (document.body.contains(document.querySelector('#post'))) {
    $(function () {
      $('[data-toggle="tooltip"]').tooltip({
        container: 'body',
      });
    });
  }
});
