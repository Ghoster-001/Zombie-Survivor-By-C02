//! État de la partie : santé du joueur, score, vagues.
use bevy::prelude::*;

#[derive(Resource)]
pub struct Game {
    pub hp: f32,
    pub max_hp: f32,
    pub dead: bool,
    pub kills: u32,
    pub headshots: u32,
    pub wave: u32,
    pub banner: f32,
    pub hurt: f32,
    pub hit_marker: f32,
    pub hit_head: bool,
    pub time: f32,
}

impl Default for Game {
    fn default() -> Self {
        Self { hp: 100.0, max_hp: 100.0, dead: false, kills: 0, headshots: 0, wave: 0, banner: 0.0, hurt: 0.0, hit_marker: 0.0, hit_head: false, time: 0.0 }
    }
}

impl Game {
    pub fn damage(&mut self, d: f32) {
        if self.dead {
            return;
        }
        self.hp -= d;
        self.hurt = 1.0;
        if self.hp <= 0.0 {
            self.hp = 0.0;
            self.dead = true;
        }
    }
}

pub fn tick_game(time: Res<Time>, mut g: ResMut<Game>) {
    let dt = time.delta_secs();
    g.hurt = (g.hurt - dt * 1.6).max(0.0);
    g.hit_marker = (g.hit_marker - dt * 5.0).max(0.0);
    g.banner = (g.banner - dt).max(0.0);
    if !g.dead {
        g.time += dt;
    }
}
