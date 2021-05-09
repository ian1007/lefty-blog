'use strict';

$(function () {
  if (document.body.contains(document.querySelector('#postEditor'))) {
    // ckeditor 範例中會加的 class
    $('body').attr({ 'data-editor': 'ClassicEditor', 'data-collaboration': 'false' });
  }
});
