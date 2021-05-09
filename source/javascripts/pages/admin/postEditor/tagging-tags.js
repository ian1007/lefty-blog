'use strict';

$(function () {
  if (document.body.contains(document.querySelector('#postEditor'))) {
    // 提供資料庫中已有的 tags
    const tags = new Bloodhound({
      datumTokenizer: Bloodhound.tokenizers.whitespace,
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      prefetch: {
        url: '/admin/typeahead/tags',
        cache: false,
      },
    });
    tags.initialize();
    // 初始化 tagsinput
    $('#tags').tagsinput({
      trimValue: true, // 自動移除左右兩側的空白
      typeaheadjs: [{
        hint: false,
        highlight: true,
        minLength: 1,
      }, {
        name: 'tags',
        source: tags.ttAdapter(),
      }],
    });
    // 當 input 在 focus 時，加到外框 div 的效果
    $('.twitter-typeahead').find('input').on('focus', function () {
      $('.twitter-typeahead').parent('.bootstrap-tagsinput').addClass('bootstrap__tagsinput--focus');
    });
    $('.twitter-typeahead').find('input').on('focusout', function () {
      $('.twitter-typeahead').parent('.bootstrap-tagsinput').removeClass('bootstrap__tagsinput--focus');
    });
    // resize input width（依據 value 的長度 + 1 來改變長度）
    function resizeTags(input, factor) {
      const int = Number(factor) || 1;
      function resize() {
        input.style.width = ((input.value.length + 1) * int) + 'rem';
      }
      const e = 'keyup,keypress,focus,blur,change'.split(',');
      for (let i in e) {
        input.addEventListener(e[i], resize);
      }
      resize();
    }
    resizeTags(document.querySelector('.bootstrap-tagsinput input'), 1);
  }
});
