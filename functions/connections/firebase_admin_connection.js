'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert({
    type: 'service_account',
    project_id: functions.config().service.project_id,
    private_key_id: functions.config().service.private_key_id,
    private_key: functions.config().service.private_key.replace(/\\n/g, '\n'),
    client_email: functions.config().service.client_email,
    client_id: functions.config().service.client_id,
    auth_uri: functions.config().service.auth_uri,
    token_uri: functions.config().service.token_uri,
    auth_provider_x509_cert_url: functions.config().service.auth_provider_x509_cert_url,
    client_x509_cert_url: functions.config().service.client_x509_cert_url
  }),
  databaseURL: functions.config().service.database_url,
  storageBucket: functions.config().service.storage_bucket
});

exports.firestore = admin.firestore();
exports.bucket_post = admin.storage().bucket('imgur.lefty.blog');
exports.bucket_category = admin.storage().bucket('assets.lefty.blog');
exports.auth = admin.auth();