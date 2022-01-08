const admin = require('firebase-admin');
const serviceAccount = require('./neogasogaeseo-9aaf5-firebase-adminsdk-evzi9-7b94c0f3cb.json');
const dotenv = require('dotenv');

dotenv.config();

let firebase;
if (admin.apps.length === 0) {
  firebase = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else {
  firebase = admin.app();
}

module.exports = {
  api: require('./api'),
};
