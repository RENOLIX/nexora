// Nexora : configuration Firebase (publique ; les règles Firestore contrôlent les accès).
window.KB_CATALOG_READY = true;
const KB_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBOnXPj4MlYscDwpInT-rWgSK7trXIZajU',
  authDomain: 'nstore-c699a.firebaseapp.com',
  projectId: 'nstore-c699a',
  storageBucket: 'nstore-c699a.firebasestorage.app',
  messagingSenderId: '633345035311',
  appId: '1:633345035311:web:e3688f3ffe35b5b47c0ada'
};
firebase.initializeApp(KB_FIREBASE_CONFIG);
const KB_DB = firebase.firestore();
const KB_AUTH = firebase.auth();
window.KB_FIREBASE_CONFIG = KB_FIREBASE_CONFIG;
window.KB = {db:KB_DB, auth:KB_AUTH, serverTime:() => firebase.firestore.FieldValue.serverTimestamp()};

// Produits et catégories gérés depuis l'administration (collections products et categories).
const NX_CACHE_KEY = 'nexora-catalog-v1';
function nxNormalizeProduct(id, d) {
  const images = (Array.isArray(d.images) ? d.images : []).filter(Boolean);
  const sizes = Array.isArray(d.sizes) && d.sizes.length ? d.sizes : ['TU'];
  const p = {
    id, name: d.name || 'Produit', short: d.name || 'Produit', category: d.category || '', price: Number(d.price) || 0,
    oldPrice: Number(d.oldPrice) || null, color: d.color || '', swatch: d.swatch || '#dddddd', sizes,
    description: d.description || '', details: d.details || '', images, cover: images[0] || '',
    stock: Number.isInteger(d.stock) ? d.stock : null, active: d.active !== false, brand: 'Nexora',
    order: Number.isFinite(d.order) ? d.order : 999, url: `/produit/?id=${encodeURIComponent(id)}`
  };
  p._source = {name: p.name, short: p.name, description: p.description, details: p.details, color: p.color};
  return p;
}
function nxApplyCatalog(data) {
  if (!data || typeof PRODUCTS === 'undefined') return false;
  if (Array.isArray(data.categories) && data.categories.length && typeof CP_CATEGORIES !== 'undefined') {
    const cats = data.categories.slice().sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    CP_CATEGORIES.splice(0, CP_CATEGORIES.length, ...cats.map(c => [c.id, c.label]));
    if (typeof cmCategories !== 'undefined') cmCategories.splice(0, cmCategories.length, ...cats.map(c => [c.id, String(c.label).toUpperCase(), c.image || '']));
  }
  if (Array.isArray(data.products)) {
    const list = data.products.map(p => nxNormalizeProduct(p.id, p)).sort((a, b) => a.order - b.order);
    PRODUCTS.splice(0, PRODUCTS.length, ...list);
  }
  return true;
}
// Affichage immédiat depuis le cache du navigateur, puis mise à jour depuis Firebase.
try { nxApplyCatalog(JSON.parse(localStorage.getItem(NX_CACHE_KEY) || 'null')); } catch {}
async function loadNexoraCatalog() {
  if (typeof PRODUCTS === 'undefined') return;
  try {
    const [productsSnap, categoriesSnap] = await Promise.all([KB_DB.collection('products').get(), KB_DB.collection('categories').get()]);
    const data = {
      products: productsSnap.docs.map(doc => ({id: doc.id, ...doc.data()})),
      categories: categoriesSnap.docs.map(doc => ({id: doc.id, ...doc.data()}))
    };
    if (!data.products.length && !data.categories.length) return;
    nxApplyCatalog(data);
    try { localStorage.setItem(NX_CACHE_KEY, JSON.stringify(data)); } catch {}
    render();
  } catch (error) {
    console.warn('Catalogue Firebase indisponible ; catalogue local affiché.', error);
  }
}
document.addEventListener('DOMContentLoaded', loadNexoraCatalog);

async function loadShippingRates() {
  if (typeof SHIPPING_WILAYAS === 'undefined') return;
  try {
    const doc = await KB_DB.collection('settings').doc('shipping').get();
    if (!doc.exists) return;
    const rates = doc.data().rates || {};
    SHIPPING_WILAYAS.forEach((wilaya, index) => {
      const rate = rates[String(index + 1).padStart(2, '0')];
      if (!rate) return;
      if (Number.isInteger(rate.home) && rate.home > 0) wilaya.home = rate.home;
      if (Number.isInteger(rate.desk) && rate.desk >= 0) wilaya.desk = rate.desk;
    });
    window.dispatchEvent(new Event('cosmoplus:shipping-updated'));
  } catch (error) { console.warn('Tarifs de livraison Firebase indisponibles.', error); }
}
document.addEventListener('DOMContentLoaded', () => { window.CP_SHIPPING_READY = loadShippingRates(); });
