'use strict';

const express = require('express');
const router = express.Router();

const firebase = require('../connections/firebase_connection');
const firebaseConfig = firebase.firebaseConfig;
const firebaseAdmin = require('../connections/firebase_admin_connection');
const auth = firebaseAdmin.auth;

const bloggerModule = require('../module/blogger');
const blogger = bloggerModule.blogger;
const descriptionModule = require('../module/description');
const description = descriptionModule.description;

router.get('/login', (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  res.render('login', {
    blogger,
    title: '登入' + blogger.titleDash + blogger.author,
    description: description.login,
    path: blogger.domain + 'login',
    featuredImage: blogger.imageUrl,
    firebaseConfig
  });
});
router.post('/login', (req, res) => {
  const idToken = req.body.idToken.toString();
  const expiresIn = 60 * 60 * 24 * 14 * 1000;
  auth.createSessionCookie(idToken, { expiresIn })
    .then((sessionCookie) => {
      const options = { maxAge: expiresIn, httpOnly: true, secure: false };
      res.cookie('__session', sessionCookie, options);
      res.end();
      return null;
    })
    .catch(err => {
      console.log('建立 session cookie 失敗' + err);
    });
});
router.post('/logout', (req, res) => {
  res.clearCookie('__session');
  res.end();
});

module.exports = router;
