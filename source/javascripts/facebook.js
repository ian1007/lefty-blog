'use strict';

$(function(){
  if (document.body.contains(document.querySelector('.sidebar__facebook'))) {
    const changeFBPagePlugin = function () {
      let containerWidth = Number($('#fb-container').width()).toFixed(0);
      if (!isNaN(containerWidth)) {
        if (containerWidth > 500) {
          containerWidth = 500; // 根據 document，最寬就 500
        }
        $('.fb-page').attr('data-width', containerWidth);
      }
      if (typeof FB !== 'undefined') {
        FB.XFBML.parse();
      }
    };
    // 頁面載入後執行一次
    changeFBPagePlugin();
    // 監聽 resize
    $(window).on('resize', function () {
      setTimeout(function () {
        changeFBPagePlugin();
      }, 500);
    });
  }
});
