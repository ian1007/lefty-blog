'use strict';

$(function () {
  if (document.body.contains(document.querySelector('#postEditor')) && $('form#main-content').attr('data-status') === 'creating') {
    let autosaveTimer;
    const timeout = 5000;
    const id = $('form#main-content').attr('data-id');
    $('#title, input[name=category], #description, #path').on('input', function () {
      if (autosaveTimer) {
        clearTimeout(autosaveTimer);
      }
      autosaveTimer = setTimeout(saveData, timeout);
    });
    $('#tags').on('itemAdded itemRemoved', function () {
      if (autosaveTimer) {
        clearTimeout(autosaveTimer);
      }
      autosaveTimer = setTimeout(saveData, timeout);
    });
    editor.model.document.on('change:data', function () {
      if (autosaveTimer) {
        clearTimeout(autosaveTimer);
      }
      autosaveTimer = setTimeout(saveData, timeout);
    });
    function saveData() {
      const title = $('#title').val();
      let tags = '';
      const total = $('.bootstrap-tagsinput span.tag').length;
      $('.bootstrap-tagsinput span.tag').each(function (index, tag) {
        if (index === total - 1) {
          tags += $(tag).text();
        }
        else {
          tags += $(tag).text() + ',';
        }
      })
      const category = $('input[name=category]:checked').val();
      const description = $('#description').val();
      const path = $('#path').val();
      const content = editor.getData();
      $.ajax({
        url: `/admin/post/autosave/${id}`,
        method: 'POST',
        data: {
          title: title,
          tags: tags,
          category: category,
          description: description,
          path: path,
          content: content,
        },
      });
    }
  }
});
