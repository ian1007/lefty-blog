'use strict';

// 大體上分兩條路線驗證
// 1. 按下送出後所有欄位會再次驗證，沒錯誤的話送出
// 2. 監聽每個需要被驗證的欄位，在輸入後點擊欄外或是跳到下一個欄位等等之離開該欄位之行為，即會偵測一次錯誤

$(function () {
  if (document.body.contains(document.querySelector('.sidebar__subscribe'))) {
    (function () {
      const constraints = {
        'subscriber': { // 訂閱的人
          presence: {
            message: '這個必須填寫哦！',
          },
          length: {
            maximum: 20,
            message: '最多輸入20個字元哦！',
          },
        },
        'email': { // 信箱
          presence: {
            message: '這個必須填寫哦！',
          },
          length: {
            maximum: 40,
            message: '最多輸入40個字元哦！',
          },
        },
      };

      let allpass = true;
      const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
      const submitButton = document.querySelector('.sidebar__subscribe button');
      // validate
      // 1. 防止表單在驗證之前傳送
      const form = document.querySelector('form#subscribe');
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        submitButton.disabled = true;
        allpass = true;
        handleFormSubmit(form);
        if (allpass) {
          $('.sidebar__subscribe .btn__icon').remove();
          $('.sidebar__subscribe button').prepend('<div class="sk-chase"><div class="sk-chase-dot"></div><div class="sk-chase-dot"></div><div class="sk-chase-dot"></div><div class="sk-chase-dot"></div><div class="sk-chase-dot"></div><div class="sk-chase-dot"></div></div>');
          const subscriber = $('#subscriber').val();
          const email = $('#email').val();
          $.ajax({
            url: '/subscribe',
            method: 'POST',
            headers: {
              'CSRF-Token': token
            },
            data: {
              subscriber: subscriber,
              email: email,
            },
          }).done(function () {
            form.remove();
            $('span#subscribed').removeClass('d-none');
          }).fail(function() {
            form.remove();
            $('span#subscribeError').removeClass('d-none');
          });
        }
        else {
          submitButton.disabled = false;
        }
      });

      // 2. 監聽 input 值改變的狀況
      const inputs = document.querySelectorAll('.sidebar__subscribe input');
      for (let i = 0; i < inputs.length; ++i) {
        inputs.item(i).addEventListener('change', function (e) {
          const errors = validate(form, constraints) || {}; // 根據 constraints 驗證表單
          showErrorsForInput(this, errors[this.name]);
        });
      }

      // 先做第一次驗證，然後再透過 showErrorsForInput 做完整的驗證
      function handleFormSubmit(form) {
        const errors = validate(form, constraints); // 根據 constraints 驗證表單
        showErrors(form, errors || {}); // 根據錯誤內容更新錯誤資訊
      }

      // 根據錯誤內容更新錯誤資訊
      function showErrors(form, errors) {
        // 查看每個 input 內容是否有錯誤
        _.each(form.querySelectorAll('input[name]'), function (input) {
          showErrorsForInput(input, errors && errors[input.name]);
        });
      }

      // 針對特定 input 顯示錯誤內容
      function showErrorsForInput(input, errors) {
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
          allpass = false;
        } else {
          formGroup.classList.add('has-success');
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