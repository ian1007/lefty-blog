'use strict';

import gulp from 'gulp';
import sass from 'gulp-sass';
import babel from 'gulp-babel';
import postcss from 'gulp-postcss';
import autoprefixer from 'autoprefixer';
import cleancss from 'gulp-clean-css';
import uglify from 'gulp-uglify';
import savelicense from 'uglify-save-license';
import concat from 'gulp-concat';
import sourcemaps from 'gulp-sourcemaps';
import plumber from 'gulp-plumber';
import del from 'del';
import svgmin from 'gulp-svgmin';
import gulpif from 'gulp-if';
import minimist from 'minimist';
import purgecss from 'gulp-purgecss';

// 清除 cache，每次有更動靜態檔案時，要填上日期
const date = 20210524;

const paths = {
  css: {
    // 編譯時不需要 concat 帶有 '_' 的檔案，因為在 all.scss 就 import 全部了
    src: './source/stylesheets/all.scss',
    include: ['./node_modules/bootstrap/scss'],
    dest: './public/purgecss/'
  },
  adminCss: {
    src: './source/stylesheets/admin.scss',
    include: ['./node_modules/bootstrap/scss'],
    dest: './public/purgecss/'
  },
  purgecss: {
    all: `./public/purgecss/all_${date}.css`,
    admin: `./public/purgecss/admin_${date}.css`,
    dest: './public/'
  },
  // 自己寫的 js，需要壓縮等等的處理
  js: {
    src: [
      './source/javascripts/*.js',
      './source/javascripts/pages/**/*.js',
      '!./source/javascripts/pages/admin/**/*.js'
    ],
    dest: './public/'
  },
  adminJs: {
    src: [
      './source/javascripts/*.js',
      './source/javascripts/pages/admin/**/*.js',
    ],
    dest: './public/'
  },
  // 套用外部的 js，且會被 concat
  vendorJs: {
    src: [
      // 如果用到的 jQuery 不在範圍內的話，將 slim.min.js 改為 min.js
      './node_modules/jquery/dist/jquery.min.js',
      './node_modules/bootstrap/dist/js/bootstrap.bundle.min.js',
      // 輪播
      './node_modules/swiper/swiper-bundle.min.js',
      // 側邊欄的 instagram
      './source/vendor/instafeed.min.js',
      // 使浮動側邊欄 responsive
      './source/vendor/resize-sensor.js',
      // 浮動側邊欄
      './source/vendor/sticky-sidebar.js',
      // lazy loading
      './node_modules/lazysizes/lazysizes.min.js',
      // 放大圖片
      './node_modules/medium-zoom/dist/medium-zoom.min.js',
      // 用來驗證表單
      './node_modules/validate.js/validate.min.js',
      './node_modules/underscore/underscore-min.js',
    ],
    dest: './public/'
  },
  adminVendorJs: {
    src: [
      './node_modules/jquery/dist/jquery.min.js',
      './node_modules/bootstrap/dist/js/bootstrap.bundle.min.js',
      './node_modules/swiper/swiper-bundle.min.js',
      './source/vendor/instafeed.min.js',
      './source/vendor/resize-sensor.js',
      './source/vendor/sticky-sidebar.js',
      './node_modules/lazysizes/lazysizes.min.js',
      './node_modules/medium-zoom/dist/medium-zoom.min.js',
      // 用來切割圖片
      './node_modules/croppie/croppie.min.js',
      // 用來添加 tags/keywords
      './source/vendor/bootstrap-tagsinput.min.js',
      // 用來提示表單內容
      './node_modules/corejs-typeahead/dist/typeahead.bundle.min.js',
      // 用來驗證表單
      './node_modules/validate.js/validate.min.js',
      './node_modules/underscore/underscore-min.js',
    ],
    dest: './public/'
  },
  svg: {
    src: './source/images/**/*.svg',
    dest: './public/'
  },
  copy: {
    src: [
      './source/images/**/!(*.svg)',
      './source/vendor/ckeditor.js',
      './source/vendor/sharded-counter.js',
      './source/vendor/algolia_20210508.js',
      './source/robots.txt'
    ],
    dest: './public/'
  },
  remove: {
    dest: './public/'
  },
  watch: {
    css: './source/stylesheets/**/*.scss',
    js: './source/javascripts/**/*.js',
    vendor: './source/vendor/**/*.js'
  }
};

// 切換開發中與開發完成的顯示方式（壓縮等等的）
const envOptions = {
  string: 'env',
  default: { env: 'develop' }
}
const options = minimist(process.argv.slice(2), envOptions)

// $ gulp css
export function css() {
  return gulp
    // 尋找檔案路徑，並過濾自從上次到這次沒有變更的檔案
    .src(paths.css.src)
    // 在一開始下 plumber 來獲得錯誤訊息，沒有加且出現錯誤的話，gulp 會中斷
    .pipe(plumber())
    // 在合併前先下 sourcemaps，在瀏覽器偵錯時可以馬上知道在哪個檔案
    .pipe(gulpif(options.env === 'develop', sourcemaps.init()))
    // 合併成一支檔案
    .pipe(concat(`all_${date}.scss`))
    // 編譯成 css
    .pipe(sass({
      // 在這裡引入的話，就不用在 all.scss 中填寫完整的路徑
      includePaths: paths.css.include
    }).on('error', sass.logError))
    // 根據 package.json 的 browserlist 設定，加上前綴支援瀏覽器
    .pipe(postcss([autoprefixer()]))
    // 開發完成不再需要瀏覽器偵錯時，壓縮檔案
    .pipe(gulpif(options.env === 'production', cleancss({
      level: 2
    })))
    .pipe(gulpif(options.env === 'develop', sourcemaps.write('.')))
    // 存放檔案
    .pipe(gulp.dest(paths.css.dest));
}

