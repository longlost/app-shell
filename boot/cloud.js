'use strict';

const functions = require('firebase-functions');
const admin     = require('firebase-admin'); // Access Storage and Firestore.

// Common app cloud functions.

// Usage in a Firebase project. 
//
// In './functions/index.js'...
//
// const functions = require('firebase-functions');
// const admin     = require('firebase-admin'); // access Auth, Realtime Database and Firestore
// ...
// // Creates grouped functions, ie. 'boot-createUser', 'boot-deleteUser'
// exports.boot = require('@longlost/boot/cloud');



// Add new user info to db.
exports.createUser = functions.auth.user().onCreate(async user => {

  // Fix for email signup where userName is null.
  // 'firebaseui' creates user, then updates user profile info.
  // This may cause a race condition that can fail but seems to work for now.
  const userRecord = await admin.auth().getUser(user.uid);

  const keys = Object.keys(userRecord);

  const userData = keys.reduce((accum, key) => {
    const val = userRecord[key];

    // Firestore does not allow undefined values.
    // Null vals are not necessary.
    if (val === undefined || val === null) { 
      return accum;
    }

    // Firestore does not allow functions/methods or custom objects.
    if (typeof val === 'function' || typeof val === 'object') {         
      return accum;
    }

    accum[key] = val;

    return accum;
  }, {});

  userData.createdAt = Date.now();

  // Save the new users data in firestore.
  await admin.firestore().collection('users').doc(user.uid).set(userData);

  return null; 
});

// Remove user info from db when user account is deleted.
exports.deleteUser = functions.auth.user().onDelete(async user => {
	
  await admin.firestore().collection('users').doc(user.uid).delete(); 

  return null;  
});
