'use strict';

$(function(){
  if (document.body.contains(document.querySelector('#preview'))) {
    // 初始化 Bootstrap 的 popover
    $('.btn__more').each(function () {
      $(this).popover({
        container: 'body',
        html: true, // 可以塞入 html，內容在 views 裡，預設要 hide
        sanitize: false, // 不會過濾特定 html tags
        content: function () { // 塞入的內容
          return $('#preview__more').html();
        },
      }).on('show.bs.popover', function () { // 當被點擊後，會被馬上啟動
        // 傳遞參數給 popover
        const postPath = $(this).attr('data-path');
        const postId = $(this).attr('data-id');
        $('#preview__more').find('a').attr('href', '/admin/post/' + postPath);
        $('#preview__more').find('button').attr('data-id', postId);
        // 傳遞參數給 modal
        $('#deleteConfirm').attr('data-id', postId);
      }).on('shown.bs.popover', function () { // 當顯示後，會被馬上啟動
        $('body').on('click', function (e) {
          $('.btn__more').each(function () {
            // 在 Bootstrap 的 popover 預設(trigger: 'click')下，不管點擊哪個，都會直接打開，即使有其他 popover 已經打開
            // 所以以下就是盡可能的關閉 popover，在幾種情況下
            // 1. 再次點擊同個 button 時會關閉（但是不是由於以下程式碼，而是預設的 trigger: 'click'）
            // 2. 當「點擊不是該 button」時且「button 的子元素不是被點擊的對象」時且已打開的（已掛載 .popover class 的）popover 不是被點擊的對象時
            // 3. 當點擊裡面的選項
            // 在以上三種情況下，popover 會關閉
            if ((!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0)) {
              $(this).popover('hide');
            }
            else if ($('.more__option').is(e.target)) {
              $(this).popover('hide');
            }
          });
        });
      });
    });
  }
});
