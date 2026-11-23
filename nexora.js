// Nexora : identité, accueil, fiches produit (tailles et couleurs) et pages d'information.
// Chargé en dernier : remplace les gabarits hérités du thème d'origine.

// Coordonnées affichées sur le site. Laissez une valeur vide pour la masquer.
const NEXORA_CONTACT = {
  phone: '0553 94 49 41',
  whatsapp: '',   // ex. '213550000000' (format international, sans +)
  email: '',      // ex. 'contact@nexora.dz'
  instagram: ''   // ex. 'nexora.dz'
};


// Catégories (mêmes vignettes que Cosmoplus : assets/home/category-*.png)
cmCategories.splice(0, cmCategories.length, ['robes', 'ROBES', '/assets/home/category-robes.png?v=2'], ['pyjamas', 'PYJAMAS', '/assets/home/category-pyjamas.png?v=2']);
// Vignette de catégorie : chemin du site ou photo envoyée depuis l'admin (data URL)
const nxCatImg = img => img || '/assets/home/category-robes.png?v=2';
cmCatalogCategories = active => `<nav class="cm-category-rail cm-catalog-categories" aria-label="Catégories de produits">${cmCategories.map(([id, label, img]) => `<a href="${cmCollection(id)}" ${active === id ? 'aria-current="page"' : ''}><img src="${cpSafe(nxCatImg(img))}" alt="" loading="lazy"><span>${cpSafe(label)}</span></a>`).join('')}</nav>`;
const nxRobes = () => cpVisible().filter(p => p.category === 'robes');
const nxTel = () => NEXORA_CONTACT.phone.replace(/\s/g, '');

// En-tête Cosmoplus, logo texte « nexora »
shellHeader = function () {
  const original = cmBaseHeader();
  const commerce = original.slice(original.indexOf('<div class="drawer-overlay"'));
  return `<div class="cm-promo"><a href="/livraison-retours/"><strong>Livraison en Algérie</strong> à domicile et en bureau <span>· Voir les conditions</span></a><span class="cm-locale">FR&nbsp; | &nbsp;DA</span></div>
  <header class="site-header cm-header"><div class="cm-header-main">
    <button class="icon-button cm-menu" id="menu-toggle" aria-label="Ouvrir le menu">${svg('menu')}</button>
    <a class="cm-logo nx-logo" href="/" aria-label="Nexora, accueil"><img src="/assets/logo-nexora.webp" alt="Nexora" width="748" height="220"></a>
    <form class="header-search cm-search" id="header-search" role="search"><input name="q" type="search" placeholder="Rechercher dans toute la boutique…" aria-label="Rechercher un produit"><button aria-label="Rechercher">${svg('search')}</button></form>
    <div class="cm-header-actions"><button class="icon-button nx-theme-toggle" type="button" data-theme-toggle aria-label="Activer le mode sombre"><svg class="nx-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></svg><svg class="nx-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg></button><button class="icon-button cm-search-toggle" id="search-toggle" aria-label="Rechercher">${svg('search')}</button><button class="icon-button cm-wishlist-toggle" data-wishlist-toggle aria-label="Mes favoris">${cmHeart}<span class="cm-favorite-count" hidden></span></button><button class="icon-button bag-link" id="cart-toggle" aria-label="Ouvrir le panier">${svg('bag')}<span class="bag-count" data-cart-count>0</span></button><a class="icon-button cm-account" href="/profil/" aria-label="Mon compte">${cmAccount}</a></div>
  </div><nav class="main-nav cm-nav" id="main-nav" aria-label="Navigation principale"><a class="cm-nav-featured" href="/nouveautes/">Nouveautés</a>${CP_CATEGORIES.map(([id, label]) => `<a href="${cmCollection(id)}">${label}</a>`).join('')}<a href="/guide-tailles/">Guide des tailles</a><a href="/contact/">Contact</a><a href="${cmCollection()}">Tous les produits</a></nav>
  <form class="search-panel" id="search-form" role="search" hidden><label for="search-input">Rechercher un produit</label><div><input id="search-input" name="q" type="search" placeholder="Robe, couleur…"><button type="submit">RECHERCHER</button></div></form></header>${commerce}
  <dialog class="cm-wishlist" id="cm-wishlist"><div class="cm-dialog-heading"><h2>Mes favoris</h2><button class="icon-button" data-close-wishlist aria-label="Fermer les favoris">${svg('close')}</button></div><div id="cm-wishlist-items"></div></dialog>`;
};

