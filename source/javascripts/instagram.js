'use strict';

// 配合 instafeed.min.js 2.0.0
$(function () {
  if (document.body.contains(document.querySelector('.sidebar__instagram'))) {
    $.ajax({
      url: 'https://ig.instant-tokens.com/users/7094b62b-ec94-4bbf-a205-f90d487b7261/instagram/17841404262770428/token?userSecret=tmoy6ty2ifn88dhx1rm837',
      method: 'get',
    }).done(res => {
      var feed = new Instafeed({
        accessToken: JSON.parse(res).Token,
        template: '<a href="{{link}}" data-caption="{{caption}}" target="_blank"><img loading="lazy" src="{{image}}"></a>',
        limit: 4
      });
      feed.run();
    });
  }
});
