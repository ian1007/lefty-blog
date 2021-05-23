'use strict';

const express = require('express');
const router = express.Router();

const firebaseAdmin = require('../connections/firebase_admin_connection');
const firestore = firebaseAdmin.firestore;
const categoriesRef = firestore.collection('categories');
const postsRef = firestore.collection('posts');
const tagsRef = firestore.collection('tags');

const moment = require('moment');
moment.locale('zh-tw');

const bloggerModule = require('../module/blogger');
const blogger = bloggerModule.blogger;
const descriptionModule = require('../module/description');
const description = descriptionModule.description;

const algoliasearch = require('algoliasearch');
const client = algoliasearch(blogger.algoliaAppID, blogger.algoliaSearchAPIKey);
const index = client.initIndex(blogger.algoliaIndex);

const nodemailer = require('nodemailer');
const functions = require('firebase-functions');
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

const { SitemapStream, streamToPromise } = require('sitemap');
const { createGzip } = require('zlib');
const { Readable } = require('stream');

router.get('/', csrfProtection, (req, res, next) => {
  res.set('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  let currentPage = Number.parseInt(req.query.page) || 1;
  const getPublic = postsRef.where('status', '==', 'public').orderBy('public_time', 'desc').get();
  const getCategories = categoriesRef.orderBy('update_time', 'desc').get();
  Promise.all([getPublic, getCategories])
    .then(snapshot => {
      const posts_public = snapshot[0].docs.map(doc => doc.data());
      // 分頁
      const totalResult = posts_public.length;
      const perpage = blogger.perpage;
      const pageTotal = Math.ceil(totalResult / perpage);
      if (totalResult != 0 && (currentPage > pageTotal || currentPage < 1)) {
        return next();
      }
      const minPost = (currentPage * perpage) - perpage + 1;
      const maxPost = (currentPage * perpage);
      const data = [];
      posts_public.forEach((post, i) => {
        let postNum = i + 1;
        if (postNum >= minPost && postNum <= maxPost) {
          data.push(post);
        }
      })
      const page = {
        pageTotal,
        currentPage
      }
      // 分頁結束
      const categories = snapshot[1].docs.map(doc => doc.data());
      res.render('index', {
        blogger,
        title: blogger.author,
        description: description.index,
        path: blogger.domain,
        featuredImage: blogger.imageUrl,
        type: 'homepage',
        postsPublic: data,
        page,
        categories,
        moment,
        csrfToken: req.csrfToken()
      })
      return null;
    })
    .catch(err => {
      console.log('首頁讀取失敗', err);
    });
});
router.get('/search', csrfProtection, (req, res, next) => {
  res.set('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  let currentPage = Number.parseInt(req.query.page) || 1;
  const searching = req.query.query;
  if (searching) {
    const searchIndex = index.search(searching);
    const getCategories = categoriesRef.orderBy('update_time', 'desc').get();
    Promise.all([searchIndex, getCategories])
      .then(snapshot => {
        let posts = [];
        for (let i in snapshot[0].hits) {
          if (snapshot[0].hits[i].status === 'public') {
            posts.push(snapshot[0].hits[i]);
          }
        }
        // 分頁
        const totalResult = posts.length;
        const perpage = blogger.perpage;
        const pageTotal = Math.ceil(totalResult / perpage);
        if (totalResult != 0 && (currentPage > pageTotal || currentPage < 1)) {
          return next();
        }
        const minPost = (currentPage * perpage) - perpage + 1;
        const maxPost = (currentPage * perpage);
        let data = [];
        posts.forEach((post, i) => {
          let postNum = i + 1;
          if (postNum >= minPost && postNum <= maxPost) {
            data.push(post);
          }
        })
        if (Object.keys(posts).length === 0) {
          data = '';
        }
        const page = {
          pageTotal,
          currentPage
        }
        // 分頁結束
        const categories = snapshot[1].docs.map(doc => doc.data());
        res.render('search', {
          blogger,
          title: searching + blogger.titleDash + blogger.author,
          description: '「' + searching + '」的搜尋結果',
          path: blogger.domain + 'search',
          featuredImage: blogger.imageUrl,
          searching: searching,
          postsPublic: data,
          page,
          categories,
          moment,
          csrfToken: req.csrfToken()
        })
        return null;
      })
      .catch(err => {
        console.log('搜尋失敗', err);
      });
  } else { // 從網址亂輸入的話
    categoriesRef.orderBy('update_time', 'desc').get()
      .then(snapshot => {
        const categories = snapshot.docs.map(doc => doc.data());
        res.render('search', {
          blogger,
          title: '搜尋' + blogger.titleDash + blogger.author,
          description: description.search,
          path: blogger.domain + 'search',
          featuredImage: blogger.imageUrl,
          postsPublic: '',
          categories,
          moment,
          csrfToken: req.csrfToken()
        })
        return null;
      })
      .catch(err => {
        console.log('搜尋頁讀取失敗', err);
      });
  }
});
router.get('/about-me', (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  res.render('aboutme', {
    blogger,
    title: '黃彥瑜' + blogger.titleDash + blogger.author,
    description: description.aboutme,
    path: blogger.domain + 'about-me',
    featuredImage: blogger.imageUrl,
    moment
  });
});
router.get('/service', csrfProtection, (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  res.render('service', {
    blogger,
    title: '左撇子網路科技' + blogger.titleDash + blogger.author,
    description: description.service,
    path: blogger.domain + 'service',
    featuredImage: blogger.imageUrl,
    moment,
    csrfToken: req.csrfToken()
  });
});
router.get('/donate', (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  res.render('donate', {
    blogger,
    title: '自由樂捐' + blogger.titleDash + blogger.author,
    description: description.donate,
    path: blogger.domain + 'donate',
    featuredImage: blogger.imageUrl,
    moment
  });
});
router.get('/categories', (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  categoriesRef.orderBy('update_time', 'desc').get()
    .then(snapshot => {
      const categories = snapshot.docs.map(doc => doc.data());
      res.render('categories', {
        blogger,
        title: '所有主題' + blogger.titleDash + blogger.author,
        description: description.categories,
        path: blogger.domain + 'categories',
        featuredImage: blogger.imageUrl,
        categories,
        moment
      });
      return null;
    })
    .catch(err => {
      console.log('主題頁讀取失敗', err);
    });
});
let sitemap;
router.get('/sitemap.xml', (req, res) => {
  res.header('Content-Type', 'application/xml');
  res.header('Content-Encoding', 'gzip');
  if (sitemap) {
    res.send(sitemap);
    return;
  }
  try {
    const getCategories = categoriesRef.orderBy('update_time', 'desc').get();
    const getTags = tagsRef.get();
    const getPublic = postsRef.where('status', '==', 'public').orderBy('public_time', 'desc').get();
    Promise.all([getCategories, getTags, getPublic])
      .then(snapshot => {
        const smStream = new SitemapStream({
          hostname: `${blogger.domain}`,
          lastmodDateOnly: true,
          xmlns: {
            news: false,
            xhtml: false,
            image: false,
            video: false
          }
        });
        const pipeline = smStream.pipe(createGzip());
        let currentTime = moment().format();

        // pipe your entries or directly write them.
        smStream.write({ url: '/', lastmod: currentTime });
        smStream.write({ url: '/about-me', lastmod: currentTime });
        smStream.write({ url: '/service', lastmod: currentTime });
        smStream.write({ url: '/categories', lastmod: currentTime });
        smStream.write({ url: '/donate', lastmod: currentTime });

        snapshot[0].forEach(snapshotChild => {
          smStream.write({ url: `/categories/${snapshotChild.data().path}`, lastmod: currentTime });
        });
        smStream.write({ url: '/categories/others', lastmod: currentTime });

        snapshot[1].forEach(snapshotChild => {
          smStream.write({ url: `/tags/${snapshotChild.data().content}`, lastmod: currentTime });
        });

        snapshot[2].forEach(snapshotChild => {
          let categoryPath = 'others';
          snapshot[0].forEach(categories => {
            if (snapshotChild.data().category === categories.id) {
              categoryPath = categories.data().path;
            }
          });
          let updateTime = moment(snapshotChild.data().public_time * 1000).format();
          if (snapshotChild.data().update_time !== '') {
            updateTime = moment(snapshotChild.data().update_time * 1000).format();
          }
          smStream.write({ url: `/${categoryPath}/${snapshotChild.data().path}`, lastmod: updateTime });
          smStream.write({ url: `/amp/${categoryPath}/${snapshotChild.data().path}`, lastmod: updateTime });
        });

        // cache the response
        streamToPromise(pipeline).then(sm => sitemap = sm)
          .catch(e => {
            console.error(e);
          })
        // make sure to attach a write stream such as streamToPromise before ending
        smStream.end();
        // stream write the response
        pipeline.pipe(res).on('error', (e) => { throw e });
        return null;
      })
      .catch(err => {
        console.log('sitemap 製作失敗', err);
      });
  } catch (e) {
    console.error(e);
    res.status(500).end();
  }
});
router.get('/privacy-policy', (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  res.render('privacy', {
    blogger,
    title: '隱私權政策' + blogger.titleDash + blogger.author,
    description: description.privacy,
    path: blogger.domain + 'privacy-policy',
    featuredImage: blogger.imageUrl,
    moment
  });
});
router.get('/categories/:categoryPath', csrfProtection, (req, res, next) => {
  res.set('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  let currentPage = Number.parseInt(req.query.page) || 1;
  const categoryPath = req.params.categoryPath;
  if (categoryPath === 'others') {
    const getPublic = postsRef.where('category', '==', '其他').where('status', '==', 'public').orderBy('public_time', 'desc').get();
    const getCategories = categoriesRef.orderBy('update_time', 'desc').get();
    Promise.all([getPublic, getCategories])
      .then(snapshot => {
        const category = {
          name: '其他',
          thumbnail: blogger.othersThumbnail,
          path: 'others'
        }
        const posts_public = snapshot[0].docs.map(doc => doc.data());
        // 分頁
        const totalResult = posts_public.length;
        const perpage = blogger.perpage;
        const pageTotal = Math.ceil(totalResult / perpage);
        if (totalResult != 0 && (currentPage > pageTotal || currentPage < 1)) {
          return next();
        }
        const minPost = (currentPage * perpage) - perpage + 1;
        const maxPost = (currentPage * perpage);
        const data = [];
        posts_public.forEach((post, i) => {
          let postNum = i + 1;
          if (postNum >= minPost && postNum <= maxPost) {
            data.push(post);
          }
        })
        const page = {
          pageTotal,
          currentPage
        }
        // 分頁結束
        const categories = snapshot[1].docs.map(doc => doc.data());
        res.render('index', {
          blogger,
          title: '其他' + blogger.titleDash + blogger.author,
          description: '沒有分類的貼文',
          path: blogger.domain + 'categories/others',
          featuredImage: blogger.imageUrl,
          type: 'category',
          category,
          postsPublic: data,
          page,
          categories,
          moment,
          csrfToken: req.csrfToken()
        })
        return null;
      })
      .catch(err => {
        console.log('讀取其他失敗', err);
      });
  }
  else {
    categoriesRef.where('path', '==', categoryPath).get()
      .then(snapshot => {
        if (snapshot.empty) {
          return next();
        }
        else {
          const category = {
            name: snapshot.docs[0].data().name,
            thumbnail: snapshot.docs[0].data().thumbnail,
            path: snapshot.docs[0].data().path
          }
          const getPublic = postsRef.where('category', '==', snapshot.docs[0].data().id).where('status', '==', 'public').orderBy('public_time', 'desc').get();
          const getCategories = categoriesRef.orderBy('update_time', 'desc').get();
          Promise.all([getPublic, getCategories])
            .then(snapshotChild => {
              const posts_public = snapshotChild[0].docs.map(doc => doc.data());
              // 分頁
              const totalResult = posts_public.length;
              const perpage = blogger.perpage;
              const pageTotal = Math.ceil(totalResult / perpage);
              if (totalResult != 0 && (currentPage > pageTotal || currentPage < 1)) {
                return next();
              }
              const minPost = (currentPage * perpage) - perpage + 1;
              const maxPost = (currentPage * perpage);
              const data = [];
              posts_public.forEach((post, i) => {
                let postNum = i + 1;
                if (postNum >= minPost && postNum <= maxPost) {
                  data.push(post);
                }
              })
              const page = {
                pageTotal,
                currentPage
              }
              // 分頁結束
              const categories = snapshotChild[1].docs.map(doc => doc.data());
              res.render('index', {
                blogger,
                title: category.name + blogger.titleDash + blogger.author,
                description: snapshot.docs[0].data().description,
                path: blogger.domain + 'categories/' + categoryPath,
                featuredImage: blogger.imageUrl,
                type: 'category',
                category,
                postsPublic: data,
                page,
                categories,
                moment,
                csrfToken: req.csrfToken()
              })
              return null;
            })
            .catch(err => {
              console.log('讀取主題失敗', err);
            });
        }
        return null;
      })
      .catch(err => {
        console.log('讀取主題失敗', err);
      });
  }
});
router.get('/tags/:tagPath', csrfProtection, (req, res, next) => {
  res.set('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  let currentPage = Number.parseInt(req.query.page) || 1;
  const tagPath = req.params.tagPath;
  const getPublic = postsRef.where('tagsArray', 'array-contains', tagPath).where('status', '==', 'public').orderBy('public_time', 'desc').get();
  const getCategories = categoriesRef.orderBy('update_time', 'desc').get();
  Promise.all([getPublic, getCategories])
    .then(snapshot => {
      if (snapshot[0].empty) {
        return next();
      }
      else {
        const posts_public = snapshot[0].docs.map(doc => doc.data());
        // 分頁
        const totalResult = posts_public.length;
        const perpage = blogger.perpage;
        const pageTotal = Math.ceil(totalResult / perpage);
        if (totalResult != 0 && (currentPage > pageTotal || currentPage < 1)) {
          return next();
        }
        const minPost = (currentPage * perpage) - perpage + 1;
        const maxPost = (currentPage * perpage);
        const data = [];
        posts_public.forEach((post, i) => {
          let postNum = i + 1;
          if (postNum >= minPost && postNum <= maxPost) {
            data.push(post);
          }
        })
        const page = {
          pageTotal,
          currentPage
        }
        // 分頁結束
        const categories = snapshot[1].docs.map(doc => doc.data());
        res.render('index', {
          blogger,
          title: tagPath + blogger.titleDash + blogger.author,
          description: tagPath,
          path: blogger.domain + 'tags/' + tagPath,
          featuredImage: blogger.imageUrl,
          type: 'tag',
          tag: tagPath,
          postsPublic: data,
          page,
          categories,
          moment,
          csrfToken: req.csrfToken()
        })
      }
      return null;
    })
    .catch(err => {
      console.log('讀取標籤失敗', err);
    });
});
router.get('/:categoryPath/:postPath', csrfProtection, (req, res, next) => {
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
        const categories = snapshot[2].docs.map(doc => doc.data());
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
              res.render('post', {
                blogger,
                title: post.title + blogger.titleDash + blogger.author,
                description,
                path: blogger.domain + categoryPath + '/' + postPath,
                ampPath: blogger.domain + 'amp/' + categoryPath + '/' + postPath,
                featuredImage: post.featuredImage,
                post,
                postPrev,
                postNext,
                category,
                categories,
                moment,
                csrfToken: req.csrfToken()
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
              res.render('post', {
                blogger,
                title: post.title + blogger.titleDash + blogger.author,
                description,
                path: blogger.domain + categoryPath + '/' + postPath,
                ampPath: blogger.domain + 'amp/' + categoryPath + '/' + postPath,
                featuredImage: post.featuredImage,
                post,
                postPrev,
                postNext,
                category,
                categories,
                moment,
                csrfToken: req.csrfToken()
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
      // 主題輸入錯誤，或貼文輸入錯誤，則導向至 404
      else {
        return next();
      }
      return null;
    })
    .catch(err => {
      console.log('讀取貼文失敗', err);
    });
});
router.post('/subscribe', csrfProtection, (req, res) => {
  nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: functions.config().nodemailer.user,
      pass: functions.config().nodemailer.pass,
    },
  }).sendMail({
    from: '"左撇子のGen" <lefthanded.gen@gmail.com>',
    to: 'raisondetrehyy@gmail.com',
    subject: '有新的訂閱者 - 左撇子のGen',
    html: `名字：${req.body.subscriber}<br>信箱：${req.body.email}`,
  }).then(() => {
    res.end();
    return null;
  }).catch(err => {
    console.log('電子報傳送失敗', err);
  });
});
router.post('/contact', csrfProtection, (req, res) => {
  nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: functions.config().nodemailer.user,
      pass: functions.config().nodemailer.pass,
    },
  }).sendMail({
    from: '"左撇子のGen" <lefthanded.gen@gmail.com>',
    to: 'raisondetrehyy@gmail.com',
    subject: '新的訊息 - 左撇子のGen',
    html: `名字：${req.body.name}<br>信箱：${req.body.email}<br>需求：${req.body.description}`,
  }).then(() => {
    res.end();
    return null;
  }).catch(err => {
    console.log('電子報傳送失敗', err);
  });
});

module.exports = router;