// Carte produit Cosmoplus ; le bouton mène à la fiche pour choisir la taille
productCard = function (p) {
  const favorite = cmFavorites().includes(p.id), unavailable = KB_STOCK(p) === 0;
  return `<article class="product-card cm-product"><a href="${p.url}" class="card-image"><img src="${cpSafe(cpImage(p))}" alt="${cpSafe(p.name)}" loading="lazy" decoding="async"></a><div class="cm-price-row"><strong>${money(p.price)}</strong><button type="button" class="cm-favorite" data-favorite="${cpSafe(p.id)}" aria-label="Enregistrer ${cpSafe(p.name)} dans les favoris" aria-pressed="${favorite}">${cmHeart}</button></div><span class="cm-product-brand">${cpSafe(cpCat(p.category))} · ${cpSafe(p.color)}</span><a class="cm-product-name" href="${p.url}">${cpSafe(p.name)}</a><a class="cm-buy" href="${p.url}">${unavailable ? 'INDISPONIBLE' : 'AJOUTER AU PANIER'}</a></article>`;
};

// Accueil : même structure que Cosmoplus
homePage = function () {
  const all = cpVisible();
  const slides = [
    ['NOUVELLE COLLECTION', 'Gandouras', 'brodées', 'Robes d’intérieur & pyjamas', 'hero-nexora.jpg', cmCollection('robes'), '#f3ece6', '#f3ece6', 'Gandouras brodées fuchsia, bleu ciel et vert anis sur mannequins']
  ];
  return `<main class="cm-home"><section class="cm-hero" aria-label="À la une chez Nexora" aria-roledescription="carrousel">${slides.map(([eyebrow, title, big, subtitle, img, url, color, mobileColor, alt], i) => `<div class="hero-slide ${i ? 'cm-product-campaign' : 'active'}" data-slide="${i}" style="--hero-color:${color};--hero-mobile-color:${mobileColor}">${cmHeroImage(img, i, alt)}<div class="cm-hero-copy"><h${i ? '2' : '1'}>${eyebrow}</h${i ? '2' : '1'}><p>${title}<strong>${big}</strong></p><span>${subtitle}</span><a class="cm-button" href="${url}">DÉCOUVRIR</a><small>Livraison partout en Algérie · Prix en DA</small></div></div>`).join('')}<button class="cm-hero-arrow cm-prev" data-direction="-1" aria-label="Bannière précédente">${svg('chevron')}</button><button class="cm-hero-arrow cm-next" data-direction="1" aria-label="Bannière suivante">${svg('chevron')}</button></section><div class="cm-hero-dots">${slides.map((_, i) => `<button class="${i ? '' : 'active'}" data-go="${i}" aria-label="Afficher la bannière ${i + 1}"></button>`).join('')}<button class="cm-hero-pause" aria-label="Mettre le défilement en pause" aria-pressed="false">Ⅱ</button></div>
  <nav class="cm-category-rail cm-wrap" aria-label="Découvrir les catégories">${cmCategories.map(([id, label, img]) => `<a href="${cmCollection(id)}"><img src="${cpSafe(nxCatImg(img))}" alt="" loading="lazy"><span>${label}</span></a>`).join('')}</nav>
  <section class="cm-brand-section cm-wrap" id="marques"><h2>Votre boutique de robes et pyjamas</h2><div class="cm-featured-brands">${all.slice(0, 4).map(p => `<article><a href="${p.url}"><img src="${cpSafe(cpImage(p))}" alt="${cpSafe(p.name)}" loading="lazy"></a><h3>${cpSafe(p.color.toUpperCase())}</h3><a class="cm-button" href="${p.url}">DÉCOUVRIR</a></article>`).join('')}</div></section>
  ${cmEditorial([
    ['robes', 'Les gandouras brodées', 'Des broderies raffinées et des coupes amples pour être belle et à l’aise à la maison.', 'bloc-robes.webp', 'Robes'],
    ['pyjamas', 'Les pyjamas', 'Satin doux et finitions passepoilées : le confort élégant pour vos nuits.', 'bloc-pyjamas.webp', 'Pyjamas']
  ], false).replace('class="cm-editorials cm-wrap"', 'class="cm-editorials cm-wrap nx-editorials-two"')}
  ${cmProducts('Les tendances', all, 'cm-trending')}
  <section class="cm-routines cm-wrap nx-routines" aria-label="Nos engagements">${[
    ['#f6efe9', 'Nos finitions', 'Des broderies soignées, pièce par pièce', cmCollection('robes')],
    ['#eef3f9', 'Bien choisir', 'Votre taille du M au XXL, sans hésiter', '/guide-tailles/'],
    ['#f1f6e8', 'Commande facile', 'Payez à la livraison, partout en Algérie', '/livraison-retours/']
  ].map(([color, tag, title, url]) => `<a href="${url}" style="--routine-color:${color}"><div><span>${tag}</span><h2>${title}</h2><b>DÉCOUVRIR ${svg('arrow')}</b></div></a>`).join('')}</section>
  ${cmProducts('Notre sélection', all.slice().reverse(), 'cm-selection')}
  <section class="cm-service-strip"><div>${svg('pin')}<p><strong>Livraison en Algérie</strong><span>À domicile ou en bureau</span></p></div><div>${svg('bag')}<p><strong>Paiement à la livraison</strong><span>Prix en dinars algériens</span></p></div><div>${svg('user')}<p><strong>À votre écoute</strong>${NEXORA_CONTACT.phone ? `<a href="tel:${nxTel()}">${cpSafe(NEXORA_CONTACT.phone)}</a>` : '<a href="/contact/">Nous contacter</a>'}</p></div></section>
  </main><button class="cm-backtop" aria-label="Revenir en haut">⌃</button><a class="cm-contact-bubble" href="${NEXORA_CONTACT.whatsapp ? `https://wa.me/${cpSafe(NEXORA_CONTACT.whatsapp)}` : '/contact/'}" aria-label="Contacter Nexora"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 3h16a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-9l-6 4v-4H4a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z"/></svg></a>`;
};

