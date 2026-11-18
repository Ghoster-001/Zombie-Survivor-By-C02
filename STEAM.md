# Publier sur Steam

Ce que le code prépare déjà : l'intégration Steamworks est derrière la fonctionnalité `steam` (`cargo build --release --features steam`). Sans elle, le jeu tourne comme une application normale (itch.io, GitHub, etc.).

Ce que **seul votre compte** peut faire (je ne peux ni créer de compte, ni payer, ni publier) :

1. **Compte Steamworks** : https://partner.steamgames.com — inscription, formulaire fiscal et bancaire, **droit d'entrée de 100 $ par jeu**. Vous obtenez un **App ID**.
2. **SDK Steamworks** : téléchargez-le depuis l'espace partenaire ; copiez `steam_api64.dll` (Windows), `libsteam_api.so` (Linux) ou `libsteam_api.dylib` (macOS) à côté de l'exécutable.
3. **Test local** : créez `steam_appid.txt` à côté de l'exécutable avec votre App ID (ou `480`, l'application de test « Spacewar »), lancez Steam, puis le jeu.
4. **Page de boutique** : capsules, captures d'écran, bande-annonce, description, classification, prix. La page doit être en ligne au moins 2 semaines avant la sortie.
5. **Dépôts (depots)** : empaquetez le dossier `dist/` (exécutable + `assets/` + bibliothèque Steam) et envoyez-le avec `steamcmd` et un script `app_build.vdf`.
6. **Validation de Valve** : relecture du build et de la page (quelques jours).

## Empaquetage

```bash
cargo build --release --features steam
mkdir -p dist && cp target/release/infected_grounds dist/ && cp -r assets dist/
# + steam_appid.txt (test) et la bibliothèque Steam
```

## Licences à connaître

- Modèles 3D : KayKit (CC0), voir `assets/models/city/LICENSE.txt`.
- Si vous ajoutez d'autres assets, gardez leurs licences (CC0 / CC-BY avec crédit) : Steam exige que vous ayez les droits de tout ce qui est dans le jeu.
- Le nom « The Infected Grounds » doit être libre de marque pour la boutique : vérifiez avant de publier.
