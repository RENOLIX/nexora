// Administration Nexora : commandes, produits, catégories, livraison et utilisateurs.
// Rôles : admin (tout) · employee (commandes + produits, sans suppression).
(() => {
  'use strict';
  const db = KB.db, auth = KB.auth, ts = () => firebase.firestore.FieldValue.serverTimestamp();
  const root = document.getElementById('admin-root');
  const BASE = location.pathname.replace(/\/admin(\/.*)?$/, '');
  const asset = src => !src ? '' : /^(data:|https?:)/.test(src) ? src : BASE + src;
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const money = n => `${new Intl.NumberFormat('fr-DZ', {maximumFractionDigits: 0}).format(Number(n) || 0)} DA`;
  const fmtDate = t => { const d = t?.toDate ? t.toDate() : t ? new Date(t) : null; return d ? d.toLocaleString('fr-FR', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'}) : '—'; };
  const slug = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'item';
  const STATUSES = [['nouvelle', 'Nouvelle'], ['confirmee', 'Confirmée'], ['expediee', 'Expédiée'], ['livree', 'Livrée'], ['injoignable', 'Injoignable'], ['retour', 'Retour'], ['annulee', 'Annulée']];
  const statusLabel = s => STATUSES.find(x => x[0] === s)?.[1] || s;
  const SIZE_PRESETS = ['S', 'M', 'L', 'XL', 'XXL', '3XL', 'TU'];
  const ICON = {
    dash: '<path d="M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z"/>',
    orders: '<path d="M4 8h16l-1 13H5L4 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/>',
    products: '<path d="M8 3 4 6l2 4 2-1v12h8V9l2 1 2-4-4-3-2 2h-4Z"/>',
    cats: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
    ship: '<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
    users: '<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-7 7-7s7 3 7 7"/><path d="M16 4a4 4 0 0 1 0 8M22 21c0-3-2-6-5-7"/>',
    out: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11"/>', ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', close: '<path d="M5 5l14 14M19 5 5 19"/>', menu: '<path d="M3 6h18M3 12h18M3 18h18"/>'
  };
  const icon = n => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n]}</svg>`;

  const state = {user: null, staff: null, view: 'dash', orders: [], products: [], categories: [], staffList: [], orderFilter: 'toutes', orderSearch: '', unsub: []};
  const isAdmin = () => state.staff?.role === 'admin';

  // ---------- utilitaires UI ----------
  function toast(msg, kind = 'ok') {
    const t = document.createElement('div'); t.className = `nxa-toast ${kind}`; t.textContent = msg; document.body.appendChild(t);
    setTimeout(() => t.classList.add('show'), 10); setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3200);
  }
  function modal(title, body, {wide = false} = {}) {
    closeModal();
    const m = document.createElement('div'); m.className = 'nxa-modal'; m.id = 'nxa-modal';
    m.innerHTML = `<div class="nxa-modal-box ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="nxa-modal-head"><h2>${esc(title)}</h2><button class="nxa-icon" data-close aria-label="Fermer">${icon('close')}</button></div><div class="nxa-modal-body">${body}</div></div>`;
    m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-close]')) closeModal(); });
    document.body.appendChild(m); document.body.classList.add('nxa-lock');
    return m;
  }
  function closeModal() { document.getElementById('nxa-modal')?.remove(); document.body.classList.remove('nxa-lock'); }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  const authError = e => ({
    'auth/invalid-credential': 'E-mail ou mot de passe incorrect.', 'auth/wrong-password': 'Mot de passe incorrect.', 'auth/user-not-found': 'Aucun compte avec cet e-mail.',
    'auth/email-already-in-use': 'Cet e-mail est déjà utilisé.', 'auth/weak-password': 'Mot de passe trop court (6 caractères minimum).', 'auth/invalid-email': 'Adresse e-mail invalide.',
    'auth/too-many-requests': 'Trop de tentatives, réessayez dans quelques minutes.', 'auth/operation-not-allowed': 'La connexion e-mail/mot de passe n’est pas encore activée dans Firebase.',
    'auth/configuration-not-found': 'L’authentification n’est pas encore activée dans Firebase (Authentication → Commencer).', 'permission-denied': 'Action non autorisée pour votre rôle.'
  }[e?.code] || e?.message || 'Une erreur est survenue.');

  // Compression d'image dans le navigateur (photos stockées dans Firestore).
  function compressImage(file, max = 1000, quality = 0.82) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
        const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        let out = c.toDataURL('image/webp', quality); if (!out.startsWith('data:image/webp')) out = c.toDataURL('image/jpeg', quality);
        resolve(out);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image illisible.')); };
      img.src = url;
    });
  }

  // ---------- écrans de connexion ----------
  function renderBoot(msg) { root.innerHTML = `<div class="nxa-boot"><img src="../assets/logo-nexora.webp" alt="Nexora"><p>${esc(msg)}</p></div>`; }
  async function renderAuth() {
    let setupDone = true;
    try { setupDone = (await db.collection('meta').doc('setup').get()).exists; } catch { setupDone = true; }
    const wantSetup = !setupDone;
    root.innerHTML = `<div class="nxa-auth"><form class="nxa-auth-card" id="nxa-auth-form" novalidate>
      <img src="../assets/logo-nexora.webp" alt="Nexora">
      <h1>${wantSetup ? 'Créer le compte administrateur' : 'Espace administration'}</h1>
      <p>${wantSetup ? 'Premier accès : créez le compte qui gérera la boutique. Aucune confirmation par e-mail n’est demandée.' : 'Connectez-vous avec votre compte Nexora.'}</p>
      ${wantSetup ? '<label>Nom<input name="name" required maxlength="80" autocomplete="name"></label>' : ''}
      <label>E-mail<input name="email" type="email" required autocomplete="username"></label>
      <label>Mot de passe<input name="password" type="password" required minlength="6" autocomplete="${wantSetup ? 'new-password' : 'current-password'}"></label>
      ${wantSetup ? '<label>Confirmer le mot de passe<input name="password2" type="password" required minlength="6" autocomplete="new-password"></label>' : ''}
      <p class="nxa-error" id="nxa-auth-error" role="alert"></p>
      <button class="nxa-btn nxa-btn-dark" type="submit">${wantSetup ? 'CRÉER MON COMPTE ADMIN' : 'SE CONNECTER'}</button>
      ${wantSetup ? '' : '<button class="nxa-link" type="button" id="nxa-reset">Mot de passe oublié ?</button>'}
      <a class="nxa-link" href="../">← Retour à la boutique</a></form></div>`;
    const form = document.getElementById('nxa-auth-form'), err = document.getElementById('nxa-auth-error');
    document.getElementById('nxa-reset')?.addEventListener('click', async () => {
      const email = form.email.value.trim(); if (!email) { err.textContent = 'Saisissez votre e-mail puis cliquez à nouveau.'; return; }
      try { await auth.sendPasswordResetEmail(email); err.textContent = 'Un e-mail de réinitialisation a été envoyé.'; } catch (e) { err.textContent = authError(e); }
    });
    form.addEventListener('submit', async e => {
      e.preventDefault(); err.textContent = '';
      const email = form.email.value.trim(), password = form.password.value, btn = form.querySelector('[type=submit]');
      if (wantSetup && password !== form.password2.value) { err.textContent = 'Les mots de passe ne correspondent pas.'; return; }
      btn.disabled = true;
      try {
        if (wantSetup) {
          const cred = await auth.createUserWithEmailAndPassword(email, password);
          const batch = db.batch();
          batch.set(db.collection('staff').doc(cred.user.uid), {name: form.name.value.trim() || email, email, role: 'admin', createdAt: ts()});
          batch.set(db.collection('meta').doc('setup'), {by: cred.user.uid, at: ts()});
          await batch.commit();
          toast('Compte administrateur créé.');
        } else {
          await auth.signInWithEmailAndPassword(email, password);
        }
      } catch (e2) { err.textContent = authError(e2); btn.disabled = false; }
    });
  }

  // ---------- structure ----------
  const NAV = [['dash', 'Tableau de bord', 'dash', false], ['orders', 'Commandes', 'orders', false], ['products', 'Produits', 'products', false], ['categories', 'Catégories', 'cats', true], ['shipping', 'Livraison', 'ship', true], ['users', 'Utilisateurs', 'users', true]];
  function renderShell() {
    const nav = NAV.filter(n => !n[3] || isAdmin());
    if (!nav.some(n => n[0] === state.view)) state.view = 'dash';
    const newCount = state.orders.filter(o => o.status === 'nouvelle').length;
    root.innerHTML = `<div class="nxa-app"><aside class="nxa-side" id="nxa-side"><a class="nxa-brand" href="../" target="_blank" rel="noopener"><img src="../assets/logo-nexora.webp" alt="Nexora"></a><nav>${nav.map(([id, label, ic]) => `<button class="${state.view === id ? 'active' : ''}" data-view="${id}">${icon(ic)}<span>${label}</span>${id === 'orders' && newCount ? `<b class="nxa-badge">${newCount}</b>` : ''}</button>`).join('')}</nav><div class="nxa-side-foot"><a href="../" target="_blank" rel="noopener">${icon('ext')}<span>Voir la boutique</span></a><button data-logout>${icon('out')}<span>Déconnexion</span></button></div></aside>
      <div class="nxa-main"><header class="nxa-top"><button class="nxa-icon nxa-burger" data-burger aria-label="Menu">${icon('menu')}</button><h1>${esc(NAV.find(n => n[0] === state.view)[1])}</h1><div class="nxa-user"><span>${esc(state.staff.name || state.user.email)}</span><em>${isAdmin() ? 'Administrateur' : 'Employé'}</em></div></header><section class="nxa-content" id="nxa-content"></section></div></div>`;
    root.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => { state.view = b.dataset.view; document.getElementById('nxa-side').classList.remove('open'); renderShell(); }));
    root.querySelector('[data-logout]').addEventListener('click', () => auth.signOut());
    root.querySelector('[data-burger]').addEventListener('click', () => document.getElementById('nxa-side').classList.toggle('open'));
    renderView();
  }
  function renderView() {
    const el = document.getElementById('nxa-content'); if (!el) return;
    ({dash: viewDash, orders: viewOrders, products: viewProducts, categories: viewCategories, shipping: viewShipping, users: viewUsers}[state.view] || viewDash)(el);
  }
  // Pas de rafraîchissement pendant la saisie (fenêtre ouverte ou page Livraison) : seul le badge est mis à jour.
  const refresh = () => { if (document.getElementById('nxa-content') && !document.getElementById('nxa-modal') && state.view !== 'shipping') renderShell(); else updateBadge(); };
  function updateBadge() { const n = state.orders.filter(o => o.status === 'nouvelle').length; const b = root.querySelector('[data-view="orders"]'); if (!b) return; b.querySelector('.nxa-badge')?.remove(); if (n) b.insertAdjacentHTML('beforeend', `<b class="nxa-badge">${n}</b>`); }

  // ---------- tableau de bord ----------
  function viewDash(el) {
    const o = state.orders, by = s => o.filter(x => x.status === s);
    const revenue = by('livree').reduce((s, x) => s + (x.total || 0), 0);
    const pending = o.filter(x => ['nouvelle', 'confirmee', 'expediee'].includes(x.status)).reduce((s, x) => s + (x.total || 0), 0);
    el.innerHTML = `<div class="nxa-stats">
      <div><span>Nouvelles commandes</span><strong>${by('nouvelle').length}</strong></div>
      <div><span>Commandes au total</span><strong>${o.length}</strong></div>
      <div><span>Chiffre livré</span><strong>${money(revenue)}</strong></div>
      <div><span>En cours (non livré)</span><strong>${money(pending)}</strong></div>
      <div><span>Produits en ligne</span><strong>${state.products.filter(p => p.active !== false).length}</strong></div>
      <div><span>Catégories</span><strong>${state.categories.length}</strong></div></div>
      <div class="nxa-card"><div class="nxa-card-head"><h2>Dernières commandes</h2><button class="nxa-btn" data-go="orders">Tout voir</button></div>${ordersTable(o.slice(0, 8))}</div>`;
    el.querySelector('[data-go]').addEventListener('click', () => { state.view = 'orders'; renderShell(); });
    bindOrderRows(el);
  }

  // ---------- commandes ----------
  function ordersTable(list) {
    if (!list.length) return '<p class="nxa-empty">Aucune commande pour le moment.</p>';
    return `<div class="nxa-table-wrap"><table class="nxa-table"><thead><tr><th>Date</th><th>Cliente</th><th>Wilaya</th><th>Articles</th><th>Total</th><th>Statut</th></tr></thead><tbody>${list.map(o => `<tr data-order="${esc(o.id)}" tabindex="0"><td>${fmtDate(o.createdAt)}<small>#${esc(o.id.slice(0, 6).toUpperCase())}</small></td><td><strong>${esc(o.customer?.name)}</strong><small>${esc(o.customer?.phone)}</small></td><td>${esc(o.delivery?.wilaya)}<small>${o.delivery?.method === 'bureau' ? 'Bureau' : 'Domicile'}</small></td><td>${(o.items || []).reduce((s, i) => s + (i.quantity || 0), 0)}</td><td><strong>${money(o.total)}</strong></td><td><span class="nxa-status s-${esc(o.status)}">${esc(statusLabel(o.status))}</span></td></tr>`).join('')}</tbody></table></div>`;
  }
  function bindOrderRows(el) { el.querySelectorAll('[data-order]').forEach(r => { const open = () => openOrder(r.dataset.order); r.addEventListener('click', open); r.addEventListener('keydown', e => { if (e.key === 'Enter') open(); }); }); }
  function viewOrders(el) {
    const q = state.orderSearch.toLowerCase();
    const list = state.orders.filter(o => (state.orderFilter === 'toutes' || o.status === state.orderFilter) && (!q || `${o.customer?.name} ${o.customer?.phone} ${o.delivery?.wilaya} ${o.id}`.toLowerCase().includes(q)));
    el.innerHTML = `<div class="nxa-toolbar"><div class="nxa-chips">${[['toutes', 'Toutes'], ...STATUSES].map(([id, l]) => `<button class="${state.orderFilter === id ? 'active' : ''}" data-filter="${id}">${l}<em>${id === 'toutes' ? state.orders.length : state.orders.filter(o => o.status === id).length}</em></button>`).join('')}</div><input class="nxa-search" type="search" placeholder="Rechercher nom, téléphone, wilaya…" value="${esc(state.orderSearch)}"></div><div class="nxa-card">${ordersTable(list)}</div>`;
    el.querySelectorAll('[data-filter]').forEach(b => b.addEventListener('click', () => { state.orderFilter = b.dataset.filter; viewOrders(el); }));
    const s = el.querySelector('.nxa-search'); s.addEventListener('input', () => { state.orderSearch = s.value; const pos = s.selectionStart; viewOrders(el); const n = el.querySelector('.nxa-search'); n.focus(); n.setSelectionRange(pos, pos); });
    bindOrderRows(el);
  }
  function openOrder(id) {
    const o = state.orders.find(x => x.id === id); if (!o) return;
    const d = o.delivery || {};
    const m = modal(`Commande #${o.id.slice(0, 6).toUpperCase()}`, `<div class="nxa-order">
      <div class="nxa-order-grid"><div><h3>Cliente</h3><p><strong>${esc(o.customer?.name)}</strong><br><a href="tel:${esc(o.customer?.phone)}">${esc(o.customer?.phone)}</a></p></div>
      <div><h3>Livraison</h3><p>${esc(d.wilayaCode)} · ${esc(d.wilaya)}<br>${esc(d.commune)}<br>${d.method === 'bureau' ? `Au bureau${d.office ? ' · ' + esc(d.office) : ''}` : `À domicile · ${esc(d.address)}`}</p></div>
      <div><h3>Date</h3><p>${fmtDate(o.createdAt)}</p></div></div>
      ${o.notes ? `<p class="nxa-notes"><strong>Note :</strong> ${esc(o.notes)}</p>` : ''}
      <table class="nxa-table nxa-items"><thead><tr><th>Article</th><th>Taille</th><th>Couleur</th><th>Qté</th><th>Prix</th></tr></thead><tbody>${(o.items || []).map(i => { const p = state.products.find(x => x.id === i.productId); const img = p?.images?.[0] || i.image; return `<tr><td><div class="nxa-item">${img ? `<img src="${esc(asset(img))}" alt="">` : ''}<span>${esc(p?.name || String(i.name || '').replace(/^NEXORA · /, '').split(' · ')[0])}</span></div></td><td>${esc(i.size || '—')}</td><td>${esc(i.color || p?.color || '—')}</td><td>${i.quantity}</td><td>${money(i.unitPrice * i.quantity)}</td></tr>`; }).join('')}</tbody></table>
      <div class="nxa-totals"><span>Sous-total</span><strong>${money(o.subtotal)}</strong><span>Livraison</span><strong>${money(o.shippingFee)}</strong><span class="big">Total</span><strong class="big">${money(o.total)}</strong></div>
      <div class="nxa-order-actions"><label>Statut<select id="nxa-status">${STATUSES.map(([v, l]) => `<option value="${v}" ${o.status === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label><button class="nxa-btn nxa-btn-dark" id="nxa-save-status">ENREGISTRER LE STATUT</button>${isAdmin() ? '<button class="nxa-btn nxa-btn-danger" id="nxa-del-order">Supprimer</button>' : ''}</div></div>`, {wide: true});
    m.querySelector('#nxa-save-status').addEventListener('click', async () => {
      try { await db.collection('orders').doc(o.id).update({status: m.querySelector('#nxa-status').value, updatedAt: ts()}); toast('Statut mis à jour.'); closeModal(); refresh(); } catch (e) { toast(authError(e), 'err'); }
    });
    m.querySelector('#nxa-del-order')?.addEventListener('click', async () => {
      if (!confirm('Supprimer définitivement cette commande ?')) return;
      try { await db.collection('orders').doc(o.id).delete(); toast('Commande supprimée.'); closeModal(); refresh(); } catch (e) { toast(authError(e), 'err'); }
    });
  }

  // ---------- produits ----------
  const catLabel = id => state.categories.find(c => c.id === id)?.label || id || '—';
  function viewProducts(el) {
    const list = state.products.slice().sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    el.innerHTML = `<div class="nxa-toolbar"><p class="nxa-muted">${list.length} produit${list.length > 1 ? 's' : ''}</p><button class="nxa-btn nxa-btn-dark" data-new>${icon('plus')} AJOUTER UN PRODUIT</button></div>
      ${list.length ? `<div class="nxa-products">${list.map(p => `<article class="nxa-product ${p.active === false ? 'off' : ''}"><div class="nxa-product-img">${p.images?.[0] ? `<img src="${esc(asset(p.images[0]))}" alt="">` : ''}${p.active === false ? '<span class="nxa-pill">Masqué</span>' : ''}</div><div class="nxa-product-body"><small>${esc(catLabel(p.category))}</small><h3>${esc(p.name)}</h3><p><strong>${money(p.price)}</strong>${p.oldPrice ? ` <s>${money(p.oldPrice)}</s>` : ''}</p><p class="nxa-muted"><i class="nxa-dot" style="background:${esc(p.swatch || '#ddd')}"></i>${esc(p.color || '—')} · ${esc((p.sizes || []).join(', '))}</p><p class="nxa-muted">Stock : ${Number.isInteger(p.stock) ? p.stock : 'illimité'}</p></div><div class="nxa-product-actions"><button class="nxa-btn" data-edit="${esc(p.id)}">Modifier</button>${isAdmin() ? `<button class="nxa-btn nxa-btn-danger" data-del="${esc(p.id)}">Supprimer</button>` : ''}</div></article>`).join('')}</div>` : '<div class="nxa-card"><p class="nxa-empty">Aucun produit. Ajoutez votre premier produit.</p></div>'}`;
    el.querySelector('[data-new]').addEventListener('click', () => productForm());
    el.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => productForm(state.products.find(p => p.id === b.dataset.edit))));
    el.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
      const p = state.products.find(x => x.id === b.dataset.del);
      if (!confirm(`Supprimer « ${p.name} » ? Cette action est définitive.`)) return;
      try { await db.collection('products').doc(p.id).delete(); toast('Produit supprimé.'); } catch (e) { toast(authError(e), 'err'); }
    }));
  }
  function productForm(p = null) {
    const editing = !!p; let images = (p?.images || []).slice();
    const sizes = new Set(p?.sizes || ['M', 'L', 'XL', 'XXL']);
    const m = modal(editing ? 'Modifier le produit' : 'Nouveau produit', `<form class="nxa-form" id="nxa-pform" novalidate>
      <div class="nxa-grid2"><label class="span2">Nom du produit *<input name="name" required maxlength="120" value="${esc(p?.name)}"></label>
      <label>Catégorie *<select name="category" required>${state.categories.map(c => `<option value="${esc(c.id)}" ${p?.category === c.id ? 'selected' : ''}>${esc(c.label)}</option>`).join('')}</select></label>
      <label>Prix (DA) *<input name="price" type="number" min="0" step="50" required value="${esc(p?.price ?? '')}"></label>
      <label>Ancien prix (DA) <small>barré, optionnel</small><input name="oldPrice" type="number" min="0" step="50" value="${esc(p?.oldPrice ?? '')}"></label>
      <label>Stock <small>vide = illimité</small><input name="stock" type="number" min="0" step="1" value="${esc(Number.isInteger(p?.stock) ? p.stock : '')}"></label>
      <label>Couleur<input name="color" maxlength="40" value="${esc(p?.color)}" placeholder="ex. Bleu ciel"></label>
      <label>Pastille couleur<input name="swatch" type="color" value="${esc(p?.swatch || '#cccccc')}"></label>
      <fieldset class="span2"><legend>Tailles</legend><div class="nxa-sizes">${SIZE_PRESETS.map(s => `<label><input type="checkbox" name="size" value="${s}" ${sizes.has(s) ? 'checked' : ''}><span>${s}</span></label>`).join('')}</div><input name="sizesExtra" placeholder="Autres tailles séparées par des virgules (ex. 38, 40, 42)" value="${esc([...sizes].filter(s => !SIZE_PRESETS.includes(s)).join(', '))}"></fieldset>
      <label class="span2">Description<textarea name="description" rows="4" maxlength="2000">${esc(p?.description)}</textarea></label>
      <label class="span2">Détails <small>caractéristiques, matière…</small><textarea name="details" rows="2" maxlength="600">${esc(p?.details)}</textarea></label>
      <fieldset class="span2"><legend>Photos <small>la première est la photo principale</small></legend><div class="nxa-images" id="nxa-images"></div><label class="nxa-upload">${icon('plus')}<span>Ajouter des photos</span><input type="file" accept="image/*" multiple hidden id="nxa-files"></label></fieldset>
      <label>Ordre d’affichage<input name="order" type="number" step="1" value="${esc(p?.order ?? state.products.length)}"></label>
      <label class="nxa-check"><input type="checkbox" name="active" ${p?.active === false ? '' : 'checked'}> Visible sur la boutique</label></div>
      <p class="nxa-error" id="nxa-perr" role="alert"></p>
      <div class="nxa-form-actions"><button type="button" class="nxa-btn" data-close>Annuler</button><button class="nxa-btn nxa-btn-dark" type="submit">${editing ? 'ENREGISTRER' : 'AJOUTER LE PRODUIT'}</button></div></form>`, {wide: true});
    const box = m.querySelector('#nxa-images');
    const drawImages = () => {
      box.innerHTML = images.length ? images.map((src, i) => `<div class="nxa-thumb"><img src="${esc(asset(src))}" alt=""><div><button type="button" data-left="${i}" ${i ? '' : 'disabled'} aria-label="Avancer">‹</button><button type="button" data-rm="${i}" aria-label="Retirer">✕</button><button type="button" data-right="${i}" ${i < images.length - 1 ? '' : 'disabled'} aria-label="Reculer">›</button></div>${i ? '' : '<em>Principale</em>'}</div>`).join('') : '<p class="nxa-muted">Aucune photo.</p>';
      box.querySelectorAll('[data-rm]').forEach(b => b.addEventListener('click', () => { images.splice(+b.dataset.rm, 1); drawImages(); }));
      box.querySelectorAll('[data-left]').forEach(b => b.addEventListener('click', () => { const i = +b.dataset.left; [images[i - 1], images[i]] = [images[i], images[i - 1]]; drawImages(); }));
      box.querySelectorAll('[data-right]').forEach(b => b.addEventListener('click', () => { const i = +b.dataset.right; [images[i + 1], images[i]] = [images[i], images[i + 1]]; drawImages(); }));
    };
    drawImages();
    m.querySelector('#nxa-files').addEventListener('change', async e => {
      const files = [...e.target.files].slice(0, 6);
      for (const f of files) { try { images.push(await compressImage(f, 1000, 0.8)); } catch (er) { toast(er.message, 'err'); } }
      e.target.value = ''; drawImages();
    });
    m.querySelector('#nxa-pform').addEventListener('submit', async e => {
      e.preventDefault(); const f = e.target, err = m.querySelector('#nxa-perr'); err.textContent = '';
      if (!f.reportValidity()) return;
      if (!state.categories.length) { err.textContent = 'Créez d’abord une catégorie.'; return; }
      if (!images.length) { err.textContent = 'Ajoutez au moins une photo.'; return; }
      const sz = [...f.querySelectorAll('[name=size]:checked')].map(x => x.value).concat(f.sizesExtra.value.split(',').map(s => s.trim()).filter(Boolean));
      const data = {
        name: f.name.value.trim(), category: f.category.value, price: Math.round(Number(f.price.value) || 0),
        oldPrice: f.oldPrice.value ? Math.round(Number(f.oldPrice.value)) : null, stock: f.stock.value === '' ? null : Math.max(0, Math.round(Number(f.stock.value))),
        color: f.color.value.trim(), swatch: f.swatch.value, sizes: [...new Set(sz)].length ? [...new Set(sz)] : ['TU'],
        description: f.description.value.trim(), details: f.details.value.trim(), images, active: f.active.checked,
        order: Math.round(Number(f.order.value) || 0), updatedAt: ts()
      };
      if (JSON.stringify(data).length > 950000) { err.textContent = 'Photos trop lourdes : retirez-en une ou utilisez des images plus petites.'; return; }
      const btn = f.querySelector('[type=submit]'); btn.disabled = true;
      try {
        if (editing) await db.collection('products').doc(p.id).set(data, {merge: true});
        else { let id = slug(data.name); if (state.products.some(x => x.id === id)) id += '-' + Math.random().toString(36).slice(2, 6); await db.collection('products').doc(id).set({...data, createdAt: ts()}); }
        toast(editing ? 'Produit mis à jour.' : 'Produit ajouté.'); closeModal();
      } catch (e2) { err.textContent = authError(e2); btn.disabled = false; }
    });
  }

  // ---------- catégories ----------
  function viewCategories(el) {
    const list = state.categories.slice().sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    el.innerHTML = `<div class="nxa-toolbar"><p class="nxa-muted">Les catégories apparaissent automatiquement dans le menu, l’accueil et la boutique.</p><button class="nxa-btn nxa-btn-dark" data-new>${icon('plus')} AJOUTER UNE CATÉGORIE</button></div>
      <div class="nxa-cats">${list.map(c => `<article><div class="nxa-cat-img">${c.image ? `<img src="${esc(asset(c.image))}" alt="">` : ''}</div><h3>${esc(c.label)}</h3><p class="nxa-muted">${state.products.filter(p => p.category === c.id).length} produit(s) · ordre ${c.order ?? '—'}</p><div><button class="nxa-btn" data-edit="${esc(c.id)}">Modifier</button><button class="nxa-btn nxa-btn-danger" data-del="${esc(c.id)}">Supprimer</button></div></article>`).join('') || '<p class="nxa-empty">Aucune catégorie.</p>'}</div>`;
    el.querySelector('[data-new]').addEventListener('click', () => categoryForm());
    el.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => categoryForm(state.categories.find(c => c.id === b.dataset.edit))));
    el.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
      const c = state.categories.find(x => x.id === b.dataset.del), n = state.products.filter(p => p.category === c.id).length;
      if (n) { toast(`Impossible : ${n} produit(s) utilisent cette catégorie. Déplacez-les d’abord.`, 'err'); return; }
      if (!confirm(`Supprimer la catégorie « ${c.label} » ?`)) return;
      try { await db.collection('categories').doc(c.id).delete(); toast('Catégorie supprimée.'); } catch (e) { toast(authError(e), 'err'); }
    }));
  }
  function categoryForm(c = null) {
    let image = c?.image || '';
    const m = modal(c ? 'Modifier la catégorie' : 'Nouvelle catégorie', `<form class="nxa-form" id="nxa-cform" novalidate>
      <label>Nom *<input name="label" required maxlength="40" value="${esc(c?.label)}" placeholder="ex. Abayas"></label>
      <label>Ordre d’affichage<input name="order" type="number" step="1" value="${esc(c?.order ?? state.categories.length)}"></label>
      <fieldset><legend>Photo de la catégorie <small>format portrait conseillé</small></legend><div class="nxa-cat-preview" id="nxa-cprev"></div><label class="nxa-upload">${icon('plus')}<span>Choisir une photo</span><input type="file" accept="image/*" hidden id="nxa-cfile"></label></fieldset>
      <p class="nxa-error" id="nxa-cerr" role="alert"></p>
      <div class="nxa-form-actions"><button type="button" class="nxa-btn" data-close>Annuler</button><button class="nxa-btn nxa-btn-dark" type="submit">${c ? 'ENREGISTRER' : 'AJOUTER'}</button></div></form>`);
    const prev = m.querySelector('#nxa-cprev'); const draw = () => { prev.innerHTML = image ? `<img src="${esc(asset(image))}" alt="">` : '<p class="nxa-muted">Aucune photo.</p>'; }; draw();
    m.querySelector('#nxa-cfile').addEventListener('change', async e => { const f = e.target.files[0]; if (f) { try { image = await compressImage(f, 600, 0.85); draw(); } catch (er) { toast(er.message, 'err'); } } });
    m.querySelector('#nxa-cform').addEventListener('submit', async e => {
      e.preventDefault(); const f = e.target, err = m.querySelector('#nxa-cerr'); if (!f.reportValidity()) return;
      if (!image) { err.textContent = 'Ajoutez une photo.'; return; }
      const data = {label: f.label.value.trim(), order: Math.round(Number(f.order.value) || 0), image, updatedAt: ts()};
      const btn = f.querySelector('[type=submit]'); btn.disabled = true;
      try {
        if (c) await db.collection('categories').doc(c.id).set(data, {merge: true});
        else { let id = slug(data.label); if (state.categories.some(x => x.id === id)) id += '-' + Math.random().toString(36).slice(2, 5); await db.collection('categories').doc(id).set(data); }
        toast(c ? 'Catégorie mise à jour.' : 'Catégorie ajoutée.'); closeModal();
      } catch (e2) { err.textContent = authError(e2); btn.disabled = false; }
    });
  }

  // ---------- livraison ----------
  async function viewShipping(el) {
    el.innerHTML = '<div class="nxa-card"><p class="nxa-empty">Chargement des tarifs…</p></div>';
    let rates = {};
    try { const d = await db.collection('settings').doc('shipping').get(); rates = d.exists ? d.data().rates || {} : {}; } catch (e) { toast(authError(e), 'err'); }
    const W = typeof SHIPPING_WILAYAS !== 'undefined' ? SHIPPING_WILAYAS : [];
    const row = (w, i) => { const code = String(i + 1).padStart(2, '0'), r = rates[code] || {}; const home = r.home ?? w.home, desk = r.desk ?? w.desk; return `<tr><td><b>${code}</b></td><td>${esc(w.name)}</td><td><input type="number" min="0" step="50" data-code="${code}" data-kind="home" value="${home}"></td><td><input type="number" min="0" step="50" data-code="${code}" data-kind="desk" value="${desk}"></td></tr>`; };
    el.innerHTML = `<div class="nxa-toolbar"><p class="nxa-muted">Tarifs en DA. Bureau à 0 = livraison au bureau indisponible pour cette wilaya.</p><div class="nxa-bulk"><input type="number" min="0" step="50" id="nxa-bulk-home" placeholder="Domicile"><input type="number" min="0" step="50" id="nxa-bulk-desk" placeholder="Bureau"><button class="nxa-btn" id="nxa-bulk">Appliquer à toutes</button></div></div>
      <div class="nxa-card"><div class="nxa-table-wrap"><table class="nxa-table nxa-ship"><thead><tr><th>Code</th><th>Wilaya</th><th>À domicile</th><th>Au bureau</th></tr></thead><tbody>${W.map(row).join('')}</tbody></table></div></div>
      <div class="nxa-sticky-save"><button class="nxa-btn nxa-btn-dark" id="nxa-ship-save">ENREGISTRER LES TARIFS</button></div>`;
    el.querySelector('#nxa-bulk').addEventListener('click', () => {
      const h = el.querySelector('#nxa-bulk-home').value, d = el.querySelector('#nxa-bulk-desk').value;
      if (h !== '') el.querySelectorAll('[data-kind=home]').forEach(i => i.value = h); if (d !== '') el.querySelectorAll('[data-kind=desk]').forEach(i => i.value = d);
    });
    el.querySelector('#nxa-ship-save').addEventListener('click', async e => {
      const out = {}; W.forEach((w, i) => { const code = String(i + 1).padStart(2, '0'); out[code] = {name: w.name, home: 0, desk: 0}; });
      el.querySelectorAll('[data-code]').forEach(i => { out[i.dataset.code][i.dataset.kind] = Math.max(0, Math.round(Number(i.value) || 0)); });
      e.target.disabled = true;
      try { await db.collection('settings').doc('shipping').set({rates: out, updatedAt: ts()}); toast('Tarifs de livraison enregistrés.'); } catch (er) { toast(authError(er), 'err'); }
      e.target.disabled = false;
    });
  }

  // ---------- utilisateurs ----------
  function viewUsers(el) {
    el.innerHTML = `<div class="nxa-toolbar"><p class="nxa-muted">Administrateur : accès complet. Employé : commandes et produits (sans suppression).</p><button class="nxa-btn nxa-btn-dark" data-new>${icon('plus')} AJOUTER UN UTILISATEUR</button></div>
      <div class="nxa-card"><div class="nxa-table-wrap"><table class="nxa-table"><thead><tr><th>Nom</th><th>E-mail</th><th>Rôle</th><th>Ajouté le</th><th></th></tr></thead><tbody>${state.staffList.map(s => `<tr><td><strong>${esc(s.name)}</strong>${s.id === state.user.uid ? ' <em class="nxa-you">vous</em>' : ''}</td><td>${esc(s.email)}</td><td>${s.id === state.user.uid ? 'Administrateur' : `<select data-role="${esc(s.id)}"><option value="admin" ${s.role === 'admin' ? 'selected' : ''}>Administrateur</option><option value="employee" ${s.role === 'employee' ? 'selected' : ''}>Employé</option></select>`}</td><td>${fmtDate(s.createdAt)}</td><td>${s.id === state.user.uid ? '' : `<button class="nxa-btn nxa-btn-danger" data-remove="${esc(s.id)}">Retirer l’accès</button>`}</td></tr>`).join('')}</tbody></table></div></div>`;
    el.querySelector('[data-new]').addEventListener('click', userForm);
    el.querySelectorAll('[data-role]').forEach(s => s.addEventListener('change', async () => {
      const u = state.staffList.find(x => x.id === s.dataset.role);
      try { await db.collection('staff').doc(u.id).set({name: u.name, email: u.email, role: s.value}, {merge: true}); toast('Rôle mis à jour.'); } catch (e) { toast(authError(e), 'err'); }
    }));
    el.querySelectorAll('[data-remove]').forEach(b => b.addEventListener('click', async () => {
      const u = state.staffList.find(x => x.id === b.dataset.remove);
      if (!confirm(`Retirer l’accès de ${u.name} (${u.email}) ?`)) return;
      try { await db.collection('staff').doc(u.id).delete(); toast('Accès retiré.'); } catch (e) { toast(authError(e), 'err'); }
    }));
  }
  function userForm() {
    const m = modal('Nouvel utilisateur', `<form class="nxa-form" id="nxa-uform" novalidate>
      <label>Nom *<input name="name" required maxlength="80"></label>
      <label>E-mail *<input name="email" type="email" required autocomplete="off"></label>
      <label>Mot de passe provisoire * <small>6 caractères minimum</small><input name="password" type="text" required minlength="6" autocomplete="new-password"></label>
      <label>Rôle<select name="role"><option value="employee">Employé</option><option value="admin">Administrateur</option></select></label>
      <p class="nxa-muted">Le compte est actif immédiatement, sans confirmation par e-mail. Transmettez l’e-mail et le mot de passe à la personne.</p>
      <p class="nxa-error" id="nxa-uerr" role="alert"></p>
      <div class="nxa-form-actions"><button type="button" class="nxa-btn" data-close>Annuler</button><button class="nxa-btn nxa-btn-dark" type="submit">CRÉER LE COMPTE</button></div></form>`);
    m.querySelector('#nxa-uform').addEventListener('submit', async e => {
      e.preventDefault(); const f = e.target, err = m.querySelector('#nxa-uerr'); if (!f.reportValidity()) return;
      const btn = f.querySelector('[type=submit]'); btn.disabled = true;
      // Application secondaire : crée le compte sans déconnecter l'administrateur.
      const second = firebase.initializeApp(KB_FIREBASE_CONFIG, 'nx-create-' + Date.now());
      try {
        const cred = await second.auth().createUserWithEmailAndPassword(f.email.value.trim(), f.password.value);
        await db.collection('staff').doc(cred.user.uid).set({name: f.name.value.trim(), email: f.email.value.trim(), role: f.role.value, createdAt: ts()});
        await second.auth().signOut(); toast('Utilisateur créé.'); closeModal();
      } catch (e2) { err.textContent = authError(e2); btn.disabled = false; }
      finally { second.delete().catch(() => {}); }
    });
  }

  // ---------- données en temps réel ----------
  function listen() {
    state.unsub.forEach(u => u()); state.unsub = [];
    const onErr = e => console.warn(e);
    state.unsub.push(db.collection('orders').orderBy('createdAt', 'desc').limit(500).onSnapshot(s => { state.orders = s.docs.map(d => ({id: d.id, ...d.data()})); refresh(); }, onErr));
    state.unsub.push(db.collection('products').onSnapshot(s => { state.products = s.docs.map(d => ({id: d.id, ...d.data()})); refresh(); }, onErr));
    state.unsub.push(db.collection('categories').onSnapshot(s => { state.categories = s.docs.map(d => ({id: d.id, ...d.data()})).sort((a, b) => (a.order ?? 999) - (b.order ?? 999)); refresh(); }, onErr));
    if (isAdmin()) state.unsub.push(db.collection('staff').onSnapshot(s => { state.staffList = s.docs.map(d => ({id: d.id, ...d.data()})); refresh(); }, onErr));
  }

  auth.onAuthStateChanged(async user => {
    state.unsub.forEach(u => u()); state.unsub = [];
    state.user = user; state.staff = null;
    if (!user || user.isAnonymous) { renderAuth(); return; }
    renderBoot('Vérification de votre accès…');
    let staffDoc = null;
    for (let i = 0; i < 4 && !staffDoc; i++) { try { const d = await db.collection('staff').doc(user.uid).get(); if (d.exists) staffDoc = d; } catch {} if (!staffDoc) await new Promise(r => setTimeout(r, 600)); }
    if (!staffDoc) {
      root.innerHTML = `<div class="nxa-auth"><div class="nxa-auth-card"><img src="../assets/logo-nexora.webp" alt="Nexora"><h1>Accès refusé</h1><p>Le compte ${esc(user.email)} n’a pas accès à l’administration. Demandez à un administrateur de vous ajouter.</p><button class="nxa-btn nxa-btn-dark" id="nxa-out">SE DÉCONNECTER</button></div></div>`;
      document.getElementById('nxa-out').addEventListener('click', () => auth.signOut()); return;
    }
    state.staff = staffDoc.data(); renderShell(); listen();
  });
})();
