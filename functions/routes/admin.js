'use strict';

// router 會被進入點 index.js 引用  
const express = require('express');
const router = express.Router();

// 驗證，以使用 firebase 產品
const firebaseAdmin = require('../connections/firebase_admin_connection');
const firestore = firebaseAdmin.firestore;
const bucket_post = firebaseAdmin.bucket_post;
const bucket_category = firebaseAdmin.bucket_category;
const categoriesRef = firestore.collection('categories');
const postsRef = firestore.collection('posts');
const tagsRef = firestore.collection('tags');

// 貼文圖片上傳
const Busboy = require('busboy');
const path = require('path');
const os = require('os');
const fs = require('fs');
// 貼文時間處理
const moment = require('moment');
moment.locale('zh-tw');

const bloggerModule = require('../module/blogger');
const blogger = bloggerModule.blogger;
const descriptionModule = require('../module/description');
const description = descriptionModule.description;

const algoliasearch = require('algoliasearch');
const client = algoliasearch(blogger.algoliaAppID, blogger.algoliaSearchAPIKey);
const index = client.initIndex(blogger.algoliaIndex);
const indexDraft = client.initIndex(blogger.algoliaIndexDraft);

const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

router.get('/', csrfProtection, (req, res, next) => {
  let currentPage = Number.parseInt(req.query.page) || 1;
  const getPublic = postsRef.where('status', '==', 'public').orderBy('public_time', 'desc').get();
  const getDraft = postsRef.where('status', '==', 'draft').orderBy('create_time', 'desc').get();
  const getCategories = categoriesRef.orderBy('update_time', 'desc').get();
  Promise.all([getPublic, getDraft, getCategories])
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
      const posts_draft = snapshot[1].docs.map(doc => doc.data());
      const categories = snapshot[2].docs.map(doc => doc.data());
      res.render('admin/admin_index', {
        blogger,
        title: blogger.author,
        description: description.index,
        path: blogger.domain,
        featuredImage: blogger.imageUrl,
        type: 'homepage',
        postsPublic: data,
        page,
        postsDraft: posts_draft,
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
  let currentPage = Number.parseInt(req.query.page) || 1;
  const searching = req.query.query;
  if (searching) {
    const searchIndex = index.search(searching);
    const searchIndexDraft = indexDraft.search(searching);
    const getCategories = categoriesRef.orderBy('update_time', 'desc').get();
    Promise.all([searchIndex, searchIndexDraft, getCategories])
      .then(snapshot => {
        let publicPosts = [];
        for (let i in snapshot[0].hits) {
          if (snapshot[0].hits[i].status === 'public') {
            publicPosts.push(snapshot[0].hits[i]);
          }
        }
        // 分頁
        const totalResult = publicPosts.length;
        const perpage = blogger.perpage;
        const pageTotal = Math.ceil(totalResult / perpage);
        if (totalResult != 0 && (currentPage > pageTotal || currentPage < 1)) {
          return next();
        }
        const minPost = (currentPage * perpage) - perpage + 1;
        const maxPost = (currentPage * perpage);
        let data = [];
        publicPosts.forEach((post, i) => {
          let postNum = i + 1;
          if (postNum >= minPost && postNum <= maxPost) {
            data.push(post);
          }
        })
        if (Object.keys(publicPosts).length === 0) {
          data = '';
        }
        const page = {
          pageTotal,
          currentPage
        }
        // 分頁結束
        let draftPosts = [];
        for (let i in snapshot[1].hits) {
          if (snapshot[1].hits[i].status === 'draft') {
            draftPosts.push(snapshot[1].hits[i]);
          }
        }
        if (Object.keys(draftPosts).length === 0) {
          draftPosts = '';
        }
        const categories = snapshot[2].docs.map(doc => doc.data());
        res.render('admin/admin_search', {
          blogger,
          title: searching + blogger.titleDash + blogger.author,
          description: '「' + searching + '」的搜尋結果',
          path: blogger.domain + 'search',
          featuredImage: blogger.imageUrl,
          searching: searching,
          postsPublic: data,
          page,
          postsDraft: draftPosts,
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
        res.render('admin/admin_search', {
          blogger,
          title: '搜尋' + blogger.titleDash + blogger.author,
          description: description.search,
          path: blogger.domain + 'search',
          featuredImage: blogger.imageUrl,
          postsPublic: '',
          postsDraft: '',
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
  res.render('admin/admin_aboutme', {
    blogger,
    title: '關於我' + blogger.titleDash + blogger.author,
    description: description.aboutme,
    path: blogger.domain + 'about-me',
    featuredImage: blogger.imageUrl,
    moment
  });
});
router.get('/donate', (req, res) => {
  res.render('admin/admin_donate', {
    blogger,
    title: '自由樂捐' + blogger.titleDash + blogger.author,
    description: description.donate,
    path: blogger.domain + 'donate',
    featuredImage: blogger.imageUrl,
    moment
  });
});
router.get('/categories', (req, res) => {
  categoriesRef.orderBy('update_time', 'desc').get()
    .then(snapshot => {
      const categories = snapshot.docs.map(doc => doc.data());
      res.render('admin/admin_categories', {
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
router.get('/categories/:categoryPath', csrfProtection, (req, res, next) => {
  let currentPage = Number.parseInt(req.query.page) || 1;
  const categoryPath = req.params.categoryPath;
  if (categoryPath === 'others') {
    const getPublic = postsRef.where('category', '==', '其他').where('status', '==', 'public').orderBy('public_time', 'desc').get();
    const getDraft = postsRef.where('category', '==', '其他').where('status', '==', 'draft').orderBy('create_time', 'desc').get();
    const getCategories = categoriesRef.orderBy('update_time', 'desc').get();
    Promise.all([getPublic, getDraft, getCategories])
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
        const posts_draft = snapshot[1].docs.map(doc => doc.data());
        const categories = snapshot[2].docs.map(doc => doc.data());
        res.render('admin/admin_index', {
          blogger,
          title: '其他' + blogger.titleDash + blogger.author,
          description: '沒有分類的貼文',
          path: blogger.domain + 'categories/others',
          featuredImage: blogger.imageUrl,
          type: 'category',
          category,
          postsPublic: data,
          page,
          postsDraft: posts_draft,
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
          const getDraft = postsRef.where('category', '==', snapshot.docs[0].data().id).where('status', '==', 'draft').orderBy('create_time', 'desc').get();
          const getCategories = categoriesRef.orderBy('update_time', 'desc').get();
          Promise.all([getPublic, getDraft, getCategories])
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
              const posts_draft = snapshotChild[1].docs.map(doc => doc.data());
              const categories = snapshotChild[2].docs.map(doc => doc.data());
              res.render('admin/admin_index', {
                blogger,
                title: category.name + blogger.titleDash + blogger.author,
                description: snapshot.docs[0].data().description,
                path: blogger.domain + 'categories/' + categoryPath,
                featuredImage: blogger.imageUrl,
                type: 'category',
                category,
                postsPublic: data,
                page,
                postsDraft: posts_draft,
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
  let currentPage = Number.parseInt(req.query.page) || 1;
  const tagPath = req.params.tagPath;
  const getPublic = postsRef.where('tagsArray', 'array-contains', tagPath).where('status', '==', 'public').orderBy('public_time', 'desc').get();
  const getDraft = postsRef.where('tagsArray', 'array-contains', tagPath).where('status', '==', 'draft').orderBy('create_time', 'desc').get();
  const getCategories = categoriesRef.orderBy('update_time', 'desc').get();
  Promise.all([getPublic, getDraft, getCategories])
    .then(snapshot => {
      if (snapshot[0].empty && snapshot[1].empty) {
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
        const posts_draft = snapshot[1].docs.map(doc => doc.data());
        const categories = snapshot[2].docs.map(doc => doc.data());
        res.render('admin/admin_index', {
          blogger,
          title: tagPath + blogger.titleDash + blogger.author,
          description: tagPath,
          path: blogger.domain + 'tags/' + tagPath,
          featuredImage: blogger.imageUrl,
          type: 'tag',
          tag: tagPath,
          postsPublic: data,
          page,
          postsDraft: posts_draft,
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
router.get('/category/create', (req, res) => {
  res.render('admin/admin_categoryEditor', {
    blogger,
    title: '新增主題' + blogger.titleDash + blogger.author,
    description: description.index,
    path: blogger.domain,
    featuredImage: blogger.imageUrl,
    category: {},
    moment
  });
});
router.get('/category/:categoryPath', (req, res, next) => {
  const categoryPath = req.params.categoryPath;
  categoriesRef.where('path', '==', categoryPath).get()
    .then(snapshot => {
      if (!snapshot.empty) {
        const category = snapshot.docs[0].data();
        res.render('admin/admin_categoryEditor', {
          blogger,
          title: '更新主題' + blogger.titleDash + blogger.author,
          description: description.index,
          path: blogger.domain,
          featuredImage: blogger.imageUrl,
          category,
          moment
        });
      }
      else {
        return next();
      }
      return null;
    })
    .catch(err => {
      console.log('讀取更新主題失敗', err);
    });
});
router.get('/post/create', (req, res) => {
  // 尋找是否有正在編輯中，還未儲存的貼文
  const postRef = postsRef.where('status', '==', 'creating').get();
  const categoryRef = categoriesRef.orderBy('update_time', 'desc').get();
  Promise.all([postRef, categoryRef])
    .then(snapshot => {
      let post = {};
      if (!snapshot[0].empty) {
        post = snapshot[0].docs[0].data();
      }
      // 如果沒有，則新建一個
      else {
        const postCreate = postsRef.doc();
        const data = {
          objectID: postCreate.id,
          status: 'creating'
        };
        post = data;
        postCreate.set(data);
      }
      const categories = snapshot[1].docs.map(doc => doc.data());
      res.render('admin/admin_postEditor', {
        blogger,
        title: '新增貼文' + blogger.titleDash + blogger.author,
        description: description.index,
        path: blogger.domain,
        featuredImage: blogger.imageUrl,
        post,
        categories,
        moment
      });
      return null;
    })
    .catch(err => {
      console.log('讀取新增貼文失敗', err);
    });
});
router.get('/post/:postPath', (req, res, next) => {
  const postPath = req.params.postPath;
  const postRef = postsRef.where('path', '==', postPath).get();
  const categoryRef = categoriesRef.orderBy('update_time', 'desc').get();
  Promise.all([postRef, categoryRef])
    .then(snapshot => {
      if (!snapshot[0].empty) {
        const post = snapshot[0].docs[0].data();
        const categories = snapshot[1].docs.map(doc => doc.data());
        res.render('admin/admin_postEditor', {
          blogger,
          title: '更新貼文' + blogger.titleDash + blogger.author,
          description: description.index,
          path: blogger.domain,
          featuredImage: blogger.imageUrl,
          post,
          categories,
          moment
        });
      }
      else {
        return next();
      }
      return null;
    })
    .catch(err => {
      console.log('讀取更新貼文失敗', err);
    });
});
router.get('/typeahead/tags', (req, res) => {
  tagsRef.where('times', '>=', 1).orderBy('times', 'desc').get()
    .then(snapshot => {
      if (snapshot.empty) {
        res.json();
      }
      else {
        const tags = snapshot.docs.map(doc => doc.data().content);
        res.json(tags);
      }
      return null;
    })
    .catch(err => {
      console.log('讀取提示標籤失敗', err);
    })
});
router.get('/:categoryPath/:postPath', csrfProtection, (req, res, next) => {
  const postPath = req.params.postPath;
  const categoryPath = req.params.categoryPath;
  const postRef = postsRef.where('path', '==', postPath).get();
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
          if (post.status === 'public') {
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
                res.render('admin/admin_post', {
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
                  moment,
                  csrfToken: req.csrfToken()
                });
                return null;
              })
              .catch(err => {
                console.log('讀取前後貼文失敗', err);
              });
          }
          else {
            res.render('admin/admin_post', {
              blogger,
              title: post.title + blogger.titleDash + blogger.author,
              description,
              path: blogger.domain + categoryPath + '/' + postPath,
              featuredImage: post.featuredImage,
              post,
              postPrev: '',
              postNext: '',
              category,
              categories,
              moment,
              csrfToken: req.csrfToken()
            });
          }
        }
        // 如果貼文的分類是該主題
        else if (post.category === snapshot[1].docs[0].data().id) {
          const category = {
            name: snapshot[1].docs[0].data().name,
            thumbnail: snapshot[1].docs[0].data().thumbnail,
            path: snapshot[1].docs[0].data().path
          }
          if (post.status === 'public') {
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
                res.render('admin/admin_post', {
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
                  moment,
                  csrfToken: req.csrfToken()
                });
                return null;
              })
              .catch(err => {
                console.log('讀取前後貼文失敗', err);
              });
          }
          else {
            res.render('admin/admin_post', {
              blogger,
              title: post.title + blogger.titleDash + blogger.author,
              description,
              path: blogger.domain + categoryPath + '/' + postPath,
              featuredImage: post.featuredImage,
              post,
              postPrev: '',
              postNext: '',
              category,
              categories,
              moment,
              csrfToken: req.csrfToken()
            });
          }
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
router.post('/post/overlapping', (req, res) => {
  const id = req.body.id;
  // 查找有無重複的網址
  postsRef.where('path', '==', req.body.path).get()
    .then(snapshot => {
      // 如果已有重複的網址，且不是正在編輯的貼文
      if (!snapshot.empty && (snapshot.docs.length >= 2 || (snapshot.docs[0].data().objectID !== id))) {
        res.send('已有重複的網址');
      }
      else {
        res.send('沒有重複');
      }
      return null;
    })
    .catch(err => {
      console.log('讀取重複的網址失敗', err);
    });
});
router.post('/post/autosave/:postId', (req, res) => {
  const postId = req.params.postId;
  const data = req.body;
  postsRef.doc(postId).update(data);
  res.end();
});
router.post('/post/create', (req, res) => {
  const postRef = postsRef.where('status', '==', 'creating').get();
  const categoryRef = categoriesRef.where('id', '==', req.body.category).get();
  Promise.all([postRef, categoryRef])
    .then(snapshot => {
      // 儲存貼文
      const data = req.body;
      let tagsArray = '';
      if (data.tags !== '') {
        tagsArray = data.tags.split(',');
      }
      data.tagsArray = tagsArray;
      data.create_time = Math.floor(Date.now() / 1000);
      data.update_time = '';
      if (req.body.status === 'public') {
        data.public_time = data.create_time;
      }
      else {
        data.public_time = '';
      }
      let categoryPath = '';
      if (snapshot[1].empty) {
        categoryPath = 'others';
      } else {
        categoryPath = snapshot[1].docs[0].data().path;
      }
      snapshot[0].docs[0].ref.update(data)
        .then(() => {
          res.redirect(`/admin/${categoryPath}/${req.body.path}`);
          return null;
        })
        .catch(err => {
          console.log('新增貼文失敗', err);
        });
      // 更新主題時間
      if (req.body.status === 'public' && !snapshot[1].empty) {
        snapshot[1].docs[0].ref.update({
          update_time: Math.floor(Date.now() / 1000)
        });
      }
      return null;
    })
    .catch(err => {
      console.log('新增貼文失敗', err);
    });
  // 增加 tags times
  if (req.body.tags !== '') {
    const tags = req.body.tags.split(','); // "tag1,tag2,tag3" ➡️ ["tag1","tag2","tag3"]
    for (let i = 0; i < tags.length; i++) {
      tagsRef.where('content', '==', tags[i]).get()
        .then(snapshot => {
          if (snapshot.empty) {
            const tagRef = tagsRef.doc();
            const data = {
              id: tagRef.id,
              content: tags[i],
              times: 1
            }
            tagRef.set(data);
          }
          else {
            const data = snapshot.docs[0].data();
            data.times += 1;
            snapshot.docs[0].ref.update(data);
          }
          return null;
        })
        .catch(err => {
          console.log('更新標籤失敗', err);
        });
    }
  }
});
router.post('/post/update/:postId', (req, res) => {
  const postId = req.params.postId;
  const postRef = postsRef.where('objectID', '==', postId).get();
  const categoryRef = categoriesRef.where('id', '==', req.body.category).get();
  Promise.all([postRef, categoryRef])
    .then(snapshot => {
      // 更新貼文
      const data = req.body;
      let tagsArray = '';
      if (data.tags !== '') {
        tagsArray = data.tags.split(',');
      }
      data.tagsArray = tagsArray;
      if (req.body.status === 'public' && snapshot[0].docs[0].data().public_time === '') {
        data.public_time = Math.floor(Date.now() / 1000);
      }
      if (snapshot[0].docs[0].data().public_time != '') {
        data.update_time = Math.floor(Date.now() / 1000);
      }
      let categoryPath = '';
      if (snapshot[1].empty) {
        categoryPath = 'others';
      } else {
        categoryPath = snapshot[1].docs[0].data().path;
      }
      snapshot[0].docs[0].ref.update(data)
        .then(() => {
          res.redirect(`/admin/${categoryPath}/${req.body.path}`);
          return null;
        })
        .catch(err => {
          console.log('更新貼文失敗', err);
        });
      // 更新主題時間
      if (req.body.status === 'public' && !snapshot[1].empty) {
        snapshot[1].docs[0].ref.update({
          update_time: Math.floor(Date.now() / 1000)
        });
      }
      // 增加或不加 tags times
      let preTags = '';
      if (snapshot[0].docs[0].data().tags !== '') {
        preTags = snapshot[0].docs[0].data().tags.split(','); // 紀錄之前的 tags，以便檢查哪些少了，少了的話要將 times 減 1
      }
      if (req.body.tags !== '') {
        const tags = req.body.tags.split(',');
        for (let i = 0; i < tags.length; i++) {
          tagsRef.where('content', '==', tags[i]).get()
            .then(snapshotTag => {
              if (snapshotTag.empty) {
                // 如果從未有過，則設為 1
                const tagRef = tagsRef.doc();
                const tagData = {
                  id: tagRef.id,
                  content: tags[i],
                  times: 1
                }
                tagRef.set(tagData);
              }
              else {
                // 如果原本就有，則不加，沒有，則增加
                let exist = false;
                for (let j = 0; j < preTags.length; j++) {
                  if (preTags[j] === tags[i]) {
                    exist = true;
                    break;
                  }
                }
                if (!exist) {
                  const tagData = snapshotTag.docs[0].data();
                  tagData.times += 1;
                  snapshotTag.docs[0].ref.update(tagData);
                }
              }
              return null;
            })
            .catch(err => {
              console.log('標籤增加失敗', err);
            });
        }
      }
      // 減少 tags times
      if (req.body.tags === '' && preTags !== '') {
        for (let i = 0; i < preTags.length; i++) {
          tagsRef.where('content', '==', preTags[i]).get()
            .then(snapshotTag => {
              const tagData = snapshotTag.docs[0].data();
              tagData.times -= 1;
              if (tagData.times === 0) {
                snapshotTag.docs[0].ref.delete();
              }
              else {
                snapshotTag.docs[0].ref.update(tagData);
              }
              return null;
            })
            .catch(err => {
              console.log('標籤減少失敗', err);
            });
        }
      }
      else if (req.body.tags !== '' && preTags !== '') {
        const tags = req.body.tags.split(',');
        for (let i = 0; i < preTags.length; i++) {
          let exist = false;
          for (let j = 0; j < tags.length; j++) {
            if (preTags[i] === tags[j]) {
              exist = true;
              break;
            }
          }
          if (!exist) {
            tagsRef.where('content', '==', preTags[i]).get()
              .then(snapshotTag => {
                const tagData = snapshotTag.docs[0].data();
                tagData.times -= 1;
                if (tagData.times === 0) {
                  snapshotTag.docs[0].ref.delete();
                }
                else {
                  snapshotTag.docs[0].ref.update(tagData);
                }
                return null;
              })
              .catch(err => {
                console.log('標籤刪除失敗', err);
              });
          }
        }
      }
      return null;
    })
    .catch(err => {
      console.log('更新貼文失敗', err);
    });
});
router.post('/post/delete/:postId', (req, res) => {
  const postId = req.params.postId;
  postsRef.where('objectID', '==', postId).get()
    .then(snapshot => {
      // 刪除貼文
      snapshot.docs[0].ref.delete()
        .then(() => {
          res.end();
          return null;
        })
        .catch(err => {
          console.log('刪除貼文失敗', err);
        });
      // 減少 tags times
      if (snapshot.docs[0].data().tags !== '') {
        const tags = snapshot.docs[0].data().tags.split(',');
        for (let i = 0; i < tags.length; i++) {
          tagsRef.where('content', '==', tags[i]).get()
            .then(snapshotTag => {
              const tagData = snapshotTag.docs[0].data();
              tagData.times -= 1;
              if (tagData.times === 0) {
                snapshotTag.docs[0].ref.delete();
              }
              else {
                snapshotTag.docs[0].ref.update(tagData);
              }
              return null;
            })
            .catch(err => {
              console.log('標籤減少失敗', err);
            });
        }
      }
      return null;
    })
    .catch(err => {
      console.log('刪除貼文失敗', err);
    });
  // 刪除圖片
  bucket_post.deleteFiles({
    prefix: `${postId}/`,
    force: true
  }, (err) => {
    if (err) {
      console.log('刪除圖片失敗', err);
    }
  });
});
router.post('/category/overlapping', (req, res) => {
  const id = req.body.id;
  // 查找有無重複的網址
  categoriesRef.where('path', '==', req.body.path).get()
    .then(snapshot => {
      // 如果已有重複的網址，且不是正在編輯的主題
      if (!snapshot.empty && (snapshot.docs[0].data().id !== id)) {
        res.send('已有重複的網址');
      }
      else {
        res.send('沒有重複');
      }
      return null;
    })
    .catch(err => {
      console.log('讀取重複的網址失敗', err);
    });
});
router.post('/category/create', (req, res) => {
  const categoryRef = categoriesRef.doc();
  const data = req.body;
  data.id = categoryRef.id;
  data.create_time = Math.floor(Date.now() / 1000);
  data.update_time = data.create_time;
  if (req.body.thumbnail) {
    // 上傳縮圖
    const base64EncodedImageString = req.body.thumbnail.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64EncodedImageString, 'base64');
    const file = bucket_category.file(`${categoryRef.id}`);
    file.save(imageBuffer, {
      resumable: false,
      gzip: true,
      metadata: {
        contentType: 'image/png',
      }
    }, (error) => {
      if (!error) {
        data.thumbnail = `${blogger.storageUrl_category}/${categoryRef.id}`;
        categoryRef.set(data)
          .then(() => {
            res.redirect('/admin/categories');
            return null;
          })
          .catch(err => {
            console.log('新增主題失敗', err);
          });
      }
      else {
        console.log('上傳縮圖失敗', error);
      }
    });
  }
  else {
    categoryRef.set(data)
      .then(() => {
        res.redirect('/admin/categories');
        return null;
      })
      .catch(err => {
        console.log('新增主題失敗', err);
      });
  }
});
router.post('/category/update/:categoryId', (req, res) => {
  const categoryId = req.params.categoryId;
  const categoryRef = categoriesRef.doc(categoryId);
  const data = req.body;
  data.update_time = Math.floor(Date.now() / 1000);
  if (req.body.thumbnail) {
    // 上傳縮圖
    const base64EncodedImageString = req.body.thumbnail.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64EncodedImageString, 'base64');
    const file = bucket_category.file(`${categoryRef.id}`);
    file.save(imageBuffer, {
      resumable: false,
      gzip: true,
      metadata: {
        contentType: 'image/png',
      }
    }, (error) => {
      if (!error) {
        data.thumbnail = `${blogger.storageUrl_category}/${categoryRef.id}`;
        categoryRef.update(data)
          .then(() => {
            res.redirect('/admin/categories');
            return null;
          })
          .catch(err => {
            console.log('更新主題失敗', err);
          });
      }
      else {
        console.log('上傳縮圖失敗', error);
      }
    });
  }
  else {
    categoryRef.update(data)
      .then(() => {
        res.redirect('/admin/categories');
        return null;
      })
      .catch(err => {
        console.log('更新主題失敗', err);
      });
  }
})
router.post('/category/delete/:categoryId', (req, res) => {
  const categoryId = req.params.categoryId;
  // 將主題內貼文分配到「其他」
  postsRef.where('category', '==', categoryId).get()
    .then(snapshot => {
      snapshot.forEach(snapshotChild => {
        snapshotChild.ref.update({
          category: '其他'
        });
      });
      return null;
    })
    .catch(err => {
      console.log('重新分配主題失敗', err);
    });
  // 刪除主題
  categoriesRef.doc(categoryId).delete()
    .then(() => {
      res.end();
      return null;
    })
    .catch(err => {
      console.log('刪除主題失敗', err);
    });
  // 刪除縮圖
  const file = bucket_category.file(`${categoryId}`);
  file.exists((err, exists) => {
    if (exists) {
      file.delete();
    }
    if (err) {
      console.log('縮圖存取失敗', err);
    }
  });
});
router.post('/uploads/:postId', (req, res) => {
  const postId = req.params.postId;
  const busboy = new Busboy({ headers: req.headers });
  const filePath = {};
  const fileName = {};
  const fileType = {};
  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
    const uploadTime = `${Math.floor(Date.now())}`;
    const filepath = path.join(os.tmpdir(), uploadTime);
    filePath[uploadTime] = filepath;
    fileName[uploadTime] = uploadTime;
    fileType[uploadTime] = mimetype;
    file.pipe(fs.createWriteStream(filepath));
  });
  busboy.on('finish', () => {
    for (const uploadTime in filePath) {
      const filepath = filePath[uploadTime];
      const filename = fileName[uploadTime];
      const options = {
        destination: `${postId}/${filename}`,
        resumable: false,
        metadata: {
          contentType: fileType[uploadTime],
        },
      };
      bucket_post.upload(filepath, options, (err, file) => {
        if (!err) {
          setTimeout(() => {
            res.status(200).json({
              'urls': {
                'default': `${blogger.storageUrl_post}/${postId}%2F${filename}_640x640`,
                '640': `${blogger.storageUrl_post}/${postId}%2F${filename}_640x640`,
                '960': `${blogger.storageUrl_post}/${postId}%2F${filename}_960x960`,
                '1280': `${blogger.storageUrl_post}/${postId}%2F${filename}_1280x1280`
              }
            });
            fs.unlinkSync(filePath[uploadTime]);
          }, 9000);
        }
        else {
          res.status(500).json({ 'error': { 'message': '圖片上傳失敗' } })
        }
      });
    }
  });
  busboy.end(req.rawBody);
});

module.exports = router;