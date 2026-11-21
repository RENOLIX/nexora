# Nexora

Boutique en ligne Nexora : robes brodées et pyjamas pour femme, livraison en Algérie, paiement à la livraison.

Site : https://renolix.github.io/nexora/

## Modifier les produits

Tout le catalogue est dans `nexora-catalog.js` (3 robes pour l’instant) : nom, catégorie (`robes` ou `pyjamas`), prix en DA, couleur, tailles et photos (`assets/produits/`).



## Coordonnées

Renseignez le téléphone, WhatsApp, e-mail et Instagram en haut de `nexora.js` (objet `NEXORA_CONTACT`). Les champs vides sont masqués.

## Commandes

Les commandes sont enregistrées dans Firebase (collection `orders`, champ `store: "nexora"`).

## Développement

`node scripts/serve.cjs` puis ouvrir http://127.0.0.1:4177
