<p align="center"><a href="https://ghoster-001.github.io/Zombie-Survivor-By-C02/"><img src="assets/logo.png" width="260" alt="The Infected Grounds - Zombies Siege - cliquer pour jouer"></a></p>

# The Infected Grounds — Zombies Siege

*By C02*

<p align="center"><a href="https://ghoster-001.github.io/Zombie-Survivor-By-C02/"><b>▶ JOUER AU JEU</b></a></p>

Shooter de survie zombie en vue de côté, jouable dans le navigateur (HTML5 canvas, JavaScript pur, découpé en modules dans `js/`).

## Lancer le jeu
Joue en ligne : https://ghoster-001.github.io/Zombie-Survivor-By-C02/

Ou télécharge le dépôt et ouvre `index.html` dans un navigateur moderne (le dossier `js/` doit rester à côté).

## Structure du projet

`index.html` contient la page, le style et la liste des scripts ; le code est dans `js/` (scripts classiques chargés dans l'ordre, ils partagent la même portée globale, donc aucun serveur ni bundler n'est nécessaire).

| Fichier | Contenu |
|---|---|
| `core`, `weapons-data`, `maps` | base du jeu, armes, cartes et difficultés |
| `anticheat`, `vault` | C02 Anti-Cheat et coffre chiffré de la sauvegarde |
| `events`, `items-shop`, `audio`, `gameplay`, `update`, `render2d` | événements, boutique, sons, combat, boucle de jeu, rendu 2D |
| `ui-theme`, `xmas-theme`, `weapon-art`, `boosts`, `controls`, `nightmare`, `playhub` | interface, armes dessinées, boosts, commandes tactiles/manettes, Nightmare, page Jouer |
| `multiplayer`, `remote-play`, `profile`, `updater` | multijoueur 2D, écran partagé, profil, mises à jour |
| `three-base`, `fw-core`, `fw-pbr`, `models-city`, `fw-models`, `fw-buildings`, `fw-furniture`, `fw-world`, `fw-mp`, `fw-game` | mode 3D : moteur, immeubles, intérieurs, monde et rendu, multijoueur 3D / Battle Royale, boucle de jeu |
| `main` | optimisations et démarrage |
| `vendor/GLTFLoader.js` | chargeur glTF de Three.js r128 (licence MIT) |

Changer de version : `python3 tools/bump-version.py 0.78` (met à jour `GAME_VERSION` et le `?v=` des scripts pour éviter les fichiers périmés en cache).

