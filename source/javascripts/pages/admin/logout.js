'use strict';

$(function(){
  if (document.body.contains(document.querySelector('#navbarCollapse'))) {
    $('#logoutConfirm').on('click', function () {
      $.ajax({
        url: '/auth/logout',
        method: 'POST',
      }).done(function () {
        window.location.href = '/';
      });
    });
  }
});
