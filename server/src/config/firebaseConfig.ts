import * as admin from "firebase-admin";
import path from "path";

// Import the service account JSON securely using an absolute path
const serviceAccount = require(path.resolve(
  __dirname,
  "../firebase/adminsdk.json"
));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