## Contenu
- Couteau en arme principale, armes à feu trouvées dans des caisses larguées du ciel (munitions ou durée limitée)
- ~100 armes à débloquer par niveau et par prix, 4 améliorations par arme, skins de couleur
- Zombies de plus en plus forts à chaque vague, vie max améliorable dans le menu
- Personnalisation du personnage : 7 tenues homme / femme (morphologie normale ou exagérée), couleurs de peau, cheveux et vêtements
- Sons synthétisés : chaque arme a son propre son, inspiré de son calibre, de son canon et de son mécanisme (réglage du volume dans Options)
- Musique de fond en boucle (curseur de volume et bouton on/off dans Options)
- 8 bonus lâchés par les zombies : soin, bouclier, dégâts x2, cadence, gel, frappe aérienne, tourelle, butin
- Menu pause (Échap : continuer, paramètres, quitter avec confirmation) ; P fige le jeu sans menu
- Mode Entraînement : toutes les armes au maximum, arme principale au choix, rien n'est sauvegardé
- Deux barres d'XP : niveau de jeu (global) et niveau du personnage (par partie) ; chaque niveau donne un bonus stocké, utilisable à la demande (touche Q)
- Caisses du ciel : tirage au sort uniforme parmi les armes à feu débloquées, le kit de soin et le bouclier
- 25 langues (détection automatique de la langue de l'appareil, changement depuis le menu principal avec les drapeaux)
- Mobile : boutons tactiles (déplacement, saut, tir), toucher sur les caisses et les bonus ; la zone de jeu s'adapte au format de l'écran (jusqu'aux bords, sans bandes noires)
- Manettes : onglet « Manettes connectées » pour activer / désactiver chaque manette (volant, casque, périphérique virtuel…), calibrage automatique au repos
- C02 Anti-Cheat v1.1 : surveillance aussi en 3D (vitesse, cadence de tir) et contrôle des données des armes et zombies
- Mode 3D « monde libre » (V0.61 → V0.63) : FPS en ville ouverte (première ou troisième personne, touche V), déplacement libre, immeubles de bordure, mini-carte, barres de vie, animations de coups, **les 25 boosts posent de vrais objets 3D** (barricades, mines, tourelle, drone, chien, hélico…), tactile et manette ; Three.js chargé à la demande (connexion requise)
- **Remaster graphique 3D (V0.75)** : ciel de crépuscule avec soleil, lune et étoiles, soleil rasant avec ombres portées, asphalte mouillé et carrosseries qui reflètent le ciel, tone mapping cinéma, bloom, étalonnage et vignette, poussière dans l'air, murs épais avec ébrasements de fenêtres, corniches, pilastres, auvents, enseignes néon et toits équipés (climatiseurs, antennes à balise rouge)
- **Matériaux réalistes (V0.78, profils ÉLEVÉ et plus)** : relief des briques, du béton, de l'asphalte et des trottoirs (cartes de relief générées par code), rugosité, pools et cônes de lumière sous les lampadaires, éblouissement du soleil quand il est visible
- **Vrais modèles 3D (V0.80)** : voitures, bouches d'incendie, feux tricolores, bancs, poubelles, bennes, buissons et cartons dans les rues (modèles CC0 intégrés au jeu, posés en instances, avec collisions ; le décor d'origine reste en secours si les modèles ne se chargent pas)
- **Multijoueur 3D** : coop (jusqu'à 4, vagues de zombies) et **Battle Royale** (jusqu'à 10 joueurs, carte géante, saut d'avion ou de dirigeable puis chute libre et parachute, zone qui se déplace en rétrécissant avec minuteur, barre de vie, spectateur à la mort, armes au niveau de base, classement et récompenses signées par l'hôte) ; visée au clic droit, lunette avec zoom à la molette, accroupi sur Ctrl, de grands immeubles (560 × 560, étages de 140) visitables à tous les étages : pièces cloisonnées et meublées (salon, cuisine, chambre, bureau, salle de bain, boutique…), escalier monumental jusqu’au toit, fenêtres praticables dans les deux sens, toits avec rebords, dégâts de chute
- Menu principal simplifié (Jouer, Personnalisation, Boutique, Options, Quitter) : la page **JOUER** propose Solo, Multijoueur, Nightmare solo, Nightmare multi (coop), Entraînement et Arsenal selon le mode 2D / 3D
- **Mode NIGHTMARE** (2D et 3D, dispo dès le début) : une arme par catégorie changée à la molette (haut = suivante, bas = précédente, configurable), munitions illimitées, vagues infinies de zombies ultra forts ; bonus désactivables (gains ×10 sans, ×9 avec)
- **Skins** : tous les zombies (et animaux) jouables, skin Sapin de Noël aux guirlandes clignotantes, personnage 2D et 3D plus détaillé
- **C02 Anti-Cheat v1.2** : coffre chiffré de la sauvegarde (AES-GCM, clé non extractable liée à l'appareil) — un éditeur de sauvegarde peut modifier le fichier mais la modification est annulée au démarrage ; exports signés par l'appareil (les sauvegardes d'une mise à jour antérieure restent importables) ; contrôle des données des armes et zombies ; surveillance en 3D
- Visée souris ou tir dans la direction du déplacement, touches configurables, pause (Échap / P)
- Cartes (6), difficultés, boss toutes les 5 manches, manche finale du magicien qui débloque la carte suivante
- Boosts améliorables (24 types : barricade, nounours piégé, mines, drone, molotov…), roulette du jour, Seconde vie
- Graphismes : profils AUTO / ÉCO à EXTRÊME, limite de FPS jusqu'au taux de l'écran, compteur FPS déplaçable, animations réductibles, luminosité
- Commandes : boutons tactiles personnalisables (mode immortel), manettes (Xbox, PlayStation, Switch Pro), téléphone utilisable comme manette
- **Multijoueur coopératif (2 à 4 joueurs)** : un hôte crée un salon (code), les invités le rejoignent et se mettent « prêt » ; l'hôte choisit la carte et la difficulté ; chacun garde sa progression ; caisses au premier arrivé, cadeaux de Noël partagés
- **Remote Play** : 2 à 4 joueurs sur le même écran (non divisé, carte fixe), chacun avec son téléphone (code par joueur, choix du personnage parmi 53 avatars) ; vie, armes et bonus s'affichent sur chaque téléphone ; XP et crédits reviennent au compte principal
- Profil : 53 avatars prédéfinis et pseudo modifiable depuis le menu principal
- Mises à jour : bouton de recherche et d'installation, recherche automatique à chaque passage par le menu, progression conservée
- **C02 Anti-Cheat** : signature de la sauvegarde, détection des valeurs impossibles et des modifications en partie, horloge surveillée, profil et gains signés en multijoueur (page dédiée dans Options → Données)

Jeu et graphismes originaux, inspirés par le genre des shooters de survie.

## Crédits

- Modèles 3D de la ville : **KayKit — City Builder Bits** © Kay Lousberg ([kaylousberg.com](https://www.kaylousberg.com)), licence CC0 (voir `assets/models/LICENSE-KayKit-CC0.txt`). Régénérer `js/models-city.js` : `python3 tools/pack-models.py`.
- Chargeur glTF : Three.js r128 (MIT).
