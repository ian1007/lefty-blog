'use strict';

$(function(){
  if (document.body.contains(document.querySelector('#sidebar'))) {
    // 初始化
    new StickySidebar('#sidebar', {
      containerSelector: '#main-content', // #sidebar 的上一層 parent
      innerWrapperSelector: '.sidebar__inner',
      resizeSensor: true, // 需搭配 resize-sensor.js
      topSpacing: 61, // navbar + border 的高度
      minWidth: 991, // 多少寬度以下，sidebar 不使用 sticky-sidebar.js，回到原本的位置
    });
  }
});
