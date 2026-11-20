# The Infected Grounds — version native (Rust + Bevy)

Version 3D native du jeu, pensée pour Steam. La version web (JavaScript, dossier parent) reste la référence pour le jeu 2D et le mode 3D navigateur.

## État (v0.1)

- Rendu physique : atmosphère et soleil réalistes (diffusion de Rayleigh/Mie), ombres en cascade, occlusion ambiante (SSAO), reflets d'écran (SSR), brume volumétrique et rayons de soleil, bloom, tone mapping ACES, anti-crénelage temporel (TAA).
- Ville générée : immeubles de 4 à 12 étages, **fenêtres réellement ouvertes**, briques et béton en relief (textures PBR générées par code), escaliers jusqu'au toit, pièces cloisonnées et meublées, rues avec marquages, lampadaires, voitures et mobilier urbain (modèles glTF CC0).
- Joueur à la première personne : souris, ZQSD/WASD, course (Maj), accroupi (Ctrl), saut (Espace), lampe torche (F), collisions complètes (marches, rebords, planchers, plafonds).

- Ennemis morts-vivants animés (modèle KayKit CC0 : sortie de terre, marche, course, attaques, coups, mort) : marcheurs, coureurs (vague 2+), brutes (vague 4+), boss toutes les 5 vagues ; ils contournent les murs et montent les marches.
- 8 armes : couteau, Glock 17, M1911, MP5, AK-47, M4A1, Remington 870 (9 plombs), Barrett M82 (lunette ×4, perforation) — recul, visée au clic droit, rechargement (R), tirs à la tête ×2,2, traînées de balles, éclair de bouche, éclats et étincelles.
- Interface : vie, munitions, vague, morts, tirs à la tête, marqueur de touche, flash de dégâts, écran de mort (R pour recommencer).

Commandes : 1-8 ou molette pour changer d'arme, clic gauche tirer, clic droit viser, R recharger, F lampe, **F2 qualité graphique**.

Qualité graphique (`IG_QUALITY=0..3` au lancement, F2 en jeu) : **0 basse** (petites machines : FXAA, sans ombres ni bloom ni SSAO ni brume volumétrique ni reflets) · **1 moyenne** (ombres + bloom) · **2 haute** (+ TAA, SSAO, brume volumétrique, par défaut) · **3 ultra** (+ reflets d'écran).

À porter depuis la version web : Battle Royale, multijoueur (via Steam), anti-triche, sauvegardes, menus, boutique et tenues, succès Steam, sons.

## Lancer

```bash
cargo run --release            # première compilation longue (Bevy), ensuite rapide
```

Clic gauche pour capturer la souris, Échap pour la libérer.

### Capture d'écran sans carte graphique (tests)

```bash
sudo apt install mesa-vulkan-drivers xvfb libasound2-dev libudev-dev libxkbcommon-x11-0
IG_SHOT=/tmp/vue.png IG_FRAMES=150 IG_CAM=11.25,0,11.25,0.7,0.02 \
VK_ICD_FILENAMES=/usr/share/vulkan/icd.d/lvp_icd.json WGPU_BACKEND=vulkan \
BEVY_ASSET_ROOT=$PWD xvfb-run -a -s "-screen 0 1280x720x24" cargo run --release
```

`IG_CAM=x,y,z,yaw,pitch` place la caméra ; il faut ~100+ images pour que les shaders soient compilés sur un rendu logiciel.

## Steam

Voir `STEAM.md` (compte Steamworks, App ID, SDK, dépôts).

## Crédits

Modèles 3D : KayKit City Builder Bits © Kay Lousberg (CC0). Moteur : Bevy.
