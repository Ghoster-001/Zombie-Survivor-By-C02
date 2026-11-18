# The Infected Grounds — version native (Rust + Bevy)

Version 3D native du jeu, pensée pour Steam. La version web (JavaScript, dossier parent) reste la référence pour le jeu 2D et le mode 3D navigateur.

## État (v0.1)

- Rendu physique : atmosphère et soleil réalistes (diffusion de Rayleigh/Mie), ombres en cascade, occlusion ambiante (SSAO), reflets d'écran (SSR), brume volumétrique et rayons de soleil, bloom, tone mapping ACES, anti-crénelage temporel (TAA).
- Ville générée : immeubles de 4 à 12 étages, **fenêtres réellement ouvertes**, briques et béton en relief (textures PBR générées par code), escaliers jusqu'au toit, pièces cloisonnées et meublées, rues avec marquages, lampadaires, voitures et mobilier urbain (modèles glTF CC0).
- Joueur à la première personne : souris, ZQSD/WASD, course (Maj), accroupi (Ctrl), saut (Espace), lampe torche (F), collisions complètes (marches, rebords, planchers, plafonds).

À porter depuis la version web : zombies et vagues, armes, Battle Royale, multijoueur (via Steam), anti-triche, sauvegardes, menus, succès Steam.

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