// Pied de page Cosmoplus
shellFooter = function () {
  const c = NEXORA_CONTACT;
  const contact = [c.email && `<strong>E-mail</strong><a href="mailto:${cpSafe(c.email)}">${cpSafe(c.email)}</a>`, c.phone && `<strong>Téléphone</strong><a href="tel:${nxTel()}">${cpSafe(c.phone)}</a>`, c.instagram && `<strong>Instagram</strong><a href="https://instagram.com/${cpSafe(c.instagram)}">@${cpSafe(c.instagram)}</a>`].filter(Boolean).join('');
  return `<footer class="cm-footer"><div class="cm-wrap cm-footer-grid"><div class="cm-footer-brand"><a class="cm-logo nx-logo nx-logo-footer" href="/"><img src="/assets/logo-nexora.webp" alt="Nexora" width="748" height="220" loading="lazy"></a><span>Votre élégance, au quotidien.</span><div class="cm-brand-seal">NEXORA<br><small>ROBES · PYJAMAS</small></div></div><div class="cm-footer-links"><h2>Liens utiles</h2><a href="/a-propos/">À propos de nous</a><a href="/aide/">Questions fréquentes</a><a href="/guide-tailles/">Guide des tailles</a><a href="/conditions-generales-vente/">Conditions générales de vente</a><a href="/livraison-retours/">Livraison & retours</a><a href="/confidentialite/">Confidentialité</a><a href="/mentions-legales/">Mentions légales</a></div><div class="cm-footer-contact"><h2>Une question ? Contactez-nous</h2>${contact}<h2>Restons en contact</h2><p>Besoin d’un conseil pour votre taille ou votre commande ?</p><a class="cm-contact-link" href="/contact/">Écrivez à Nexora <span>→</span></a></div></div><div class="cm-wrap cm-footer-bottom"><span>© NEXORA ${new Date().getFullYear()} · Tous droits réservés.</span><span>PAIEMENT À LA LIVRAISON &nbsp;|&nbsp; DA</span></div></footer>`;
};

