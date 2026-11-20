//! Armes : modèles à la première personne (dessinés par code), tir par rayon (hitscan), recul, visée, rechargement, mêlée.
use crate::{city::Colliders, enemy::Enemy, fx, game::Game, mesh::MeshBuilder, player::PlayerCam};
use bevy::{
    input::mouse::AccumulatedMouseScroll,
    light::NotShadowCaster,
    prelude::*,
    window::{CursorGrabMode, CursorOptions},
};

pub struct WeaponDef {
    pub name: &'static str,
    pub melee: bool,
    pub dmg: f32,
    pub interval: f32,
    pub pellets: u32,
    pub spread: f32,
    pub mag: i32,
    pub reserve: i32,
    pub reload: f32,
    pub range: f32,
    pub auto: bool,
    pub recoil: f32,
    pub zoom: f32,
    pub pierce: u32,
}

pub const N: usize = 8;
pub const WEAPONS: [WeaponDef; N] = [
    WeaponDef { name: "Couteau", melee: true, dmg: 55.0, interval: 0.42, pellets: 1, spread: 0.0, mag: 0, reserve: 0, reload: 0.0, range: 2.6, auto: true, recoil: 0.0, zoom: 1.0, pierce: 1 },
    WeaponDef { name: "Glock 17", melee: false, dmg: 26.0, interval: 0.17, pellets: 1, spread: 0.010, mag: 17, reserve: 170, reload: 1.4, range: 90.0, auto: false, recoil: 0.7, zoom: 1.15, pierce: 1 },
    WeaponDef { name: "M1911", melee: false, dmg: 44.0, interval: 0.30, pellets: 1, spread: 0.007, mag: 7, reserve: 84, reload: 1.6, range: 90.0, auto: false, recoil: 1.1, zoom: 1.15, pierce: 1 },
    WeaponDef { name: "MP5", melee: false, dmg: 19.0, interval: 0.07, pellets: 1, spread: 0.020, mag: 30, reserve: 300, reload: 1.9, range: 80.0, auto: true, recoil: 0.5, zoom: 1.3, pierce: 1 },
    WeaponDef { name: "AK-47", melee: false, dmg: 35.0, interval: 0.10, pellets: 1, spread: 0.016, mag: 30, reserve: 240, reload: 2.2, range: 140.0, auto: true, recoil: 1.0, zoom: 1.35, pierce: 1 },
    WeaponDef { name: "M4A1", melee: false, dmg: 29.0, interval: 0.085, pellets: 1, spread: 0.011, mag: 30, reserve: 270, reload: 2.0, range: 150.0, auto: true, recoil: 0.75, zoom: 1.4, pierce: 1 },
    WeaponDef { name: "Remington 870", melee: false, dmg: 15.0, interval: 0.85, pellets: 9, spread: 0.055, mag: 6, reserve: 54, reload: 2.6, range: 40.0, auto: false, recoil: 2.2, zoom: 1.2, pierce: 1 },
    WeaponDef { name: "Barrett M82", melee: false, dmg: 170.0, interval: 1.15, pellets: 1, spread: 0.0008, mag: 5, reserve: 35, reload: 2.8, range: 400.0, auto: false, recoil: 3.2, zoom: 4.0, pierce: 3 },
];

#[derive(Resource)]
pub struct Loadout {
    pub cur: usize,
    pub ammo: [i32; N],
    pub reserve: [i32; N],
    pub cd: f32,
    pub reload: f32,
    pub ads: f32,
    pub kick: f32,
    pub swap: f32,
    pub swing: f32,
    pub flash: f32,
    pub seed: u32,
}

impl Default for Loadout {
    fn default() -> Self {
        let mut l = Self { cur: 4, ammo: [0; N], reserve: [0; N], cd: 0.0, reload: 0.0, ads: 0.0, kick: 0.0, swap: 0.0, swing: 0.0, flash: 0.0, seed: 12345 };
        l.refill();
        l
    }
}

impl Loadout {
    pub fn refill(&mut self) {
        for (i, w) in WEAPONS.iter().enumerate() {
            self.ammo[i] = w.mag;
            self.reserve[i] = w.reserve;
        }
    }
}

#[derive(Resource)]
pub struct WeaponMeshes(pub Vec<Handle<Mesh>>);
#[derive(Component)]
pub struct ViewModel;
#[derive(Component)]
pub struct MuzzleLight;

