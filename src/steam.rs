//! Intégration Steam (fonctionnalité `steam`) : initialisation du SDK et boucle de rappels. Sans la fonctionnalité, ce plugin ne fait rien.
use bevy::prelude::*;

pub struct SteamPlugin;

#[cfg(feature = "steam")]
impl Plugin for SteamPlugin {
    fn build(&self, app: &mut App) {
        // Steam doit être lancé et un steam_appid.txt (ou l'App ID du jeu) présent ; sinon on continue sans Steam
        match steamworks::Client::init() {
            Ok(client) => {
                info!("Steam connecté : {}", client.friends().name());
                app.insert_non_send(client);
                app.add_systems(First, |c: NonSend<steamworks::Client>| c.run_callbacks());
            }
            Err(e) => warn!("Steam indisponible ({e}) : le jeu continue sans Steam"),
        }
    }
}

#[cfg(not(feature = "steam"))]
impl Plugin for SteamPlugin {
    fn build(&self, _app: &mut App) {}
}
