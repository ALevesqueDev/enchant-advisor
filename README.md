# Enchant Advisor

Un conseiller d'enchantements pour Minecraft Java Edition. Tu lui dis quel
objet tu as, ce qui est déjà enchanté dessus, et ce que tu essaies de faire
avec — il te recommande quoi ajouter, calcule le coût à l'enclume, et simule
les vraies probabilités d'obtenir un enchantement précis à un niveau précis.

**🔗 Essaie-le : https://enchant-advisor.vercel.app**

## Table des matières

- [Ce que ça fait](#ce-que-ca-fait)
- [Pourquoi cette app existe](#pourquoi)
- [Captures d'écran](#captures)
- [Technologies](#technologies)
- [Licence](#licence)
- [Pour les mainteneurs](#mainteneurs)

<a id="ce-que-ca-fait"></a>

## Ce que ça fait

- **Conseiller** — choisis un objet et un objectif (minage, PvP, ferme à
  mobs, exploration…), l'app te montre les enchantements qui valent encore
  la peine d'être ajoutés, avec le coût en niveaux d'XP à l'enclume pour y
  arriver.
- **Recherche d'enchantement** — choisis un enchantement cible et un niveau ;
  pour tout ce qui peut sortir de la table d'enchantement, une simulation
  Monte-Carlo du vrai algorithme du jeu trouve le meilleur matériau et le
  meilleur emplacement de table (en tenant compte de ton nombre réel
  d'étagères). Pour les enchantements trésor (Mending et compagnie, que la
  table ne peut jamais produire), elle calcule plutôt les vraies probabilités
  de pêche et de commerce chez un villageois.
- **Meilleure méthode** — au lieu de comparer les probabilités à l'œil entre
  la table, le commerce et la pêche, l'app classe directement les méthodes
  par nombre de tentatives moyen nécessaire, avec un avertissement honnête :
  une tentative ne coûte pas la même chose partout (niveaux d'XP, émeraudes,
  ou juste du temps).
- **Bilingue partout** — pas juste l'interface : les vrais noms d'objets et
  d'enchantements viennent directement des fichiers de langue du jeu, pas
  d'une traduction maison.
- **Liens partageables** — toute ta sélection (objet, matériau, objectif,
  enchantements déjà en place, ou une recherche) est encodée dans le lien —
  aucun compte, aucun serveur, juste colle le lien à quelqu'un d'autre.
- **Fonctionne hors-ligne** — installable comme une app (PWA), avec un vrai
  cache hors-ligne, pas juste la case « installable » cochée.
- **Fiable par conception** — les chiffres sont épinglés à une version précise
  de Minecraft et re-vérifiés automatiquement contre les données générées du
  jeu lui-même, pas contre une page de wiki (voir [`PROJECT.md`](PROJECT.md)
  pour pourquoi cette distinction a eu de l'importance en pratique).

<a id="pourquoi"></a>

## Pourquoi cette app existe

La plupart des calculateurs d'enchantement partent de « qu'est-ce que tu veux
obtenir au final » et calculent le travail d'enclume à rebours à partir d'une
liste que tu as déjà choisie toi-même. Celui-ci part plutôt de ce qui est
*déjà* sur l'objet et de ce que tu essaies d'en faire, et calcule la
différence — plus proche d'un conseil que d'une calculatrice.

<a id="captures"></a>

## Captures d'écran

*(Pas encore de vraies captures d'écran ici — je n'avais pas de navigateur
connecté pour en prendre pendant cette session. Le plus simple : ajoute les
tiennes directement dans `docs/screenshots/` et un lien ici, ou redemande
avec un navigateur connecté et je m'en occupe.)*

<a id="technologies"></a>

## Technologies

Next.js (App Router) + TypeScript + Tailwind, entièrement côté client — pas
de backend, pas de base de données, pas de comptes. Déployé sur Vercel. Les
données du jeu vivent dans des fichiers JSON versionnés (`src/lib/*.json`),
vérifiées chaque semaine contre
[misode/mcmeta](https://github.com/misode/mcmeta) par un petit script et une
GitHub Action, et chaque push/PR fait tourner lint + tests + build
automatiquement — voir [`PROJECT.md`](PROJECT.md) pour toutes les notes de
conception, les sources, et la feuille de route.

<a id="licence"></a>

## Licence

Ce code source est public à titre de transparence, pas pour être réutilisé —
voir [`LICENSE`](LICENSE). Tous droits réservés. Un bug ou une suggestion ?
[Ouvre une issue](https://github.com/ALevesqueDev/enchant-advisor/issues/new).

---

<a id="mainteneurs"></a>

<details>
<summary>Pour les mainteneurs : lancer le projet en local</summary>

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de production
npm run lint
npm run test     # Vitest — les modules de logique pure (recommend, anvil, table odds, share links)
node scripts/check-game-version.mjs   # vérification manuelle de fraîcheur des données
```

</details>
