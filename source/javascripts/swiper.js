'use strict';

$(function () {
  if (document.body.contains(document.querySelector('.swiper-container'))) {
    new Swiper('.swiper-container', {
      runCallbacksOnInit: false, // 如果初始化的 slide 不是第一個（例如 initialSlide:2）或者設定了 loop:true，那麼初始化時會觸發一次 [Transition/SlideChange] [Start/End] 回調函數，如果不想觸發，設定為 false。
      watchOverflow: true, // 當沒有足夠的 slide 切換時，例如只有 1 個slide（非loop），swiper 會失效且隱藏 navigation buttons 等。
      spaceBetween: 8, // slide 之間的 margin，單位 px。
      slidesPerView: 'auto', // 設定 slider 容器能夠同時顯示的 slide 數量。可以設定為數字，或是 'auto' 則會自動根據 slide 的寬度來設定數量。loop 模式下如果設定為 'auto'，還需要設定另一個參數：loopedSlides。
      centeredSlides: true, // true 時，active slide 會居中，而不是預設狀態下的居左。
      loop: true,
      loopedSlides: 3, // 在 loop 模式下使用 slidesPerview:'auto' 的話，還需使用該參數設定所要用到的 loop 個數（一般設定為本來的 slide 的數量）。
      lazy: true,
      preloadImages: false,
      navigation: {
        nextEl: '.swiper-button-next', // 設定才能切換
        prevEl: '.swiper-button-prev', // 設定才能切換
      },
      pagination: {
        el: '.swiper-pagination', // 設定才會顯示
        type: 'bullets',
        clickable: true, // 可以點擊 pagination 以切換 slide
      },
      autoplay: {
        delay: 4000,
      },
    });
    // 當使用者正在 hover/click 之類的互動時，不會 autoplay
    $('.swiper-container').on('mouseenter touchstart', function () {
      (this).swiper.autoplay.stop();
    });
    $('.swiper-container').on('mouseleave touchend', function () {
      (this).swiper.autoplay.start();
    });
  }
});
