'use strict';

$(function () {
  if (document.body.contains(document.querySelector('#preview'))) {
    $('#previewDelete').on('shown.bs.modal', function () { // 當顯示後，會被馬上啟動
      // 監聽確定刪除
      $('#deleteConfirm').on('click', function () {
        const postId = $('#deleteConfirm').attr('data-id');
        $.ajax({
          url: '/admin/post/delete/' + postId,
          method: 'POST',
        }).done(function () {
          $('#' + postId).fadeOut(400, function () {
            if ($(this).siblings('article').length) {
              $(this).remove();
            }
            else {
              const parent = $(this).parent();
              $(this).remove();
              parent.html('<div class="none d-flex flex-column align-items-center"><span class="h4 mt-3 mb-4"> - 還沒有相關的貼文哦 - </span></div>');
            }
          });
        });
      });
    });
  }
});
