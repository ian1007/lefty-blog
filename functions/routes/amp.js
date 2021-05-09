'use strict';

const express = require('express');
const router = express.Router();

const firebaseAdmin = require('../connections/firebase_admin_connection');
const firestore = firebaseAdmin.firestore;
const categoriesRef = firestore.collection('categories');
const postsRef = firestore.collection('posts');

const moment = require('moment');
moment.locale('zh-tw');

const bloggerModule = require('../module/blogger');
const blogger = bloggerModule.blogger;

const algoliasearch = require('algoliasearch');
const client = algoliasearch(blogger.algoliaAppID, blogger.algoliaSearchAPIKey);
const index = client.initIndex(blogger.algoliaIndex);

router.get('/:categoryPath/:postPath', (req, res, next) => {
  res.set('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  const postPath = req.params.postPath;
  const categoryPath = req.params.categoryPath;
  const postRef = postsRef.where('status', '==', 'public').where('path', '==', postPath).get();
  const categoryRef = categoriesRef.where('path', '==', categoryPath).get();
  const getCategories = categoriesRef.orderBy('update_time', 'desc').get();
  Promise.all([postRef, categoryRef, getCategories])
    .then(snapshot => {
      if (!snapshot[0].empty && (!snapshot[1].empty || categoryPath === 'others')) {
        const post = snapshot[0].docs[0].data();
        // 將 html 轉成 html amp
        const ampImg = new RegExp('img loading="lazy"([^>]+)', 'g');
        const youtube = new RegExp('iframe src="https://www.youtube.com/embed/([^"]+)" style="position: absolute; width: 100%; height: 100%; top: 0; left: 0;" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen="" loading="lazy"></iframe', 'g');
        const placeholder = new RegExp('</amp-iframe>', 'g');
        const others = new RegExp('a href="/others/', 'g');
        post.content = post.content.replace(ampImg, 'amp-img lightbox layout="fill" class="contain"$1></amp-img') // img
          .replace(youtube, 'amp-youtube data-videoid="$1" layout="responsive" width="16" height="9"></amp-youtube') // youtube
          .replace(/iframe/g, 'amp-iframe') // iframe
          .replace(/amp-iframe style="/g, 'amp-iframe sandbox="allow-scripts allow-same-origin" layout="responsive" width="1" height="1" style="') // soundon
          .replace(placeholder, '<div placeholder></div></amp-iframe>')
          .replace(others, 'a href="/amp/others/'); // 主題「其他」的貼文
        const categories = snapshot[2].docs.map(doc => doc.data());
        // 所有主題
        categories.forEach(category => {
          const category_path = new RegExp(`a href="/${category.path}/`, 'g');
          post.content = post.content.replace(category_path, `a href="/amp/${category.path}/`);
        })
        let description = post.description;
        if (description === '') {
          description = post.descriptionDefault;
        }
        // 如果主題是「其他」，且貼文的分類也是「其他」
        if (categoryPath === 'others' && post.category === '其他') {
          const category = {
            name: '其他',
            thumbnail: blogger.othersThumbnail,
            path: 'others'
          }
          const prev = postsRef.where('category', '==', '其他').where('public_time', '<', post.public_time).where('status', '==', 'public').orderBy('public_time', 'desc').limit(1).get();
          const next = postsRef.where('category', '==', '其他').where('public_time', '>', post.public_time).where('status', '==', 'public').orderBy('public_time').limit(1).get();
          Promise.all([prev, next])
            .then(prevnext => {
              let postPrev = {};
              let postNext = {};
              if (!prevnext[0].empty) {
                postPrev.path = prevnext[0].docs[0].data().path;
                postPrev.title = prevnext[0].docs[0].data().title;
              }
              else {
                postPrev = '';
              }
              if (!prevnext[1].empty) {
                postNext.path = prevnext[1].docs[0].data().path;
                postNext.title = prevnext[1].docs[0].data().title;
              }
              else {
                postNext = '';
              }
              res.render('amp/post', {
                blogger,
                title: post.title + blogger.titleDash + blogger.author,
                description,
                path: blogger.domain + categoryPath + '/' + postPath,
                featuredImage: post.featuredImage,
                post,
                postPrev,
                postNext,
                category,
                categories,
                moment
              });
              return null;
            })
            .catch(err => {
              console.log('讀取前後貼文失敗', err);
            });
        }
        // 如果貼文的分類是該主題
        else if (post.category === snapshot[1].docs[0].data().id) {
          const category = {
            name: snapshot[1].docs[0].data().name,
            thumbnail: snapshot[1].docs[0].data().thumbnail,
            path: snapshot[1].docs[0].data().path
          }
          const prev = postsRef.where('category', '==', post.category).where('public_time', '<', post.public_time).where('status', '==', 'public').orderBy('public_time', 'desc').limit(1).get();
          const next = postsRef.where('category', '==', post.category).where('public_time', '>', post.public_time).where('status', '==', 'public').orderBy('public_time').limit(1).get();
          Promise.all([prev, next])
            .then(prevnext => {
              let postPrev = {};
              let postNext = {};
              if (!prevnext[0].empty) {
                postPrev.path = prevnext[0].docs[0].data().path;
                postPrev.title = prevnext[0].docs[0].data().title;
              }
              else {
                postPrev = '';
              }
              if (!prevnext[1].empty) {
                postNext.path = prevnext[1].docs[0].data().path;
                postNext.title = prevnext[1].docs[0].data().title;
              }
              else {
                postNext = '';
              }
              res.render('amp/post', {
                blogger,
                title: post.title + blogger.titleDash + blogger.author,
                description,
                path: blogger.domain + categoryPath + '/' + postPath,
                featuredImage: post.featuredImage,
                post,
                postPrev,
                postNext,
                category,
                categories,
                moment
              });
              return null;
            })
            .catch(err => {
              console.log('讀取前後貼文失敗', err);
            });
        }
        // 如果貼文對應不到主題
        else {
          return next();
        }
      }
      // 主題輸入錯誤，或貼文輸入錯誤
      else {
        return next();
      }
      return null;
    })
    .catch(err => {
      console.log('讀取貼文失敗', err);
    });
});
router.post('/search', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const searching = req.body.query;
  const searchIndex = index.search(searching);
  const getCategories = categoriesRef.get();
  Promise.all([searchIndex, getCategories])
    .then(snapshot => {
      let result_posts = [];
      for (let i in snapshot[0].hits) {
        if (snapshot[0].hits[i].status === 'public') {
          result_posts.push(snapshot[0].hits[i]);
        }
        if (i == 4) {
          break;
        }
      }
      let all_categories = [];
      if (Object.keys(result_posts).length === 0) {
        result_posts = '';
        all_categories = '';
      }
      else {
        all_categories = snapshot[1].docs.map(doc => doc.data());
      }
      res.json({ posts: result_posts, categories: all_categories });
      return null;
    })
    .catch(err => {
      console.log('搜尋失敗', err);
    });
});

module.exports = router;