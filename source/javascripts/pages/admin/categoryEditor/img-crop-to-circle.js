'use strict';

/* 這個 crop 方法，主要分成三個階段
** 1.上傳($upload) 2.剪裁($crop) 3.結果($result)
** 所以在一開始的變數有 3 個，再加上在第二階段會新增的 dom，$croppie */

/* 值得留意的地方是，在 filedrag 綁定的 label 元素，不行有其他 class，
** 否則在 drag 時再離開後，會因為 fileDragHover() 而全部消失 */

/* 且目前的版本都無法做到 responsive，所以關於長寬得寫死（以最小為考量），
** 並且無法透過 css 控制，並且無法透過多次 cropInit() 來修正長寬，
** 因為開發者已聲明，一個圖片只能初始化一次，確實，如果兩次會跳錯誤 */

/* 如果要改成方形裁切，只需要更改 1. 拿掉 viewport 的 type: circle 2. 拿掉 cropResult() 的 options 的 circle: ture
** 另外就是樣式的修正（pug 的 bootstrap 或是 scss 檔案）而已 */

$(function(){
  if (document.body.contains(document.querySelector('#categoryEditor'))) {
    const $upload = $('#upload');
    const $crop = $('#crop');
    const $result = $('#result');
    const $croppie = $('#croppie');

    let cr;
    let crImg = '';
    let isCropped = 0;
    // 因為不能 responsive，所以都寫死，要與 scss 一致
    const crViewportW = 200;
    const crViewportH = 200;
    const crBoundaryW = 260;
    const crBoundaryH = 260;

    // 判斷是否支援圖片上傳
    $(function () {
      if (window.File && window.FileList && window.FileReader) {
        fileInit();
      } else {
        alert('不好意思，裝置不支援圖片上傳');
      }
    });

    const fileselect = document.querySelector('#fileselect');
    const filedrag = document.querySelector('#filedrag');
    const prev = document.querySelector('#prev');
    const next = document.querySelector('#next');
    const close = document.querySelector('#close');

    // ********** file select / drop **********
    function fileInit() {
      // file select
      fileselect.addEventListener('change', FileSelectHandler);
      // if XHR2 available
      const xhr = new XMLHttpRequest();
      // file drop
      if (xhr.upload) {
        filedrag.addEventListener('dragover', fileDragHover);
        filedrag.addEventListener('dragleave', fileDragHover);
        filedrag.addEventListener('drop', FileSelectHandler);
      }
      prev.addEventListener('click', cropCancel);
      next.addEventListener('click', cropResult);
      close.addEventListener('click', cropCancel);
    }

    // file selection
    function FileSelectHandler(e) {
      // cancel event and hover styling
      fileDragHover(e);
      // fetch FileList object
      const files = e.target.files || e.dataTransfer.files;
      if (files[0] && files[0].type.match('image.*')) {
        const reader = new FileReader();
        reader.onload = function (e) {
          $upload.hide();
          if (crImg == '') { // 第一次上傳
            crImg = e.target.result;
            cropInit();
          } else { // 綁定照片
            crImg = e.target.result;
            bindCropImg();
          }
          $crop.css('display', 'flex').hide().fadeIn();
        };
        reader.readAsDataURL(files[0]);
      }
    }

    // file drag hover
    function fileDragHover(e) {
      e.stopPropagation();
      e.preventDefault();
      filedrag.className = (e.type == 'dragover' ? 'hover' : '');
    }

    // ********** crop **********
    // 裁切設定，一個圖片只能一次！
    function cropInit() {
      cr = $croppie.croppie({
        viewport: {
          width: crViewportW,
          height: crViewportH,
          type: 'circle',
        },
        boundary: {
          width: crBoundaryW,
          height: crBoundaryH,
        },
        mouseWheelZoom: false,
      });

      $('.cr-slider-wrap');

      bindCropImg();
    }

    // 綁定圖片
    function bindCropImg() {
      cr.croppie('bind', {
        url: crImg,
      });
    }

    // 取消裁切
    function cropCancel() {
      if ($upload.is(':hidden')) {
        $upload.fadeIn().siblings().hide();
        $result.find('img').attr('src', '');
        fileselect.value = '';
        $('#thumbnail').val('');
        isCropped = 0;
      }
    }

    // 圖片裁切
    function cropResult() {
      if (!isCropped) {
        isCropped = 1;
        cr.croppie('result', {
          type: 'canvas', // 'base64'｜'html'｜'blob'
          size: { width: crViewportW, height: crViewportH }, // 'viewport'｜'original'｜{ width: 500, height: 500 }
          format: 'png', // 'jpeg'｜'png'｜'webp'
          quality: 1, // 0~1
          circle: true,
        }).then(function (resp) {
          $crop.hide();
          $result.find('img').attr('src', resp);
          $('#thumbnail').val(resp);
          $result.css('display', 'flex').hide().fadeIn();
        });
      }
    }
  }
});