// $ gulp adminCss
export function adminCss() {
  return gulp
    .src(paths.adminCss.src)
    .pipe(plumber())
    .pipe(gulpif(options.env === 'develop', sourcemaps.init()))
    .pipe(concat(`admin_${date}.scss`))
    .pipe(sass({
      includePaths: paths.adminCss.include
    }).on('error', sass.logError))
    .pipe(postcss([autoprefixer()]))
    .pipe(gulpif(options.env === 'production', cleancss({
      level: 2
    })))
    .pipe(gulpif(options.env === 'develop', sourcemaps.write('.')))
    .pipe(gulp.dest(paths.adminCss.dest));
}

// $ gulp purgeCss
export function purgeCss() {
  return gulp
    .src(paths.purgecss.all)
    .pipe(plumber())
    .pipe(purgecss({
      content: ['./functions/views/*.pug', './functions/views/partials/*.pug', `./public/all_${date}.js`, `./public/vendor_${date}.js`],
      fontFace: true,
      variables: true,
      safelist: ['figcaption']
    }))
    .pipe(gulp.dest(paths.purgecss.dest))
}

// $ gulp purgeAdminCss
export function purgeAdminCss() {
  return gulp
    .src(paths.purgecss.admin)
    .pipe(plumber())
    .pipe(purgecss({
      content: ['./functions/views/admin/**/*.pug', `./public/admin_${date}.js`, `./public/adminVendor_${date}.js`, './public/ckeditor.js'],
      fontFace: true,
      variables: true,
      safelist: ['cr-vp-circle', '.ck-media__wrapper', 'figcaption']
    }))
    .pipe(gulp.dest(paths.purgecss.dest))
}

// $ gulp cleanCss
export const cleanCss = () => del(paths.css.dest);

// $ gulp js
export function js() {
  return gulp
    .src(paths.js.src)
    .pipe(plumber())
    .pipe(gulpif(options.env === 'develop', sourcemaps.init()))
    .pipe(concat(`all_${date}.js`))
    .pipe(babel({ presets: ['@babel/preset-env'] }))
    .pipe(gulpif(options.env === 'production', uglify({
      // 拿掉所有 console 指令
      compress: { drop_console: true }
    })))
    .pipe(gulpif(options.env === 'develop', sourcemaps.write('.')))
    .pipe(gulp.dest(paths.js.dest));
}

// $ gulp adminJs
export function adminJs() {
  return gulp
    .src(paths.adminJs.src)
    .pipe(plumber())
    .pipe(gulpif(options.env === 'develop', sourcemaps.init()))
    .pipe(concat(`admin_${date}.js`))
    .pipe(babel({ presets: ['@babel/preset-env'] }))
    .pipe(gulpif(options.env === 'production', uglify({
      compress: { drop_console: true }
    })))
    .pipe(gulpif(options.env === 'develop', sourcemaps.write('.')))
    .pipe(gulp.dest(paths.adminJs.dest));
}

// $ gulp vendorJs
export function vendorJs() {
  return gulp
    .src(paths.vendorJs.src)
    .pipe(concat(`vendor_${date}.js`))
    .pipe(uglify({
      output: {
        comments: savelicense
      }
    }))
    .pipe(gulp.dest(paths.vendorJs.dest));
};

// $ gulp adminVendorJs
export function adminVendorJs() {
  return gulp
    .src(paths.adminVendorJs.src)
    .pipe(concat(`adminVendor_${date}.js`))
    .pipe(uglify({
      output: {
        comments: savelicense
      }
    }))
    .pipe(gulp.dest(paths.adminVendorJs.dest));
};

// $ gulp svg
export function svg() {
  return gulp
    .src(paths.svg.src)
    .pipe(plumber())
    .pipe(svgmin())
    .pipe(gulp.dest(paths.svg.dest));
}

// $ gulp copy
export function copy() {
  return gulp
    .src(paths.copy.src)
    .pipe(gulp.dest(paths.copy.dest));
}

// $ gulp clean
export const clean = () => del(paths.remove.dest);

// $ gulp watch
function watchFiles() {
  gulp.watch(paths.watch.css, gulp.series(css, adminCss, purgeCss, purgeAdminCss));
  gulp.watch(paths.watch.js, gulp.series(js, adminJs));
  gulp.watch(paths.watch.vendor, gulp.series(vendorJs, adminVendorJs));
}
export { watchFiles as watch };

// $ gulp build
export const build = gulp.series(css, adminCss, js, adminJs, vendorJs, adminVendorJs, svg, copy, purgeCss, purgeAdminCss, cleanCss);

// $ gulp prod
export const prod = gulp.series(clean, build);

// $ gulp
export default gulp.series(build, watchFiles);