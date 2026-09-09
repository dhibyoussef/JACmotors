# JAC Motors Tunisie

JAC Motors Tunisie est une vitrine automobile en français pour présenter les pickups JAC T8 et T8 PRO, guider les visiteurs vers les showrooms, afficher des avis clients et permettre de réserver un entretien. Le site est volontairement léger et rapide : il fonctionne comme une application React côté navigateur, sans compte utilisateur ni serveur obligatoire.

## Objectif du projet

Le site transforme la présence locale de JAC Motors en une expérience digitale claire. Un visiteur peut découvrir les modèles, consulter leurs photos et caractéristiques, trouver un showroom tunisien, lire les avis disponibles et créer un ticket de rendez-vous pour un entretien. Les informations techniques sont présentées comme indicatives lorsqu’elles viennent des sites officiels JAC et la configuration exacte en Tunisie doit toujours être confirmée auprès du concessionnaire.

## Technologies publiques utilisées

Le projet utilise **React 19** pour construire les interfaces et gérer les composants, **TypeScript** pour sécuriser le code avec des types, **Vite 8** pour le serveur de développement et la génération du site, et **React Router** pour la navigation entre les pages sans rechargement complet. Les styles sont écrits en CSS classique dans `src/styles.css`, avec des variables de design pour les couleurs, les polices, les espacements et les animations. Aucune base de données, aucun compte utilisateur et aucun service d’analyse n’est requis pour lancer la version actuelle.

## Installation et lancement

Il faut installer Node.js sur la machine, ouvrir un terminal dans le dossier du projet, puis lancer :

```bash
npm install
npm run dev
```

Vite démarre alors le serveur local et affiche l’adresse du site dans le terminal. Pour créer une version optimisée destinée à la production, utiliser :

```bash
npm run build
```

La commande de production vérifie d’abord TypeScript puis génère les fichiers optimisés dans le dossier `dist`. Pour tester ce dossier localement, utiliser :

```bash
npm run preview
```

## Commandes disponibles

- `npm run dev` démarre le serveur Vite avec rechargement automatique.
- `npm run build` vérifie le typage et crée la version de production.
- `npm run preview` sert la version construite afin de la tester comme un site publié.

## Organisation des dossiers

`src/main.tsx` est le point d’entrée React. Il monte l’application dans l’élément HTML `#root` et charge la feuille de style globale.

`src/App.tsx` contient le routeur principal. Il associe chaque URL à une page et redirige les adresses inconnues vers l’accueil.

`src/components/Layout.tsx` contient la structure commune du site : navigation fixe, menu mobile, lien d’accessibilité pour aller directement au contenu, pied de page, titres de pages et liens téléphoniques.

`src/pages/` contient les écrans principaux : `HomePage.tsx` pour l’accueil, `ModelsPage.tsx` pour T8 et T8 PRO, `ReservePage.tsx` pour les rendez-vous, `ShowroomsPage.tsx` pour le réseau local, `ReviewsPage.tsx` pour les avis et `PrivacyPage.tsx` pour la confidentialité.

`src/data/content.ts` est le catalogue éditorial. Il contient les modèles, images, spécifications, moteurs, équipements, showrooms, téléphones, horaires, avis, types de services et créneaux disponibles. Pour modifier le contenu visible, ce fichier est le premier endroit à vérifier.

`src/lib/reservations.ts` contient la logique de rendez-vous. Il génère les identifiants de ticket, vérifie le showroom, le modèle, le service, la date et l’heure, enregistre localement les réservations, bloque les créneaux déjà utilisés et crée un ticket imprimable ou téléchargeable.

`src/lib/security.ts` contient les protections côté navigateur : nettoyage des textes, contrôle des emails et téléphones tunisiens, validation de matricule, limitation des soumissions, masquage des emails et génération d’une empreinte d’intégrité pour détecter une modification simple du ticket local.

`src/styles.css` contient toute l’identité visuelle : palette rouge JAC, graphite, blanc et gris, typographies, navigation, cartes, héros, formulaires, boutons, grilles, responsive design, états de focus et animations.

`public/images/jac/` contient les images locales utilisées par les pages modèles et l’accueil. Les images sont référencées avec des chemins publics comme `/images/jac/hero-t8pro.jpg`.

