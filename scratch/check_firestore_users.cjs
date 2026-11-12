const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyCPlcc5Tj69rBpRhBgu8AWmZKZLsNG5kGg",
  authDomain: "duyheheh-2a269.firebaseapp.com",
  projectId: "duyheheh-2a269",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const uids = ["4cGVP0dPoweBOemcdOgB0U9X6NH2", "kvNuoYK5B0Z33VzUKa2kecpywH22", "X6EIQPJNcQgb3nPJACCC1E0zUc63"];
  for (const uid of uids) {
    const snap = await getDoc(doc(db, 'users', uid));
    console.log(uid, snap.exists() ? snap.data() : 'NOT_FOUND');
  }
}

check().catch(console.error);
