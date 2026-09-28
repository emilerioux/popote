# Popote

Planning des soupers de la semaine, banque de recettes et liste d'épicerie générée
automatiquement (quantités additionnées, classées par rayon). PWA hors ligne,
synchronisable à deux via Firebase (plan gratuit).

## Structure

| Fichier | Rôle |
| --- | --- |
| `js/data.js` | Dates, lecture des lignes d'ingrédients, rayons, calcul de l'épicerie, recettes de départ |
| `js/store.js` | État (localStorage `pp-state`), une modification = une clé |
| `js/sync.js` | Foyer partagé Firestore (`foyers/{code}`), mises à jour champ par champ |
| `js/ui.js` | Feuille du bas glissable (ressorts) et toasts |
| `js/motion.js` | Ressorts, momentum, élastique (repris de Reps) |
| `js/app.js` | Les trois onglets et leurs feuilles |

## Activer le partage (une seule fois)

1. (Fait le 2026-09-27, projet `popote-62a15`.) <https://console.firebase.google.com> → **Ajouter un projet** (nom : `popote`, Analytics désactivé).
2. **Créer → Firestore Database → Créer une base de données**, emplacement `northamerica-northeast1` (Montréal), mode **production**.
3. Onglet **Règles** : coller le contenu de `firestore.rules`, **Publier**.
4. **Paramètres du projet → Général → Vos applications → `</>` (Web)**, nom `popote`, pas de Hosting.
   Copier l'objet `firebaseConfig` dans `firebase-config.js`.
5. Bumper `VERSION` dans `sw.js`, commit, push.
6. Dans l'app : pastille « Solo » → **Créer un foyer partagé** → **Inviter quelqu'un**.

Le plan gratuit (Spark) ne demande pas de carte de crédit et ne peut pas facturer :
50 000 lectures et 20 000 écritures par jour, largement assez pour deux personnes.

## Déploiement

GitHub Pages sur `main`. **Bumper `VERSION` dans `sw.js` à chaque déploiement.**