aboutPage = () => `<main class="cm-about-page"><section class="cm-about-hero"><img src="/assets/home/hero-nexora.jpg" alt="Collection Nexora"><div><h1>L’élégance au quotidien</h1><p>Nexora, vos robes brodées et pyjamas en Algérie.</p></div></section><section class="cm-wrap cm-about-story"><h2>Votre élégance, votre confort.</h2><p>Nexora réunit une sélection de gandouras et robes d’intérieur brodées, choisies pour la finesse de leurs broderies, la fluidité de leurs tissus et le confort de leurs coupes. Notre collection de pyjamas arrive très bientôt. Livraison partout en Algérie et paiement à la livraison.</p><a class="cm-button" href="${cmCollection()}">DÉCOUVRIR NOS PRODUITS</a></section></main>`;

// Fiche produit : tailles et couleurs
productPage = function (p) {
  const images = p.images?.length ? p.images : [p.cover], stock = KB_STOCK(p);
  const colors = nxRobes();
  return `<main class="cm-product-page cm-wrap nx-product-page">${cmBreadcrumb(p.name)}<div class="cm-detail-layout"><section class="cm-detail-gallery" aria-label="Photos du produit"><div class="cm-detail-thumbs">${images.map((src, index) => `<button class="thumb ${index ? '' : 'active'}" data-image="${index}" aria-label="Afficher la photo ${index + 1}"><img src="${cpSafe(src)}" alt="" loading="lazy"></button>`).join('')}</div><button class="cm-main-photo" id="cm-zoom-photo" aria-label="Agrandir la photo">${p.badge ? `<span class="nx-badge">${cpSafe(p.badge)}</span>` : ''}<img id="main-product-image" src="${cpSafe(images[0])}" alt="${cpSafe(p.name)}"><span>＋ Agrandir</span></button></section><section class="cm-detail-info"><a class="cm-detail-brand" href="${cmCollection(p.category)}">NEXORA · ${cpSafe(cpCat(p.category))}</a><h1>${cpSafe(p.name)}</h1><p class="cm-reference">Référence : ${cpSafe(p.id.toUpperCase())}</p><div class="cm-detail-price">${money(p.price)}${p.oldPrice ? ` <s class="nx-old">${money(p.oldPrice)}</s>` : ''}</div><p class="cm-stock ${stock === 0 ? 'is-out' : ''}">${stock === 0 ? 'Actuellement indisponible' : stock !== null ? `${stock} en stock` : 'En stock · expédition rapide'}</p><p class="cm-detail-description">${cpSafe(p.description)}</p>
  <div class="nx-option"><div class="nx-option-head">Couleur : <strong>${cpSafe(p.color)}</strong></div><div class="nx-swatches">${colors.map(c => `<a href="${c.url}" class="nx-swatch ${c.id === p.id ? 'is-active' : ''}" style="--sw:${c.swatch}" title="${cpSafe(c.color)} — ${cpSafe(c.name)}" aria-label="${cpSafe(c.color)}" ${c.id === p.id ? 'aria-current="true"' : ''}></a>`).join('')}</div></div>
  <div class="nx-option"><div class="nx-option-head">Taille : <strong id="selected-size">choisissez votre taille</strong><a href="/guide-tailles/">Guide des tailles</a></div><div class="nx-size-options">${p.sizes.map(size => `<button type="button" data-size="${size}" aria-pressed="false">${size}</button>`).join('')}</div><p class="field-error" id="size-error" role="alert"></p></div>
  <div class="cm-purchase"><div class="qty-control"><button type="button" data-qty="minus" aria-label="Diminuer la quantité">−</button><span id="product-qty">1</span><button type="button" data-qty="plus" aria-label="Augmenter la quantité">+</button></div><button class="cm-button cm-add-detail" id="add-cart" ${stock === 0 ? 'disabled' : ''}>${stock === 0 ? 'INDISPONIBLE' : `AJOUTER AU PANIER ${svg('bag')}`}</button></div><button class="cm-detail-favorite" data-favorite="${cpSafe(p.id)}" aria-pressed="${cmFavorites().includes(p.id)}">${cmHeart}<span>Ajouter à mes favoris</span></button><div class="cm-delivery-info"><p>${svg('pin')}<span><strong>Livraison dans les 58 wilayas</strong>À domicile ou au bureau, tarif selon votre wilaya.</span></p><p>${svg('bag')}<span><strong>Paiement à la livraison</strong>Vous payez en dinars algériens à la réception.</span></p><p>${svg('check')}<span><strong>Échange de taille</strong>Contactez-nous dès réception si la taille ne convient pas.</span></p></div></section></div><section class="cm-product-description" id="description-produit"><details open><summary>Description</summary><p>${cpSafe(p.description)}</p></details><details open><summary>Caractéristiques</summary><p>${cpSafe(p.details || '')}<br>Couleur : ${cpSafe(p.color)}<br>Tailles disponibles : ${p.sizes.join(', ')}</p></details><details><summary>Livraison et échanges</summary><p>Les frais de livraison sont calculés selon votre wilaya lors de la commande. <a href="/livraison-retours/">Consulter les informations de livraison.</a></p></details></section>${cmProducts('Vous aimerez aussi', cpVisible().filter(x => x.id !== p.id && x.category === p.category).slice(0, 8), 'cm-related')}<dialog class="cm-photo-dialog" id="cm-photo-dialog"><button class="icon-button" data-close-photo aria-label="Fermer la photo">${svg('close')}</button><img src="${cpSafe(images[0])}" alt="${cpSafe(p.name)}"></dialog></main>`;
};
setupProduct = function (p) {
  let quantity = 1, selected = null; const limit = KB_STOCK(p) === null ? 99 : KB_STOCK(p);
  const images = p.images?.length ? p.images : [p.cover];
  document.querySelectorAll('[data-image]').forEach(button => button.addEventListener('click', () => { const src = link(images[Number(button.dataset.image)]); document.querySelector('#main-product-image').src = src; document.querySelector('#cm-photo-dialog img').src = src; document.querySelectorAll('.thumb').forEach(node => node.classList.toggle('active', node === button)); }));
  document.querySelectorAll('[data-size]').forEach(button => button.addEventListener('click', () => { selected = button.dataset.size; document.querySelectorAll('[data-size]').forEach(el => el.setAttribute('aria-pressed', String(el === button))); document.querySelector('#selected-size').textContent = selected; document.querySelector('#size-error').textContent = ''; }));
  document.querySelectorAll('[data-qty]').forEach(button => button.addEventListener('click', () => { quantity = Math.max(1, Math.min(limit, quantity + (button.dataset.qty === 'plus' ? 1 : -1))); document.querySelector('#product-qty').textContent = quantity; }));
  document.querySelector('#add-cart')?.addEventListener('click', () => { if (limit === 0) return; if (!selected) { document.querySelector('#size-error').textContent = 'Veuillez choisir une taille.'; document.querySelector('.nx-size-options')?.classList.add('nx-shake'); setTimeout(() => document.querySelector('.nx-size-options')?.classList.remove('nx-shake'), 500); return; } saveCart([...cartItems(), {id: p.id, size: selected, quantity}]); updateCount(); renderDrawer(); document.querySelector('#cart-toggle').click(); });
  document.querySelector('#cm-zoom-photo')?.addEventListener('click', () => document.querySelector('#cm-photo-dialog').showModal());
  document.querySelector('[data-close-photo]')?.addEventListener('click', () => document.querySelector('#cm-photo-dialog').close());
};

