// Catalogue Nexora. Pour modifier un prix, une taille ou ajouter un produit, éditez ce fichier.
// category : 'robes' ou 'pyjamas'. Prix en dinars algériens (DA). stock : null = disponible.
(() => {
  const SIZES = ['M', 'L', 'XL', 'XXL'];
  const items = [
    {
      id: 'gandoura-bleu-ciel', name: 'Gandoura brodée Bleu ciel', category: 'robes', price: 4200,
      color: 'Bleu ciel', swatch: '#6faee6', images: ['robe-bleu-ciel'],
      description: 'Gandoura bleu ciel à encolure carrée, ornée d’un plastron brodé aux fils dorés, fleurs roses et motif framboise. Manches trois-quarts finies par une broderie assortie.',
      details: 'Encolure carrée · Broderie plastron et manches · Coupe évasée · Longueur maxi'
    },
    {
      id: 'gandoura-fuchsia', name: 'Gandoura brodée Fuchsia', category: 'robes', price: 4200,
      color: 'Fuchsia', swatch: '#c0137e', images: ['robe-fuchsia'],
      description: 'Gandoura fuchsia au col fendu bordé de passementerie, avec une broderie florale dorée, verte et rose. Les manches reprennent le motif brodé.',
      details: 'Col fendu brodé · Broderie florale · Coupe évasée · Longueur maxi'
    },
    {
      id: 'gandoura-vert-anis', name: 'Gandoura brodée Vert anis', category: 'robes', price: 4200,
      color: 'Vert anis', swatch: '#9fd42a', images: ['robe-vert-anis'],
      description: 'Gandoura vert anis au plastron brodé en forme de feuille, dans des tons verts et dorés, rehaussé de perles. Manches trois-quarts brodées.',
      details: 'Broderie feuille et perles · Manches brodées · Coupe évasée · Longueur maxi'
    }
  ];
  window.NEXORA_SIZES = SIZES;
  window.COSMOPLUS_CATALOG = items.map(p => {
    const images = p.images.map(name => `/assets/produits/${name}.jpg`);
    return {
      ...p, short: p.name, brand: 'Nexora', sizes: SIZES, stock: null, active: true,
      images, cover: images[0], url: `/produit/?id=${p.id}`,
      _source: {name: p.name, short: p.name, description: p.description, details: p.details, color: p.color}
    };
  });
})();