const STEEL: [f32; 4] = [0.30, 0.32, 0.36, 1.0];
const DARK: [f32; 4] = [0.09, 0.09, 0.10, 1.0];
const POLY: [f32; 4] = [0.05, 0.05, 0.055, 1.0];
const WOOD: [f32; 4] = [0.34, 0.19, 0.09, 1.0];
const SKIN: [f32; 4] = [0.62, 0.45, 0.36, 1.0];
const BLADE: [f32; 4] = [0.75, 0.78, 0.82, 1.0];

fn b(m: &mut MeshBuilder, cx: f32, cy: f32, cz: f32, sx: f32, sy: f32, sz: f32, c: [f32; 4]) {
    m.cuboid_c(vec3(cx, cy, cz), vec3(sx, sy, sz), c, 1.0);
}

/// Modèle de chaque arme : le canon pointe vers -Z (devant le joueur), l'origine est la poignée.
fn model(i: usize) -> Mesh {
    let mut m = MeshBuilder::default();
    // avant-bras et main
    b(&mut m, 0.02, -0.07, 0.10, 0.07, 0.07, 0.22, SKIN);
    match i {
        0 => {
            // couteau : lame, garde, manche
            b(&mut m, 0.0, 0.0, -0.17, 0.008, 0.035, 0.26, BLADE);
            b(&mut m, 0.0, 0.0, -0.035, 0.03, 0.045, 0.012, DARK);
            b(&mut m, 0.0, -0.005, 0.03, 0.03, 0.035, 0.11, POLY);
        }
        1 | 2 => {
            let l = if i == 2 { 0.23 } else { 0.21 };
            b(&mut m, 0.0, 0.035, -l / 2.0 + 0.03, 0.032, 0.036, l, STEEL);
            b(&mut m, 0.0, 0.01, -l / 2.0 + 0.04, 0.03, 0.03, l - 0.02, DARK);
            b(&mut m, 0.0, -0.045, 0.045, 0.03, 0.095, 0.045, POLY);
            b(&mut m, 0.0, 0.058, -l + 0.03, 0.008, 0.012, 0.01, STEEL); // guidon
        }
        3 => {
            b(&mut m, 0.0, 0.03, -0.16, 0.05, 0.065, 0.36, DARK);
            b(&mut m, 0.0, 0.025, -0.42, 0.016, 0.016, 0.16, STEEL);
            b(&mut m, 0.0, -0.065, -0.08, 0.035, 0.13, 0.05, DARK);
            b(&mut m, 0.0, -0.06, 0.04, 0.032, 0.1, 0.05, POLY);
            b(&mut m, 0.0, 0.025, 0.2, 0.04, 0.05, 0.18, POLY);
        }
        4 | 5 => {
            let ak = i == 4;
            b(&mut m, 0.0, 0.03, -0.18, 0.052, 0.07, 0.42, if ak { STEEL } else { DARK });
            b(&mut m, 0.0, 0.035, -0.50, 0.02, 0.02, 0.28, STEEL);
            b(&mut m, 0.0, 0.065, -0.34, 0.03, 0.035, 0.34, if ak { WOOD } else { DARK }); // garde-main / rail
            if ak {
                b(&mut m, 0.0, -0.075, -0.17, 0.038, 0.17, 0.065, DARK); // chargeur courbe
                b(&mut m, 0.0, 0.0, 0.17, 0.045, 0.08, 0.22, WOOD);
            } else {
                b(&mut m, 0.0, -0.07, -0.15, 0.036, 0.14, 0.06, DARK);
                b(&mut m, 0.0, 0.01, 0.17, 0.04, 0.07, 0.24, POLY);
                b(&mut m, 0.0, 0.1, -0.18, 0.03, 0.04, 0.12, DARK); // viseur
            }
            b(&mut m, 0.0, -0.06, 0.03, 0.032, 0.1, 0.05, POLY);
        }
        6 => {
            b(&mut m, 0.0, 0.04, -0.30, 0.028, 0.028, 0.62, STEEL);
            b(&mut m, 0.0, 0.0, -0.28, 0.034, 0.034, 0.45, DARK);
            b(&mut m, 0.0, -0.005, -0.34, 0.06, 0.04, 0.2, WOOD); // pompe
            b(&mut m, 0.0, 0.025, 0.0, 0.05, 0.075, 0.2, DARK);
            b(&mut m, 0.0, 0.0, 0.22, 0.045, 0.085, 0.26, WOOD);
            b(&mut m, 0.0, -0.06, 0.0, 0.03, 0.09, 0.04, POLY);
        }
        _ => {
            b(&mut m, 0.0, 0.035, -0.28, 0.055, 0.075, 0.7, DARK);
            b(&mut m, 0.0, 0.04, -0.78, 0.034, 0.034, 0.34, STEEL);
            b(&mut m, 0.0, 0.04, -1.0, 0.07, 0.07, 0.1, DARK); // frein de bouche
            b(&mut m, 0.0, 0.115, -0.2, 0.05, 0.05, 0.36, STEEL); // lunette
            b(&mut m, 0.0, 0.115, -0.39, 0.07, 0.07, 0.04, DARK);
            b(&mut m, 0.0, 0.115, -0.01, 0.07, 0.07, 0.04, DARK);
            b(&mut m, 0.0, -0.07, -0.2, 0.04, 0.12, 0.12, DARK);
            b(&mut m, 0.0, 0.0, 0.2, 0.05, 0.1, 0.3, POLY);
            b(&mut m, 0.0, -0.075, -0.9, 0.012, 0.12, 0.012, STEEL); // bipied
        }
    }
    m.build()
}

