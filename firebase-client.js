// Firebase web configuration is public; Firestore rules control access.
window.KB_CATALOG_READY = true;
const KB_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAcseMpduy8ol-2hCsfN-y4u18Li98P_Rc',
  authDomain: 'cosmoplus-8797a.firebaseapp.com',
  projectId: 'cosmoplus-8797a',
  storageBucket: 'cosmoplus-8797a.firebasestorage.app',
  messagingSenderId: '679876791862',
  appId: '1:679876791862:web:986d4da1bbc245924f9297'
};
firebase.initializeApp(KB_FIREBASE_CONFIG);
const KB_DB = firebase.firestore();
const KB_AUTH = firebase.auth();
window.KB_FIREBASE_CONFIG = KB_FIREBASE_CONFIG;
window.KB = {db:KB_DB, auth:KB_AUTH, serverTime:() => firebase.firestore.FieldValue.serverTimestamp()};

// Nexora : le catalogue est statique (nexora-catalog.js). Firebase sert uniquement
// à enregistrer les commandes et à lire les tarifs de livraison.
function loadNexoraCatalog() {
  if (typeof PRODUCTS === 'undefined') return;
  PRODUCTS.splice(0, PRODUCTS.length, ...(window.COSMOPLUS_CATALOG || []).map(p => ({...p})));
  render();
}
document.addEventListener('DOMContentLoaded', loadNexoraCatalog);

async function loadShippingRates() {
  if (typeof SHIPPING_WILAYAS === 'undefined') return;
  try {
    const doc = await KB_DB.collection('settings').doc('shipping').get();
    if (!doc.exists) return;
    const rates = doc.data().rates || {};
    SHIPPING_WILAYAS.forEach((wilaya,index) => {
      const rate = rates[String(index + 1).padStart(2,'0')];
      if (!rate) return;
      if (Number.isInteger(rate.home) && rate.home > 0) wilaya.home = rate.home;
      if (Number.isInteger(rate.desk) && rate.desk >= 0) wilaya.desk = rate.desk;
    });
    window.dispatchEvent(new Event('cosmoplus:shipping-updated'));
  } catch(error) { console.warn('Tarifs de livraison Firebase indisponibles.',error); }
}
document.addEventListener('DOMContentLoaded',() => { window.CP_SHIPPING_READY = loadShippingRates(); });
