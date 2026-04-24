import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // ← different import

//development database
const firebaseConfig = {
  apiKey: "AIzaSyC2KU8weZuArOtgHDSQBSKYXctOr4d_gTI",
  authDomain: "greenleaves-6511a.firebaseapp.com",
  projectId: "greenleaves-6511a",
  storageBucket: "greenleaves-6511a.appspot.com",
  messagingSenderId: "330718766733",
  appId: "1:330718766733:web:59cb95125d6d6eedd2a4c4",
  measurementId: "G-KVRQZD0L9C",
};

// const firebaseConfig = {
//   apiKey: "AIzaSyBysx2WQHJlMl7xJe4wCgO68YkQyNqe3CA",
//   authDomain: "greenleaves-72f02.firebaseapp.com",
//   projectId: "greenleaves-72f02",
//   storageBucket: "greenleaves-72f02.firebasestorage.app",
//   messagingSenderId: "271894285141",
//   appId: "1:271894285141:web:14b665f229c6b089757ddc",
//   measurementId: "G-KCQGE63B7M",
// };

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp); // ← no AsyncStorage needed
const db = getFirestore(firebaseApp);

export { firebaseApp, db, auth };
