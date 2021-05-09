'use strict';

$(function () {
  if (document.body.contains(document.querySelector('.sidebar__profile'))) {
    // hover 開啟或關閉 collapse
    $('.sidebar__profile button').on('mouseenter', function () {
      $(this).find('.collapse').collapse('show');
    });
    $('.sidebar__profile button').on('mouseleave', function () {
      $(this).find('.collapse').collapse('hide');
    });
    // 由於在 'show.bs.collapse' 時無法 hide，所以在 'shown.bs.collapse'，也就是全部呈現後，監聽是否 hover，不是的話則 hide
    $('.sidebar__profile .collapse').on('shown.bs.collapse', function () {
      if (!$(this).parent('button').is(':hover')) {
        $(this).collapse('hide');
      }
    });
  }
  if (document.body.contains(document.querySelector('#aboutme'))) {
    $('.aboutme__profile button').on('mouseenter', function () {
      $(this).find('.collapse').collapse('show');
    });
    $('.aboutme__profile button').on('mouseleave', function () {
      $(this).find('.collapse').collapse('hide');
    });
    $('.aboutme__profile .collapse').on('shown.bs.collapse', function () {
      if (!$(this).parent('button').is(':hover')) {
        $(this).collapse('hide');
      }
    });
  }
});