pub fn setup_weapons(mut commands: Commands, mut meshes: ResMut<Assets<Mesh>>, mut mats: ResMut<Assets<StandardMaterial>>, cam: Query<Entity, With<PlayerCam>>) {
    let handles: Vec<Handle<Mesh>> = (0..N).map(|i| meshes.add(model(i))).collect();
    let mat = mats.add(StandardMaterial { base_color: Color::WHITE, metallic: 0.65, perceptual_roughness: 0.38, reflectance: 0.6, ..default() });
    let first = handles[4].clone();
    commands.insert_resource(WeaponMeshes(handles));
    let Ok(c) = cam.single() else { return };
    commands.entity(c).with_children(|p| {
        p.spawn((ViewModel, Mesh3d(first), MeshMaterial3d(mat), Transform::from_xyz(0.2, -0.2, -0.45), NotShadowCaster)).with_children(|v| {
            v.spawn((MuzzleLight, PointLight { intensity: 0.0, range: 14.0, color: Color::srgb(1.0, 0.75, 0.4), shadow_maps_enabled: false, ..default() }, Transform::from_xyz(0.0, 0.04, -0.6)));
        });
    });
}

fn ray_aabb(o: Vec3, d: Vec3, a: &crate::mesh::Aabb) -> Option<f32> {
    let inv = Vec3::ONE / d;
    let t1 = (a.min - o) * inv;
    let t2 = (a.max - o) * inv;
    let (tmin, tmax) = (t1.min(t2), t1.max(t2));
    let (tn, tf) = (tmin.max_element(), tmax.min_element());
    if tn <= tf && tf > 0.0 { Some(tn.max(0.0)) } else { None }
}

/// Intersection rayon / cylindre vertical (ennemi) : renvoie la distance et la hauteur relative (0 pieds .. 1 sommet de la tête)
pub fn ray_cyl(o: Vec3, d: Vec3, c: Vec3, r: f32, h: f32) -> Option<(f32, f32)> {
    let (ox, oz) = (o.x - c.x, o.z - c.z);
    let a = d.x * d.x + d.z * d.z;
    if a < 1e-8 {
        return None;
    }
    let bq = ox * d.x + oz * d.z;
    let cq = ox * ox + oz * oz - r * r;
    let disc = bq * bq - a * cq;
    if disc < 0.0 {
        return None;
    }
    let t = (-bq - disc.sqrt()) / a;
    if t < 0.0 {
        return None;
    }
    let y = o.y + d.y * t - c.y;
    if y < 0.0 || y > h {
        return None;
    }
    Some((t, y / h))
}

