//! Ennemis : squelettes animés (modèle KayKit CC0) qui sortent de terre, poursuivent le joueur, l'attaquent et meurent ; vagues progressives avec coureurs, brutes et boss.
use crate::{city, city::Colliders, fx, game::Game, player::Player};
use bevy::{animation::graph::*, prelude::*, world_serialization::WorldInstanceReady};
use std::{collections::HashMap, time::Duration};

const PATH: &str = "models/enemies/Skeleton_Minion.glb";
const SPAWN_T: f32 = 1.9;
const ATK_T: f32 = 1.05;

#[derive(Clone, Copy, PartialEq, Debug)]
pub enum Kind {
    Walker,
    Runner,
    Brute,
    Boss,
}

#[derive(Clone, Copy, PartialEq, Debug)]
pub enum State {
    Spawning,
    Chase,
    Attack,
    Dying,
}

#[derive(Component)]
pub struct Enemy {
    pub kind: Kind,
    pub hp: f32,
    pub max_hp: f32,
    pub speed: f32,
    pub dmg: f32,
    pub scale: f32,
    pub state: State,
    pub t: f32,
    pub stagger: f32,
    pub anim_entity: Option<Entity>,
    pub want: &'static str,
    pub cur: &'static str,
    pub hit_done: bool,
    pub counted: bool,
    pub blocked: f32,
    pub side: f32,
    pub vy: f32,
    pub seed: u32,
}

impl Enemy {
    pub fn radius(&self) -> f32 {
        0.42 * self.scale
    }
    pub fn height(&self) -> f32 {
        1.85 * self.scale
    }
    pub fn is_dead(&self) -> bool {
        self.state == State::Dying
    }
    pub fn is_spawning(&self) -> bool {
        self.state == State::Spawning
    }
    pub fn damage(&mut self, d: f32, _head: bool) {
        if self.state == State::Dying {
            return;
        }
        self.hp -= d;
        if self.hp <= 0.0 {
            self.state = State::Dying;
            self.t = 0.0;
        }
    }
}

#[derive(Resource)]
pub struct EnemyAssets {
    scene: Handle<WorldAsset>,
    graph: Handle<AnimationGraph>,
    nodes: HashMap<&'static str, AnimationNodeIndex>,
}

#[derive(Resource, Default)]
pub struct Waves {
    pub remaining: u32,
    pub timer: f32,
    pub spawn_t: f32,
    pub seed: u32,
}