// Panier (avec taille et couleur)
cartPage = function () {
  const items = cartItems();
  if (!items.length) return `<main class="cm-wrap cm-cart-page">${cmBreadcrumb('Panier')}<h1 class="cm-page-title">Mon panier</h1><div class="empty-state">${svg('bag')}<h2>Votre panier est vide</h2><p>Découvrez nos robes brodées et trouvez votre prochaine pièce préférée.</p><a class="cm-button" href="${cmCollection()}">CONTINUER MES ACHATS</a></div></main>`;
  return `<main class="cm-wrap cm-cart-page">${cmBreadcrumb('Panier')}<h1 class="cm-page-title">Mon panier</h1><div class="cm-cart-layout"><section><table class="cm-cart-table"><thead><tr><th>Article</th><th>Prix</th><th>Quantité</th><th>Sous-total</th></tr></thead><tbody>${items.map(item => { const p = byId(item.id); return `<tr><td><div class="cm-cart-product"><a href="${p.url}"><img src="${cpSafe(cpImage(p))}" alt="${cpSafe(p.name)}"></a><div><span>NEXORA</span><a href="${p.url}">${cpSafe(p.name)}</a><small class="nx-variant"><i class="nx-dot" style="background:${p.swatch}"></i>${cpSafe(p.color)} · Taille ${cpSafe(item.size)}</small><button class="remove-link" data-cart-remove="${p.id}" data-size="${cpSafe(item.size)}">Supprimer</button></div></div></td><td data-label="Prix">${money(p.price)}</td><td data-label="Quantité"><div class="qty-control"><button data-cart-change="minus" data-id="${p.id}" data-size="${cpSafe(item.size)}" aria-label="Diminuer la quantité">−</button><span>${item.quantity}</span><button data-cart-change="plus" data-id="${p.id}" data-size="${cpSafe(item.size)}" aria-label="Augmenter la quantité">+</button></div></td><td data-label="Sous-total"><strong>${money(p.price * item.quantity)}</strong></td></tr>`; }).join('')}</tbody></table><a class="cm-continue" href="${cmCollection()}">← Continuer mes achats</a></section><aside class="cm-cart-summary"><h2>Récapitulatif</h2><details><summary>Estimer la livraison</summary><label>Wilaya<select id="cm-cart-wilaya"><option value="">Choisir une wilaya</option>${SHIPPING_WILAYAS.map((w, i) => `<option value="${i}">${String(i + 1).padStart(2, '0')} · ${cpSafe(w.name)}</option>`).join('')}</select></label><label>Mode<select id="cm-cart-delivery"><option value="home">À domicile</option><option value="desk">Au bureau</option></select></label></details><div><span>Articles (${cartCount()})</span><strong>${money(cartTotal())}</strong></div><div><span>Livraison estimée</span><span id="cm-cart-shipping">À calculer</span></div><div class="cm-cart-grand"><span>Total estimé</span><strong id="cm-cart-total">${money(cartTotal())}</strong></div><a class="cm-button" href="/commande/">PASSER COMMANDE</a><p>Paiement à la livraison</p></aside></div></main>`;
};
renderDrawer = function () {
  const items = cartItems();
  document.querySelector('#drawer-body').innerHTML = items.length ? items.map(item => { const p = byId(item.id); return `<article class="drawer-item"><img src="${cpSafe(link(cpImage(p)))}" alt="${cpSafe(p.name)}"><div><a href="${link(p.url)}">${cpSafe(p.name)}</a><p>${cpSafe(p.color)} · Taille ${cpSafe(item.size)} · Qté ${item.quantity}</p><strong>${money(p.price * item.quantity)}</strong></div></article>`; }).join('') : `<div class="drawer-empty">${svg('bag')}<h3>VOTRE PANIER EST VIDE</h3><a href="${link(CP_COLLECTION)}">VOIR LA COLLECTION</a></div>`;
  document.querySelector('#drawer-total').textContent = money(cartTotal());
  document.querySelector('.drawer-foot').style.display = items.length ? 'block' : 'none';
};