#[allow(clippy::too_many_arguments)]
pub fn weapon_system(
    mut commands: Commands,
    time: Res<Time>,
    mouse: Res<ButtonInput<MouseButton>>,
    keys: Res<ButtonInput<KeyCode>>,
    scroll: Res<AccumulatedMouseScroll>,
    cursor: Single<&CursorOptions>,
    mut lo: ResMut<Loadout>,
    mut game: ResMut<Game>,
    col: Res<Colliders>,
    fxa: Res<fx::FxAssets>,
    wm: Res<WeaponMeshes>,
    cam: Query<&GlobalTransform, With<PlayerCam>>,
    mut enemies: Query<(Entity, &mut Enemy, &Transform)>,
    mut vm: Query<(&mut Transform, &mut Mesh3d), (With<ViewModel>, Without<Enemy>)>,
    mut light: Query<&mut PointLight, With<MuzzleLight>>,
    mut proj: Query<&mut Projection, With<PlayerCam>>,
) {
    let lo = &mut *lo;
    let dt = time.delta_secs();
    let locked = cursor.grab_mode == CursorGrabMode::Locked || std::env::var("IG_BOT").is_ok();
    // changement d'arme : touches 1-8, molette
    let mut want = None;
    for (i, k) in [KeyCode::Digit1, KeyCode::Digit2, KeyCode::Digit3, KeyCode::Digit4, KeyCode::Digit5, KeyCode::Digit6, KeyCode::Digit7, KeyCode::Digit8].iter().enumerate() {
        if keys.just_pressed(*k) {
            want = Some(i);
        }
    }
    if scroll.delta.y != 0.0 {
        want = Some(((lo.cur as i32 + if scroll.delta.y > 0.0 { -1 } else { 1 }).rem_euclid(N as i32)) as usize);
    }
    if let Some(w) = want {
        if w != lo.cur && !game.dead {
            lo.cur = w;
            lo.reload = 0.0;
            lo.swap = 1.0;
            lo.cd = 0.25;
            if let Ok((_, mut m)) = vm.single_mut() {
                m.0 = wm.0[w].clone();
            }
        }
    }
    let w = &WEAPONS[lo.cur];
    lo.cd = (lo.cd - dt).max(0.0);
    lo.swap = (lo.swap - dt * 4.0).max(0.0);
    lo.kick = (lo.kick - dt * 6.0 * (1.0 + lo.kick)).max(0.0);
    lo.swing = (lo.swing - dt * 3.2).max(0.0);
    lo.flash = (lo.flash - dt).max(0.0);
    let ads_want = if locked && mouse.pressed(MouseButton::Right) && !w.melee && lo.reload <= 0.0 && !game.dead { 1.0 } else { 0.0 };
    lo.ads += (ads_want - lo.ads) * (dt * 12.0).min(1.0);
    // rechargement
    if lo.reload > 0.0 {
        lo.reload -= dt;
        if lo.reload <= 0.0 {
            let need = w.mag - lo.ammo[lo.cur];
            let take = need.min(lo.reserve[lo.cur]);
            lo.ammo[lo.cur] += take;
            lo.reserve[lo.cur] -= take;
        }
    }
    if keys.just_pressed(KeyCode::KeyR) && !w.melee && lo.reload <= 0.0 && lo.ammo[lo.cur] < w.mag && lo.reserve[lo.cur] > 0 && !game.dead {
        lo.reload = w.reload;
    }
    let wants_fire = locked && !game.dead && if w.auto { mouse.pressed(MouseButton::Left) } else { mouse.just_pressed(MouseButton::Left) };
    let Ok(cg) = cam.single() else { return };
    let (origin, fwd) = (cg.translation(), cg.forward().as_vec3());
    if wants_fire && lo.cd <= 0.0 && lo.reload <= 0.0 {
        if w.melee {
            lo.cd = w.interval;
            lo.swing = 1.0;
            let mut hit = false;
            for (_, mut e, t) in &mut enemies {
                if e.is_dead() {
                    continue;
                }
                let to = vec3(t.translation.x - origin.x, 0.0, t.translation.z - origin.z);
                let dist = to.length();
                if dist < w.range + e.radius() && to.normalize_or_zero().dot(vec3(fwd.x, 0.0, fwd.z).normalize_or_zero()) > 0.55 {
                    e.damage(w.dmg, false);
                    fx::burst(&mut commands, &fxa, t.translation + Vec3::Y * 1.2, -fwd, 8, fx::Kind::Bone, &mut lo.seed);
                    hit = true;
                }
            }
            if hit {
                game.hit_marker = 1.0;
                game.hit_head = false;
            }
        } else if lo.ammo[lo.cur] > 0 {
            lo.cd = w.interval;
            lo.ammo[lo.cur] -= 1;
            lo.kick = (lo.kick + w.recoil * 0.5).min(4.0);
            lo.flash = 0.045;
            let muzzle = origin + fwd * 0.9 + cg.right().as_vec3() * 0.12 - cg.up().as_vec3() * 0.1;
            let spread = w.spread * (1.0 - 0.6 * lo.ads);
            for _ in 0..w.pellets {
                let jitter = vec3(fx::rnd(&mut lo.seed) - 0.5, fx::rnd(&mut lo.seed) - 0.5, fx::rnd(&mut lo.seed) - 0.5) * 2.0 * spread;
                let d = (fwd + cg.right().as_vec3() * jitter.x + cg.up().as_vec3() * jitter.y).normalize();
                // mur / sol
                let mut wall_t = w.range;
                if d.y < -1e-4 {
                    wall_t = wall_t.min(-origin.y / d.y);
                }
                for a in &col.boxes {
                    if let Some(t) = ray_aabb(origin, d, a) {
                        if t < wall_t && t > 0.0 {
                            wall_t = t;
                        }
                    }
                }
                // ennemis touchés (triés par distance, perforation)
                let mut hits: Vec<(f32, Entity, f32)> = Vec::new();
                for (en, e, t) in &enemies {
                    if e.is_dead() || e.is_spawning() {
                        continue;
                    }
                    if let Some((tt, hr)) = ray_cyl(origin, d, t.translation, e.radius(), e.height()) {
                        if tt < wall_t {
                            hits.push((tt, en, hr));
                        }
                    }
                }
                hits.sort_by(|a, b| a.0.partial_cmp(&b.0).unwrap());
                let mut end_t = wall_t;
                for (n, (tt, en, hr)) in hits.iter().enumerate() {
                    if n as u32 >= w.pierce {
                        break;
                    }
                    if let Ok((_, mut e, t)) = enemies.get_mut(*en) {
                        let head = *hr > 0.78;
                        e.damage(w.dmg * if head { 2.2 } else if *hr < 0.35 { 0.7 } else { 1.0 }, head);
                        if head && e.is_dead() && !e.counted {
                            game.headshots += 1;
                        }
                        e.stagger = 0.25;
                        let p = origin + d * *tt;
                        fx::burst(&mut commands, &fxa, p, -d, if head { 14 } else { 8 }, fx::Kind::Bone, &mut lo.seed);
                        game.hit_marker = 1.0;
                        game.hit_head = head;
                        let _ = t;
                        end_t = *tt;
                    }
                }
                if hits.is_empty() || w.pierce > hits.len() as u32 {
                    end_t = wall_t;
                }
                if hits.is_empty() && wall_t < w.range {
                    let p = origin + d * wall_t;
                    fx::burst(&mut commands, &fxa, p - d * 0.03, -d, 6, fx::Kind::Spark, &mut lo.seed);
                    fx::burst(&mut commands, &fxa, p - d * 0.03, -d, 4, fx::Kind::Dust, &mut lo.seed);
                }
                fx::tracer(&mut commands, &fxa, muzzle, origin + d * end_t.min(w.range));
            }
            if lo.ammo[lo.cur] == 0 && lo.reserve[lo.cur] > 0 {
                lo.reload = w.reload;
            }
        } else if lo.reserve[lo.cur] > 0 {
            lo.reload = w.reload;
        }
    }
    // modèle à l'écran : position de repos, visée, recul, rechargement, balancement du couteau
    if let Ok((mut t, _)) = vm.single_mut() {
        let ads = lo.ads;
        let rest = vec3(0.2, -0.2, -0.45);
        let aim = vec3(0.0, -0.1 - 0.02 * (w.zoom > 3.0) as i32 as f32, -0.42);
        let mut p = rest.lerp(aim, ads);
        let mut rot = Quat::IDENTITY;
        p.z += lo.kick * 0.035;
        rot *= Quat::from_rotation_x(lo.kick * 0.035);
        p.y -= lo.swap * 0.25;
        rot *= Quat::from_rotation_x(-lo.swap * 0.9);
        if lo.reload > 0.0 {
            let k = (lo.reload / w.reload.max(0.1)).clamp(0.0, 1.0);
            let dip = (k * std::f32::consts::PI).sin();
            p.y -= 0.12 * dip;
            rot *= Quat::from_rotation_x(-0.5 * dip) * Quat::from_rotation_z(0.5 * dip);
        }
        if w.melee {
            let s = (1.0 - lo.swing).clamp(0.0, 1.0);
            let a = (s * std::f32::consts::PI).sin();
            if lo.swing > 0.0 {
                p.x -= 0.25 * a;
                p.z -= 0.18 * a;
                rot *= Quat::from_rotation_y(0.9 * a) * Quat::from_rotation_z(-0.6 * a);
            }
        }
        // léger balancement
        p.y += (game.time * 1.6).sin() * 0.003;
        t.translation = p;
        t.rotation = rot;
    }
    for mut l in &mut light {
        l.intensity = if lo.flash > 0.0 { 1_200_000.0 } else { 0.0 };
    }
    // champ de vision : zoom de visée
    for mut p in &mut proj {
        if let Projection::Perspective(pp) = &mut *p {
            let target = 75f32.to_radians() / (1.0 + (w.zoom - 1.0) * lo.ads);
            pp.fov += (target - pp.fov) * (dt * 14.0).min(1.0);
        }
    }
}
