# Nexora

Boutique en ligne Nexora : robes et pyjamas pour femme, livraison en Algérie, paiement à la livraison.

- Site : https://renolix.github.io/nexora/
- Administration : https://renolix.github.io/nexora/admin/

## Base de données

Projet Firebase `nstore-c699a` (Firestore + Authentication e-mail/mot de passe).

| Collection | Contenu |
|---|---|
| `products` | produits (nom, catégorie, prix, couleur, tailles, photos, stock, visible) |
| `categories` | catégories (nom, photo, ordre) — ajoutées automatiquement au menu, à l’accueil et à la boutique |
| `orders` | commandes clients (statuts : nouvelle, confirmée, expédiée, livrée, injoignable, retour, annulée) |
| `settings/shipping` | tarifs domicile / bureau des 58 wilayas |
| `staff` | comptes de l’équipe (rôle `admin` ou `employee`) |
| `meta/setup` | marque la création du premier administrateur |

Règles de sécurité : `firestore.rules` (déploiement : `firebase deploy --only firestore:rules`).

## Rôles

- **Administrateur** : tout (produits, catégories, livraison, utilisateurs, suppression).
- **Employé** : commandes (changement de statut) et produits (ajout/modification, sans suppression).

## Mode sombre

Bouton lune/soleil dans l’en-tête ; styles dans `nexora-dark.css`.

## Développement

`node scripts/serve.cjs` puis ouvrir http://127.0.0.1:4177
