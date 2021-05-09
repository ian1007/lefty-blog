'use strict';

// firebase init functions 建立的
const functions = require('firebase-functions');
// express-generator 建立的
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
// session
const firebaseAdmin = require('./connections/firebase_admin_connection');
const auth = firebaseAdmin.auth;

// routes 資料夾下有幾個檔案，這裡就宣告幾個。routes 資料夾下的檔案，以身份為單位，一般訪客就是 index.js，管理者則是 admin.js
const indexRouter = require('./routes/index');
const adminRouter = require('./routes/admin');
const authRouter = require('./routes/auth');
const ampRouter = require('./routes/amp');

// for 404 & error
const moment = require('moment');
moment.locale('zh-tw');
const bloggerModule = require('./module/blogger');
const blogger = bloggerModule.blogger;
const descriptionModule = require('./module/description');
const description = descriptionModule.description;

const app = express();

// view engine setup
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 確認用戶的權限
const authCheck = (req, res, next) => {
  const sessionCookie = req.cookies.__session || '';
  auth.verifySessionCookie(sessionCookie, true)
    .then((decodedClaims) => {
      req.decodedClaims = decodedClaims;
      return next();
    })
    .catch(error => {
      return res.redirect('/auth/login');
    });
}

// routes 資料夾下有幾個檔案，這裡就宣告幾個。左邊是路徑的前綴，一般訪客的前綴為 '/'，管理者則是 '/admin'
app.use('/amp', ampRouter);
app.use('/auth', authRouter);
app.use('/admin', authCheck, adminRouter);
app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use('/admin', authCheck, (req, res, next) => {
  res.status(404);
  res.render('admin/admin_404', {
    blogger,
    title: blogger.author,
    description: description.index,
    path: blogger.domain,
    featuredImage: blogger.imageUrl,
    moment
  });
});
app.use((req, res, next) => {
  res.status(404);
  res.render('404', {
    blogger,
    title: blogger.author,
    description: description.index,
    path: blogger.domain,
    featuredImage: blogger.imageUrl,
    moment
  });
});

// error handler
app.use('/admin', authCheck, (err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('admin/admin_error', {
    blogger,
    title: blogger.author,
    description: description.index,
    path: blogger.domain,
    featuredImage: blogger.imageUrl,
    moment
  });
});
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error', {
    blogger,
    title: blogger.author,
    description: description.index,
    path: blogger.domain,
    featuredImage: blogger.imageUrl,
    moment
  });
});

exports.app = functions.https.onRequest(app);


// algolia
const algoliasearch = require('algoliasearch');
// initailize the Algolia Client
const client = algoliasearch(functions.config().algolia.appid, functions.config().algolia.apikey);
const index = client.initIndex(blogger.algoliaIndex);

// 同步新增
exports.addPosts = functions.firestore
  .document('posts/{postID}')
  .onCreate((snapshot, context) => {
    const data = snapshot.data();
    return index.saveObject(data);
  });

// 同步更新
exports.updatePosts = functions.firestore
  .document('posts/{postID}')
  .onUpdate((snapshot, context) => {
    const data = snapshot.after.data();
    return index.partialUpdateObject(data);
  });

// 同步刪除
exports.deletePosts = functions.firestore
  .document('posts/{postID}')
  .onDelete((snapshot, context) => {
    return index.deleteObject(snapshot.id);
  });