## Pages et parcours utilisateur

### Accueil — `/`

La page d’accueil présente la marque, le pickup T8 PRO, son positionnement, son prix indicatif tunisien lorsqu’il est disponible, les principaux arguments produit, un accès rapide aux modèles, aux showrooms et à la réservation. Les boutons importants dirigent vers les parcours les plus utiles : découvrir, réserver et contacter.

### Modèles — `/modeles`

Cette page compare les modèles T8 et T8 PRO. Elle présente une galerie d’images, les versions de transmission, les moteurs, les dimensions, les équipements et les liens vers les fiches officielles JAC. Les données internationales ou techniques sont accompagnées d’une note demandant confirmation auprès du réseau tunisien.

### Réserver un entretien — `/reserver`

Le visiteur choisit son modèle, son showroom, son type de service, une date et un créneau. Il renseigne ensuite sa matricule, son nom, son email et son téléphone. Après validation, un ticket est créé dans le navigateur avec un identifiant unique. Le ticket peut être téléchargé et ouvert pour impression.

### Showrooms — `/showrooms`

La page affiche les points locaux connus : Etraton à Tunis, CLH Motors, Ben Arous et El Mghira. Chaque fiche peut afficher la ville, l’adresse, le téléphone, les horaires, la note et le nombre d’avis. Les actions d’appel et d’itinéraire utilisent les liens `tel:` et Google Maps.

### Avis — `/avis`

La page affiche les avis fournis pour les établissements JAC concernés. Les textes sont conservés comme contenus rapportés et ne doivent pas être présentés comme des avis générés par le site. Cette page peut évoluer vers un système de réponse SAV ou de collecte d’avis vérifiés.

### Confidentialité — `/confidentialite`

Cette page explique que les informations de réservation de la version actuelle restent dans le stockage local du navigateur. Elle doit être mise à jour si une base de données, un CRM, un outil d’email ou un système de statistiques est ajouté.

## Données et sources

Les informations de modèles et plusieurs photos proviennent des pages officielles JAC indiquées dans `src/data/content.ts`, notamment `jacen.jac.com.cn` et `pickup.jac.com.cn`. Les informations locales de contact et de réseau sont basées sur les informations publiques disponibles pour JAC Motors Tunisie et C.L.H Motors. Le prix indicatif utilisé pour le T8 PRO est de **105 000 DT** selon la référence fournie pour la Tunisie ; il ne doit pas être considéré comme une offre contractuelle.

Les données commerciales changent avec les versions, les stocks, les taxes, les promotions et les décisions du concessionnaire. Avant une mise en production commerciale, chaque prix, téléphone, horaire, adresse, photo et spécification doit être revérifié par l’équipe JAC Motors Tunisie.

## Fonctionnement des réservations

La réservation est actuellement un parcours local côté navigateur. `localStorage` conserve jusqu’à 30 réservations récentes et une liste de créneaux déjà utilisés sur cet appareil. `sessionStorage` conserve les tentatives de soumission pendant la session afin de limiter les abus. Les données ne sont donc pas envoyées à JAC Motors et ne sont pas visibles sur un autre appareil.

Chaque ticket reçoit un identifiant de type `JAC-AAAAMMJJ-XXXXXXXX`. Avant l’enregistrement, les valeurs sont nettoyées. Le site vérifie également les choix contrôlés comme le showroom, le modèle, le service, la date et l’heure. Une empreinte SHA-256 courte est ajoutée lorsque l’API Web Crypto est disponible afin de détecter une modification simple des données du ticket.

Cette protection est utile pour une démo et un prototype, mais elle ne remplace pas un vrai serveur. Pour recevoir réellement les demandes, il faudra connecter le formulaire à une API sécurisée, une base de données ou un CRM, protéger l’API côté serveur, gérer le consentement légal et ajouter une notification email ou WhatsApp.

## Sécurité et confidentialité

Le site nettoie les champs avant de les réutiliser et échappe les valeurs dans le document HTML du ticket. Les emails et téléphones sont contrôlés avec des règles adaptées au format tunisien. Les documents générés indiquent qu’ils sont nominatifs et qu’ils ne doivent pas être partagés publiquement.

