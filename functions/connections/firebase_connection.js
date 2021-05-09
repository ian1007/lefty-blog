'use strict';

const functions = require('firebase-functions');
const firebase = require('firebase/app');

const config = {
  apiKey: functions.config().service.api_key,
  authDomain: functions.config().service.auth_domain,
  databaseURL: functions.config().service.database_url,
  projectId: functions.config().service.project_id,
  storageBucket: functions.config().service.storage_bucket,
  messagingSenderId: functions.config().service.messaging_sender_id,
  appId: functions.config().service.app_id,
  measurementId: functions.config().service.measurement_id
};

exports.firebase = firebase.initializeApp(config);
exports.firebaseConfig = config;