// Pages d'information
// Coordonnées affichées sur la page Contact (les champs vides sont masqués).
function nxContactLinks() {
  const c = NEXORA_CONTACT, tel = nxTel();
  return [
    c.phone && `<a href="tel:${tel}"><small>Téléphone</small><strong>${cpSafe(c.phone)}</strong><span>Nous appeler →</span></a>`,
    c.whatsapp && `<a href="https://wa.me/${cpSafe(c.whatsapp)}" target="_blank" rel="noopener"><small>WhatsApp</small><strong>${cpSafe(c.phone || c.whatsapp)}</strong><span>Écrire sur WhatsApp →</span></a>`,
    c.email && `<a href="mailto:${cpSafe(c.email)}"><small>E-mail</small><strong>${cpSafe(c.email)}</strong><span>Nous écrire →</span></a>`,
    c.instagram && `<a href="https://instagram.com/${cpSafe(c.instagram)}" target="_blank" rel="noopener"><small>Instagram</small><strong>@${cpSafe(c.instagram)}</strong><span>Voir nos nouveautés →</span></a>`
  ].filter(Boolean);
}
contactPage = () => `<main class="cm-wrap cm-contact-page">${cmBreadcrumb('Contact')}<h1 class="cm-page-title">Contactez-nous</h1><p class="cm-page-subtitle">Une question sur une taille, une couleur ou votre commande ? Nous vous répondons avec plaisir.</p><div class="cm-contact-grid"><section><h2>Service client Nexora</h2><p>Appelez-nous pour passer commande, demander un conseil de taille ou suivre votre livraison.</p>${nxContactLinks().join('')}</section><aside><h2>Comment pouvons-nous vous aider ?</h2><a href="/aide/">Questions fréquentes <span>→</span></a><a href="/guide-tailles/">Guide des tailles <span>→</span></a><a href="/livraison-retours/">Livraison et retours <span>→</span></a><a href="/panier/">Mon panier <span>→</span></a></aside></div></main>`;
helpPage = () => `<main class="section-wrap extra-page info-page">${pageIntro('INFORMATIONS', 'AIDE & COMMANDE', 'Les réponses essentielles pour commander en toute sérénité.')}<div class="faq-list"><details open><summary>Comment commander ?</summary><p>Choisissez votre robe, sélectionnez votre taille puis ajoutez-la au panier. Validez ensuite votre commande en indiquant votre nom, votre téléphone, votre wilaya et votre commune. Notre équipe vous appelle pour confirmer.</p></details><details><summary>Comment choisir ma taille ?</summary><p>Nos modèles existent du M au XXL, en coupe ample. Consultez notre <a href="/guide-tailles/">guide des tailles</a>. En cas de doute, prenez la taille au-dessus.</p></details><details><summary>Comment se passe le paiement ?</summary><p>Le paiement se fait à la livraison, en espèces et en dinars algériens.</p></details><details><summary>Quels sont les délais et frais de livraison ?</summary><p>Nous livrons dans les 58 wilayas, à domicile ou au bureau. Les frais s’affichent automatiquement selon votre wilaya au moment de la commande.</p></details><details><summary>Puis-je échanger ma taille ?</summary><p>Oui. Contactez-nous dès la réception si la taille ne vous convient pas ; l’article doit être non porté et dans son état d’origine.</p></details><details><summary>Quand arrivent les pyjamas ?</summary><p>Notre collection de pyjamas est en préparation et sera disponible très prochainement.</p></details></div></main>`;
guidePage = () => `<main class="section-wrap extra-page info-page nx-guide">${pageIntro('BIEN CHOISIR', 'GUIDE DES TAILLES', 'Nos gandouras ont une coupe ample. Comparez vos mesures avec ce tableau indicatif.')}<div class="nx-guide-table"><table><thead><tr><th>Taille</th><th>Équivalence</th><th>Tour de poitrine</th><th>Tour de hanches</th></tr></thead><tbody><tr><th>M</th><td>38 – 40</td><td>88 – 96 cm</td><td>96 – 104 cm</td></tr><tr><th>L</th><td>42 – 44</td><td>96 – 104 cm</td><td>104 – 112 cm</td></tr><tr><th>XL</th><td>46 – 48</td><td>104 – 112 cm</td><td>112 – 120 cm</td></tr><tr><th>XXL</th><td>50 – 52</td><td>112 – 122 cm</td><td>120 – 130 cm</td></tr></tbody></table></div><div class="nx-guide-steps"><article><span>01</span><h3>Tour de poitrine</h3><p>Mesurez horizontalement à l’endroit le plus fort de la poitrine.</p></article><article><span>02</span><h3>Tour de hanches</h3><p>Mesurez à l’endroit le plus large du bassin, pieds joints.</p></article><article><span>03</span><h3>Entre deux tailles ?</h3><p>Choisissez la taille au-dessus pour plus d’aisance.</p></article></div><p class="nx-guide-note">Mesures indicatives. Pour un conseil personnalisé, <a href="/contact/">contactez-nous</a>.</p></main>`;
profilePage = () => `<main class="cm-wrap cm-account-page">${cmBreadcrumb('Mon compte')}<h1 class="cm-page-title">Mon compte</h1><p class="cm-page-subtitle">Retrouvez vos favoris et votre panier.</p><div class="cm-account-grid"><section><h2>Ma sélection</h2><p>Vos pièces préférées et votre panier sont à portée de main.</p><button class="cm-button" data-open-account-favorites>MES FAVORIS</button><a class="cm-account-link" href="/panier/">Mon panier (${cartCount()}) →</a></section><section><h2>Besoin d’aide ?</h2><p>Une question sur une taille, une couleur ou votre commande ?</p><a class="cm-button" href="/contact/">CONTACTEZ-NOUS</a><a class="cm-account-link" href="/aide/">Questions fréquentes →</a></section></div></main>`;
thanksPage = () => { const ref = new URLSearchParams(location.search).get('ref') || ''; return `<main class="section-wrap simple-page thanks-page"><div class="thanks-mark">${svg('check')}</div><span class="kicker">NEXORA</span><h1>Merci pour votre commande</h1><p>Votre commande a bien été enregistrée. Notre équipe vous appelle très prochainement pour la confirmer.</p>${ref ? `<div class="thanks-reference"><span>RÉFÉRENCE</span><strong>${cpSafe(ref)}</strong></div>` : ''}<div class="thanks-actions"><a class="button button-dark" href="${CP_COLLECTION}">CONTINUER MES ACHATS</a></div></main>`; };
notFoundPage = () => `<main class="cm-wrap cm-cart-page">${cmBreadcrumb('Page introuvable')}<div class="empty-state"><h1 class="cm-page-title">Cette page est introuvable</h1><p>Retrouvez nos robes brodées dans la boutique.</p><a class="cm-button" href="${cmCollection()}">DÉCOUVRIR LA BOUTIQUE</a></div></main>`;