La sécurité actuelle est une sécurité côté client. Un utilisateur peut toujours modifier les données de son propre navigateur. Il ne faut donc pas utiliser le ticket local comme preuve officielle, confirmation d’un paiement ou source de vérité opérationnelle. Une future version doit refaire toutes les validations côté serveur et ne jamais faire confiance aux valeurs envoyées par le navigateur.

## Design et responsive

L’interface utilise une direction premium automobile avec une palette courte : rouge JAC pour les actions, graphite pour les surfaces fortes, blanc et gris pour la lisibilité. La typographie d’affichage donne une présence éditoriale aux titres tandis que la typographie de lecture reste simple et lisible. Les mises en page utilisent principalement Flexbox et CSS Grid, avec des adaptations pour les petits écrans.

La navigation devient un menu mobile sous 860 pixels. Les boutons disposent d’états de survol et de focus. Le lien « Aller au contenu » améliore la navigation clavier et les images possèdent des textes alternatifs dans les composants concernés. Toute nouvelle section doit conserver un contraste lisible, des labels de formulaire explicites et un comportement utilisable au clavier.

## Performance

La version actuelle bénéficie d’un bundle simple, d’un nombre réduit de dépendances et de données locales, ce qui limite les requêtes réseau. Pour améliorer encore les performances avant publication, il est recommandé de convertir les grandes images en WebP ou AVIF, de préparer plusieurs tailles responsive, de charger les galeries secondaires en différé, de ne précharger que l’image héro principale et de réduire les animations sur les appareils mobiles.

Il faut aussi éviter d’ajouter des bibliothèques lourdes pour de petites interactions. Les images doivent être compressées sans perdre leur qualité commerciale, les fichiers inutilisés doivent être supprimés et les routes principales doivent être testées sur un téléphone réel. Une prochaine version pourra ajouter un sitemap, des balises Open Graph, des données structurées de concessionnaire automobile et des métadonnées propres à chaque modèle.

## Déploiement

Le projet peut être déployé sur Vercel ou sur tout hébergeur capable de servir une application Vite statique. La commande de build est `npm run build` et le dossier de sortie est `dist`. Le serveur doit rediriger les routes inconnues vers `index.html`, car React Router gère les pages côté navigateur. Sans cette règle, une ouverture directe de `/modeles` ou `/reserver` peut provoquer une erreur 404 sur certains hébergeurs.

Avant déploiement, il faut tester les routes, le menu mobile, les liens téléphoniques, la génération du ticket, l’impression, les images, les textes français et les liens externes. Il faut également vérifier que le site utilise HTTPS, surtout si une future API reçoit des données personnelles.

## Évolution recommandée

La prochaine étape la plus importante est de remplacer la réservation locale par un vrai service sécurisé. Une API pourrait enregistrer les demandes, empêcher les doubles réservations entre appareils, envoyer une confirmation au client et prévenir le showroom. Il serait également utile d’ajouter une page Services & SAV, une page Essai, une page Offres et financement, une fiche détaillée par modèle, une version arabe et une intégration WhatsApp officielle.

Pour conserver la qualité du site, chaque nouvelle fonctionnalité doit être accompagnée d’une validation côté serveur si elle manipule des données, d’une vérification responsive, d’un état de chargement et d’erreur, d’un texte accessible et d’une mise à jour de cette documentation.

## Limites connues

Le site actuel ne possède pas de compte, de paiement, de CRM, d’envoi automatique d’email, de synchronisation réelle des stocks ou de calendrier partagé entre les showrooms. Les réservations restent sur l’appareil de l’utilisateur. Les prix, stocks, horaires et configurations doivent être confirmés par JAC Motors Tunisie. Les avis affichés sont des contenus de référence et ne constituent pas un système d’avis authentifié.

## Résumé simple

En résumé, JAC Motors Tunisie est une application React construite avec Vite. React affiche les pages, React Router change les écrans, `content.ts` contient les données, `styles.css` contrôle le design et les fichiers de `lib` sécurisent le formulaire local. Le projet est prêt comme vitrine et prototype de réservation ; pour devenir un outil métier réel, il faut ensuite ajouter un backend sécurisé, une base de données, des notifications et une validation officielle des données commerciales.