pub fn setup_enemies(mut commands: Commands, assets: Res<AssetServer>, mut graphs: ResMut<Assets<AnimationGraph>>) {
    let mut graph = AnimationGraph::new();
    let mut nodes = HashMap::new();
    let clips: [(&'static str, usize); 12] = [("spawn", 74), ("walk", 94), ("walkb", 91), ("run", 55), ("runa", 54), ("attack", 3), ("attack2", 9), ("hit", 38), ("hitb", 39), ("death", 24), ("deathb", 26), ("idle", 40)];
    for (name, idx) in clips {
        let n = graph.add_clip(assets.load(GltfAssetLabel::Animation(idx).from_asset(PATH)), 1.0, graph.root);
        nodes.insert(name, n);
    }
    commands.insert_resource(EnemyAssets { scene: assets.load(GltfAssetLabel::Scene(0).from_asset(PATH)), graph: graphs.add(graph), nodes });
    commands.insert_resource(Waves { timer: 2.5, seed: 7, ..default() });
}

fn link_anim(ready: On<WorldInstanceReady>, mut commands: Commands, children: Query<&Children>, mut players: Query<&mut AnimationPlayer>, mut enemies: Query<&mut Enemy>, ea: Res<EnemyAssets>) {
    for c in children.iter_descendants(ready.entity) {
        if let Ok(mut pl) = players.get_mut(c) {
            let mut tr = AnimationTransitions::new();
            tr.play(&mut pl, ea.nodes["spawn"], Duration::ZERO);
            commands.entity(c).insert((AnimationGraphHandle(ea.graph.clone()), tr));
            if let Ok(mut e) = enemies.get_mut(ready.entity) {
                e.anim_entity = Some(c);
                e.cur = "spawn";
            }
            break;
        }
    }
}

fn spawn_enemy(commands: &mut Commands, ea: &EnemyAssets, kind: Kind, pos: Vec3, wave: u32, seed: u32) {
    let (hp, speed, dmg, scale) = match kind {
        Kind::Walker => (100.0 + wave as f32 * 8.0, 1.5, 11.0, 0.85),
        Kind::Runner => (65.0 + wave as f32 * 5.0, 4.4, 8.0, 0.8),
        Kind::Brute => (420.0 + wave as f32 * 25.0, 1.3, 26.0, 1.25),
        Kind::Boss => (2200.0 + wave as f32 * 120.0, 2.4, 42.0, 1.9),
    };
    commands
        .spawn((
            Enemy { kind, hp, max_hp: hp, speed, dmg, scale, state: State::Spawning, t: 0.0, stagger: 0.0, anim_entity: None, want: "spawn", cur: "spawn", hit_done: false, counted: false, blocked: 0.0, side: 1.0, vy: 0.0, seed },
            Transform::from_translation(pos).with_scale(Vec3::splat(scale)),
            Visibility::default(),
            WorldAssetRoot(ea.scene.clone()),
        ))
        .observe(link_anim);
}

pub fn wave_director(
    mut commands: Commands,
    time: Res<Time>,
    ea: Option<Res<EnemyAssets>>,
    mut waves: ResMut<Waves>,
    mut game: ResMut<Game>,
    col: Res<Colliders>,
    player: Query<&Transform, With<Player>>,
    enemies: Query<&Enemy>,
) {
    let (Some(ea), Ok(pt)) = (ea, player.single()) else { return };
    if game.dead {
        return;
    }
    let dt = time.delta_secs();
    let alive = enemies.iter().filter(|e| !e.is_dead()).count();
    if waves.remaining == 0 && alive == 0 {
        waves.timer -= dt;
        if waves.timer <= 0.0 {
            game.wave += 1;
            let w = game.wave;
            waves.remaining = 5 + 3 * w + if w % 5 == 0 { 1 } else { 0 };
            waves.timer = 5.0;
            game.banner = 3.5;
        }
        return;
    }
    waves.spawn_t -= dt;
    if waves.remaining > 0 && alive < 22 && waves.spawn_t <= 0.0 {
        waves.spawn_t = 0.45;
        let r = |s: &mut u32| fx::rnd(s);
        for _ in 0..8 {
            let a = r(&mut waves.seed) * std::f32::consts::TAU;
            let d = 18.0 + r(&mut waves.seed) * 20.0;
            let p = vec3(pt.translation.x + a.cos() * d, 0.0, pt.translation.z + a.sin() * d);
            if p.x.abs() > city::limit() - 3.0 || p.z.abs() > city::limit() - 3.0 {
                continue;
            }
            let mut hit = false;
            col.near(p.x, p.z, 2.0, |b| {
                if p.x + 0.8 > b.min.x && p.x - 0.8 < b.max.x && p.z + 0.8 > b.min.z && p.z - 0.8 < b.max.z && b.max.y > 0.3 {
                    hit = true;
                }
            });
            if hit {
                continue;
            }
            let w = game.wave;
            let roll = r(&mut waves.seed);
            let kind = if w % 5 == 0 && waves.remaining == 1 {
                Kind::Boss
            } else if w >= 4 && roll < 0.14 {
                Kind::Brute
            } else if w >= 2 && roll < 0.45 {
                Kind::Runner
            } else {
                Kind::Walker
            };
            let s = waves.seed;
            spawn_enemy(&mut commands, &ea, kind, p, w, s);
            waves.remaining -= 1;
            break;
        }
    }
}

pub fn enemy_ai(
    mut commands: Commands,
    time: Res<Time>,
    col: Res<Colliders>,
    mut game: ResMut<Game>,
    player: Query<&Transform, (With<Player>, Without<Enemy>)>,
    mut q: Query<(Entity, &mut Enemy, &mut Transform)>,
) {
    let Ok(pt) = player.single() else { return };
    let dt = time.delta_secs().min(0.05);
    let pp = pt.translation;
    for (ent, mut e, mut t) in &mut q {
        e.stagger = (e.stagger - dt).max(0.0);
        e.t += dt;
        let to = vec3(pp.x - t.translation.x, 0.0, pp.z - t.translation.z);
        let dist = to.length();
        let dir = to.normalize_or_zero();
        match e.state {
            State::Spawning => {
                e.want = "spawn";
                if e.t >= SPAWN_T {
                    e.state = State::Chase;
                    e.t = 0.0;
                }
            }
            State::Chase => {
                e.want = if e.stagger > 0.0 { "hit" } else if e.kind == Kind::Runner { "run" } else if e.kind == Kind::Boss { "runa" } else if e.kind == Kind::Brute { "walkb" } else { "walk" };
                let reach = 1.15 * e.scale + 0.45;
                if dist < reach && !game.dead && e.stagger <= 0.0 {
                    e.state = State::Attack;
                    e.t = 0.0;
                    e.hit_done = false;
                    e.want = if fx::rnd(&mut e.seed) < 0.5 { "attack" } else { "attack2" };
                } else if e.stagger <= 0.0 && !game.dead {
                    // direction : droit vers le joueur, ou contournement quand un mur gêne
                    let mut mv = dir;
                    if e.blocked > 0.0 {
                        mv = (dir * 0.25 + vec3(-dir.z, 0.0, dir.x) * e.side).normalize_or_zero();
                        e.blocked -= dt;
                    }
                    let old = t.translation;
                    let step = mv * e.speed * dt;
                    t.translation += step;
                    let mut vy = e.vy;
                    let mut pos = t.translation;
                    let was_blocked = crate::player::push_out(&col, &mut pos, &mut vy, e.radius(), e.height());
                    t.translation = pos;
                    if was_blocked && (t.translation - old).length() < step.length() * 0.45 && e.blocked <= 0.0 {
                        e.blocked = 0.9;
                        e.side = if fx::rnd(&mut e.seed) < 0.5 { -1.0 } else { 1.0 };
                    }
                }
                if dist > 0.01 {
                    let target = Quat::from_rotation_y(dir.x.atan2(dir.z));
                    t.rotation = t.rotation.slerp(target, (dt * 8.0).min(1.0));
                }
            }
            State::Attack => {
                if dist > 0.01 {
                    t.rotation = t.rotation.slerp(Quat::from_rotation_y(dir.x.atan2(dir.z)), (dt * 10.0).min(1.0));
                }
                if !e.hit_done && e.t >= ATK_T * 0.42 {
                    e.hit_done = true;
                    if dist < 1.15 * e.scale + 1.0 && !game.dead {
                        game.damage(e.dmg);
                    }
                }
                if e.t >= ATK_T {
                    e.state = State::Chase;
                    e.t = 0.0;
                }
            }
            State::Dying => {
                e.want = if e.seed % 2 == 0 { "death" } else { "deathb" };
                if !e.counted {
                    e.counted = true;
                    game.kills += 1;
                }
                if e.t > 4.5 {
                    commands.entity(ent).despawn();
                    continue;
                }
            }
        }
        // gravité et sol
        let g = crate::player::ground_at(&col, t.translation.x, t.translation.z, e.radius(), t.translation.y);
        e.vy -= 20.0 * dt;
        t.translation.y += e.vy * dt;
        if t.translation.y <= g {
            t.translation.y = g;
            e.vy = 0.0;
        }
    }
}

pub fn enemy_anim(ea: Option<Res<EnemyAssets>>, mut q: Query<&mut Enemy>, mut players: Query<(&mut AnimationPlayer, &mut AnimationTransitions)>) {
    let Some(ea) = ea else { return };
    for mut e in &mut q {
        if e.want == e.cur {
            continue;
        }
        let Some(ae) = e.anim_entity else { continue };
        let Ok((mut pl, mut tr)) = players.get_mut(ae) else { continue };
        let looping = matches!(e.want, "walk" | "walkb" | "run" | "runa" | "idle");
        let a = tr.play(&mut pl, ea.nodes[e.want], Duration::from_millis(if e.want == "death" || e.want == "deathb" { 60 } else { 180 }));
        if looping {
            a.repeat();
        }
        let w = e.want;
        e.cur = w;
    }
}

pub fn restart(
    mut commands: Commands,
    keys: Res<ButtonInput<KeyCode>>,
    mut game: ResMut<Game>,
    mut lo: ResMut<crate::weapons::Loadout>,
    mut waves: ResMut<Waves>,
    enemies: Query<Entity, With<Enemy>>,
    mut player: Query<(&mut Transform, &mut Player)>,
) {
    if game.dead && keys.just_pressed(KeyCode::KeyR) {
        *game = Game::default();
        lo.refill();
        *waves = Waves { timer: 2.0, seed: waves.seed, ..default() };
        for e in &enemies {
            commands.entity(e).despawn();
        }
        if let Ok((mut t, mut p)) = player.single_mut() {
            t.translation = vec3(city::PITCH / 2.0, 0.0, city::PITCH / 2.0);
            p.vel = Vec3::ZERO;
        }
    }
}