// Textes légaux
Object.assign(CP_LEGAL, {
  notices: ['Mentions légales', 'NEXORA exploite cette boutique en ligne de robes et pyjamas pour femme. Les informations relatives à l’immatriculation, au siège social et à l’hébergeur seront complétées par le propriétaire.'],
  terms: ['Conditions générales de vente', 'Les prix sont affichés en dinars algériens (DA), toutes taxes comprises. Le paiement s’effectue à la livraison. Le montant total, incluant les frais de livraison affichés avant confirmation, est enregistré avec la commande. Nexora contacte la cliente par téléphone pour confirmer chaque commande avant expédition.'],
  use: ['Conditions d’utilisation', 'Le contenu de ce site (photos, textes, logo) est la propriété de Nexora. Toute reproduction sans autorisation est interdite.'],
  privacy: ['Confidentialité', 'Les informations saisies lors de la commande (nom, téléphone, adresse) servent uniquement à traiter la commande et à organiser la livraison. Elles ne sont jamais revendues. Le panier est conservé dans votre navigateur.'],
  cookies: ['Cookies', 'Le site utilise uniquement le stockage local nécessaire au panier et aux favoris, ainsi que les données techniques nécessaires au passage de commande. Aucun suivi publicitaire n’est chargé.'],
  delivery: ['Livraison et échanges', 'Nexora livre dans les 58 wilayas, à domicile ou au bureau selon disponibilité. Les frais sont affichés pendant la commande selon la wilaya choisie. Le paiement se fait à la réception. Un échange de taille est possible : contactez-nous dès réception, l’article doit être non porté et dans son état d’origine.']
});
legalPage = function () { const [title, text] = CP_LEGAL[document.body.dataset.legal] || CP_LEGAL.use; return `<main class="section-wrap extra-page info-page"><div class="page-intro"><span>NEXORA</span><h1>${title}</h1><p>${text}</p></div><p><a href="/contact/">Nous contacter</a></p></main>`; };

// Titre de l'onglet
window.addEventListener('kb:render', () => {
  const page = document.body.dataset.page;
  if (page === 'product') { const p = byId(new URLSearchParams(location.search).get('id') || document.body.dataset.productId); if (p) document.title = `${p.name} | Nexora`; }
  if (['collection', 'category'].includes(page)) { const c = new URLSearchParams(location.search).get('categorie'); document.title = `${c ? cpCat(c) : 'Toute la boutique'} | Nexora`; }
});

// Applique le catalogue en cache (produits et catégories de l'admin) avant le premier affichage.
try { nxApplyCatalog(JSON.parse(localStorage.getItem(NX_CACHE_KEY) || 'null')); } catch {}

// Mode sombre : bouton dans l'en-tête, choix mémorisé dans le navigateur.
function nxSetTheme(theme) {
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem('nexora-theme', theme); } catch {}
  document.querySelectorAll('[data-theme-toggle]').forEach(b => b.setAttribute('aria-label', theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'));
}
document.addEventListener('click', event => {
  if (!event.target.closest('[data-theme-toggle]')) return;
  nxSetTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
});
window.addEventListener('kb:render', () => nxSetTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'));
