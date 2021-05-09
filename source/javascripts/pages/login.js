'use strict';

$(function () {
  if (document.body.contains(document.querySelector('#login'))) {
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    $('button').on('click', function () {
      const provider = new firebase.auth.GoogleAuthProvider();
      firebase.auth().signInWithRedirect(provider);
    });
    function postIdTokenToSessionLogin(url, idToken) {
      return $.ajax({
        url: url,
        method: 'POST',
        data: {
          idToken: idToken
        },
        contentType: 'application/x-www-form-urlencoded'
      }).done(function () {
        window.location.href = '/admin';
      });
    };
    firebase.auth().getRedirectResult()
      .then(function (result) {
        if (result.credential) {
          const isNewUser = result.additionalUserInfo.isNewUser;
          if (isNewUser) {
            result.user.delete();
            return null;
          } else {
            return result.user.getIdToken().then(function (idToken) {
              return postIdTokenToSessionLogin('/auth/login', idToken);
            });
          }
        }
      })
      .catch(function (error) {
        console.log('重新導向失敗' + error.message);
      });
  }
});
