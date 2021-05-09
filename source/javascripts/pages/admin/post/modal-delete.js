'use strict';

$(function(){
  if (document.body.contains(document.querySelector('#post'))) {
    $('#postDelete').on('shown.bs.modal', function () { // 當顯示後，會被馬上啟動
      // 監聽確定刪除
      $('#deleteConfirm').on('click', function () {
        const postId = $('#deleteConfirm').attr('data-id');
        $.ajax({
          url: '/admin/post/delete/' + postId,
          method: 'POST',
        }).done(function () {
          window.location.href = '/admin';
        });
      });
    });
  }
});
