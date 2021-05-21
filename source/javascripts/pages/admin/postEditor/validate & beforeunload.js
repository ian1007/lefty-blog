'use strict';

// 大體上分三條路線驗證
// 1. 按下送出後所有欄位會再次驗證，沒錯誤的話 ➡️ 3.
// 2. 監聽每個需要被驗證的欄位，在輸入後點擊欄外或是跳到下一個欄位等等之離開該欄位之行為，即會偵測一次錯誤，沒錯誤的話 ➡️ 3.
// 3. 經由後端驗證是否已存在網址

// 全部驗證成功後，送出前會抓取 descriptionDefault（貼文預覽描述）與  featuredImage（貼文預覽圖片）

// beforeunload 的條件
// 1. 不是按送出鍵 且
// 2. 原本有內容但有更動過，或是，原本沒內容但最後有內容

$(function () {
  if (document.body.contains(document.querySelector('#postEditor'))) {
    (function () {
      const constraints = {
        'title': { // 貼文標題
          presence: {
            message: '這個必須填寫哦！',
          },
          length: {
            maximum: 50,
            message: '最多輸入50個字元哦！',
          },
        },
        'tags': { // 標籤
          length: {
            maximum: 50,
            message: '最多輸入50個字元哦！',
          },
        },
        'description': { // 貼文簡介
          length: {
            maximum: 150,
            message: '最多輸入150個字元哦！',
          },
        },
        'path': { // 網址
          presence: {
            message: '這個必須填寫哦！',
          },
          length: {
            maximum: 50,
            message: '最多輸入50個字元哦！',
          },
          format: {
            pattern: '^(?:[a-zA-Z0-9\u00a1-\uffff](?:-)*)*[a-zA-Z0-9\u00a1-\uffff]$',
            message: '格式不正確，請重新輸入！',
          },
          exclusion: {
            within: { create: 'create' },
            message: '不能使用 %{value} 作為網址！',
          },
        },
      };
      // beforeunload
      let submitting = false;
      const hadContent = !(!$('#title').val() && !editor.getData() && !$('#tags').val() && !$('#description').val() && !$('#path').val());
      let hasChanged = false;
      $('#title, #tags, #description, #path').on('change', function () {
        hasChanged = true;
      });
      editor.model.document.on('change:data', function () {
        hasChanged = true;
      });
      window.addEventListener('beforeunload', function (e) {
        // 不是按送出鍵，且，（原本有內容但有更動過，或是，原本沒內容但最後有內容）
        if (submitting === false && ((hadContent && hasChanged) || (!hadContent && !(!$('#title').val() && !editor.getData() && !$('#tags').val() && !$('#description').val() && !$('#path').val())))) {
          e.returnValue = '';
          e.preventDefault();
        }
      });

      const submitButton = document.querySelector('#postEditor button');
      // validate
      // 1. 防止表單在驗證之前傳送
      const form = document.querySelector('form#main-content');
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        submitButton.disabled = true;
        // 送出時不會啟動 beforeunload 的提示
        submitting = true;
        handleFormSubmit(form);
      });

      // 2. 監聽 input 值改變的狀況
      const inputs = document.querySelectorAll('textarea[name="title"], textarea[name="description"], input[name="path"]');
      for (let i = 0; i < inputs.length; ++i) {
        inputs.item(i).addEventListener('change', function (e) {
          const errors = validate(form, constraints) || {}; // 根據 constraints 驗證表單
          showErrorsForInput(this, errors[this.name], false);
        });
      }

      // 3. 經由後端驗證是否已存在網址
      function handleOverlapping(input, submit) {
        if (submit) {
          $('#postEditor button').html('<div class="sk-chase-large"><div class="sk-chase-dot"></div><div class="sk-chase-dot"></div><div class="sk-chase-dot"></div><div class="sk-chase-dot"></div><div class="sk-chase-dot"></div><div class="sk-chase-dot"></div></div>');
        }
        const id = $('form#main-content').attr('data-id');
        const path = $('#path').val();
        $.ajax({
          url: '/admin/post/overlapping',
          method: 'POST',
          data: {
            id: id,
            path: path,
          },
        }).done(function (res) {
          if (res === '已有重複的網址') {
            const postPath = $('input#path');
            const errorPath = ['Path 該網址已被使用！'];
            _.find(postPath, function (input) {
              showErrorsForInput(input, errorPath, submit);
            });
            // 恢復 beforeunload 的提示
            submitting = false;
            if (submit) {
              $('#postEditor button').html('發佈');
              submitButton.disabled = false;
            }
          } else if (res === '沒有重複') {
            // 是透過 2. 監聽進來的
            if (!submit) {
              _.find($('input#path'), function (input) {
                const formGroup = closestParent(input.parentNode, 'form-group');
                resetFormGroup(formGroup);
                formGroup.classList.add('has-success');
              });
            } else { // 是透過 1. 送出進來的
              _.find($('input#path'), function (input) {
                const formGroupPath = closestParent(input.parentNode, 'form-group');
                resetFormGroup(formGroupPath);
                formGroupPath.classList.add('has-success');
              });
              // 檢查內文是否少於 50 字
              if ($('.ck-content').text().length < 50) {
                const content = $('textarea.editor');
                const insufficient = ['Content 內文最少輸入50個字元哦！'];
                _.find(content, function (input) {
                  showErrorsForInput(input, insufficient, submit);
                });
                // 恢復 beforeunload 的提示
                submitting = false;
                $('#postEditor button').html('發佈');
                submitButton.disabled = false;
              }
              else {
                _.find($('textarea.editor'), function (input) {
                  const formGroupContent = closestParent(input.parentNode, 'form-group');
                  resetFormGroup(formGroupContent);
                  formGroupContent.classList.add('has-success');
                });
                // descriptionDefault
                const descriptionDefault = $('.ck-content p').first().text();
                $('#descriptionDefault').val(descriptionDefault);
                // featuredImage
                // 等於第一張出現的圖片（可能是一般圖片或是影片的縮圖）
                let featuredImage = $('.ck-content figure img, .ck-content figure iframe').attr('src');
                // 如果是 YouTube 影片的話，則抓出影片的 ID
                const youtubePattern = RegExp('https://www.youtube.com/embed/');
                if (youtubePattern.test(featuredImage)) {
                  const youtubeID = featuredImage.substring((featuredImage.lastIndexOf('/') + 1), featuredImage.length);
                  // 套用在 YouTube 影片縮圖的 pattern
                  featuredImage = 'https://i.ytimg.com/vi/' + youtubeID + '/maxresdefault.jpg';
                  $('#featuredImage').val(featuredImage);
                  // 送出
                  $('form#main-content').trigger('submit');
                } else {
                  // 不是 YouTube 影片的話，可能是別種影片，或是一般圖片。排除其他種影片，擷取一般圖片的 src
                  featuredImage = $('.ck-content figure img').attr('src');
                  featuredImage = featuredImage.replace(/640x640/, '200x200')
                  $('#featuredImage').val(featuredImage);
                  // 送出
                  $('form#main-content').trigger('submit');
                }
              }
            }
          }
        });
      }

      // 驗證，然後透過 showErrorsForInput 顯示錯誤
      function handleFormSubmit(form) {
        const errors = validate(form, constraints); // 根據 constraints 驗證表單
        showErrors(form, errors || {}); // 根據錯誤內容更新錯誤資訊
      }

      // 根據錯誤內容更新錯誤資訊
      function showErrors(form, errors) {
        // 查看每個 input 內容是否有錯誤
        _.each(form.querySelectorAll('textarea[name="title"], input[name="tags"], textarea[name="description"], input[name="path"]'), function (input) {
          showErrorsForInput(input, errors && errors[input.name], true);
        });
      }

      // 針對特定 input 顯示錯誤內容
      function showErrorsForInput(input, errors, submit) {
        // 尋找每個 input 外的 form-group
        const formGroup = closestParent(input.parentNode, 'form-group');
        // 尋找每個 input 下的錯誤內容顯示區塊
        const messages = formGroup.querySelector('.messages');
        // 首先移除舊的錯誤以及舊的 class
        resetFormGroup(formGroup);
        // 如果有錯誤（第一次）
        if (errors) {
          formGroup.classList.add('has-error');
          _.each(errors, function (error) {
            addError(messages, error);
          });
          // 恢復 beforeunload 的提示
          submitting = false;
        } else {
          // 需要再次驗證的表單內容
          if (input.id === 'path') {
            handleOverlapping(input, submit);
          } else {
            formGroup.classList.add('has-success');
          }
        }
      }

      // 尋找每個 input 外的 form-group
      function closestParent(child, className) {
        if (!child || child == document) {
          return null;
        }
        if (child.classList.contains(className)) {
          return child;
        } else {
          return closestParent(child.parentNode, className);
        }
      }

      // 移除舊的錯誤以及舊的 class
      function resetFormGroup(formGroup) {
        // 移除舊有 class
        formGroup.classList.remove('has-error');
        formGroup.classList.remove('has-success');
        // 移除舊有錯誤內容
        _.each(formGroup.querySelectorAll('.help-block.error'), function (e) {
          e.parentNode.removeChild(e);
        });
      }

      // 以以下的形式加上錯誤
      // <p class='help-block error'>[message]</p>
      function addError(messages, errorWithName) {
        const block = document.createElement('p');
        block.classList.add('help-block');
        block.classList.add('error');
        // 去除掉欄位的 name（原本會在錯誤訊息前加上欄位的 name 以及一個空格）
        let error = '';
        for (let i = 0; i < errorWithName.length; i++) {
          if (errorWithName[i] === ' ') {
            for (let j = i + 1; j < errorWithName.length; j++) {
              error += errorWithName[j];
            }
            break;
          }
        }
        block.innerText = error;
        messages.appendChild(block);
      }
    })();
  }
});
