// Catalogue Nexora. Pour modifier un prix, une taille ou ajouter un produit, éditez ce fichier.
// category : 'robes' ou 'pyjamas'. Prix en dinars algériens (DA). stock : null = disponible.
(() => {
  const SIZES = ['M', 'L', 'XL', 'XXL'];
  const items = [
    {
      id: 'gandoura-rubis', name: 'Gandoura brodée Rubis', category: 'robes', price: 4200, oldPrice: 4900,
      color: 'Framboise', swatch: '#a3214f', images: ['rubis-1', 'rubis-2'], badge: 'Best-seller',
      description: 'Gandoura longue et fluide couleur framboise, ornée d’un plastron brodé aux motifs floraux rose et argent. Manches mi-longues finies par un galon brodé. Une pièce élégante pour la maison comme pour recevoir.',
      details: 'Coupe ample et confortable · Broderie plastron et manches · Tissu crêpe fluide · Longueur maxi'
    },
    {
      id: 'gandoura-fuchsia-col-v', name: 'Gandoura col V Fuchsia', category: 'robes', price: 3900,
      color: 'Fuchsia', swatch: '#c2279b', images: ['fuchsia-1', 'fuchsia-2'], badge: 'Nouveau',
      description: 'Gandoura fuchsia au col V souligné de passementerie, avec une broderie florale dorée, verte et lilas. Les manches reprennent le motif brodé pour un ensemble harmonieux.',
      details: 'Col V avec cordon décoratif · Broderie florale · Tissu crêpe fluide · Longueur maxi'
    },
    {
      id: 'gandoura-bleu-ciel', name: 'Gandoura brodée Bleu ciel', category: 'robes', price: 4200,
      color: 'Bleu ciel', swatch: '#8fbfe7', images: ['ciel-1', 'ciel-2'],
      description: 'Gandoura bleu ciel au plastron richement brodé de fils dorés et de perles framboise, rehaussé de petites fleurs. Douce, légère et lumineuse.',
      details: 'Broderie dorée et perles · Finitions brodées aux manches · Tissu crêpe fluide · Longueur maxi'
    },
    {
      id: 'gandoura-bleu-roi', name: 'Gandoura brodée Bleu roi', category: 'robes', price: 4500,
      color: 'Bleu roi', swatch: '#2130b5', images: ['roi-1', 'roi-2'], badge: 'Coup de cœur',
      description: 'Gandoura bleu roi au plastron brodé de feuillages vert anis, de fleurs bleues et de tiges rouges. Une couleur intense et une broderie généreuse, reprise sur les manches.',
      details: 'Broderie florale multicolore · Strass discrets · Tissu crêpe fluide · Longueur maxi'
    },
    {
      id: 'gandoura-anis', name: 'Gandoura Feuille d’or Anis', category: 'robes', price: 3900,
      color: 'Vert anis', swatch: '#a9cd3d', images: ['anis-1'],
      description: 'Gandoura vert anis au plastron brodé en forme de feuille, dans des tons dorés, bleus et verts, parsemé de perles. Une couleur fraîche et pleine de peps.',
      details: 'Broderie feuille et perles · Galon brodé aux manches · Tissu crêpe fluide · Longueur maxi'
    },
    {
      id: 'gandoura-rose-prune', name: 'Gandoura ton sur ton Rose prune', category: 'robes', price: 4200,
      color: 'Rose prune', swatch: '#b23a6f', images: ['prune-1'],
      description: 'Gandoura rose prune à la broderie ton sur ton raffinée, sertie de petites perles dorées. Une élégance discrète pour toutes les occasions.',
      details: 'Broderie ton sur ton · Perles dorées · Manches brodées · Tissu crêpe fluide'
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
