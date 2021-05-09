'use strict';

$(function(){
  if (document.body.contains(document.querySelector('#categories'))) {
    $('#categoryDelete').on('shown.bs.modal', function () { // 當顯示後，會被馬上啟動
      // 監聽確定刪除
      $('#deleteConfirm').on('click', function () {
        const categoryId = $('#deleteConfirm').attr('data-id');
        $.ajax({
          url: '/admin/category/delete/' + categoryId,
          method: 'POST',
        }).done(function () {
          $('#' + categoryId).fadeOut(400, function () {
            $(this).remove();
          });
        });
      });
    });
  }
});
