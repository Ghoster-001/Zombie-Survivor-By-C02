//! Joueur à la première personne : souris, ZQSD/WASD, course, saut, accroupi, lampe torche ; collisions contre les pavés de la ville (marches, rebords, planchers).
use crate::city::Colliders;
use bevy::{
    input::mouse::AccumulatedMouseMotion,
    prelude::*,
    window::{CursorGrabMode, CursorOptions},
};

#[derive(Component)]
pub struct Player {
    pub vel: Vec3,
    pub yaw: f32,
    pub pitch: f32,
    pub grounded: bool,
    pub crouch: f32,
}
#[derive(Component)]
pub struct PlayerCam;
#[derive(Component)]
pub struct Flashlight;

pub const R: f32 = 0.42;
pub const H: f32 = 1.8;
const STEP: f32 = 0.45;
const EYE: f32 = 1.65;

pub fn spawn_player(mut commands: Commands, shot: Res<crate::ShotCfg>) {
    let (pos, yaw, pitch) = shot.cam.unwrap_or((vec3(crate::city::PITCH / 2.0, 0.0, crate::city::PITCH / 2.0), 0.7, 0.0));
    commands
        .spawn((Player { vel: Vec3::ZERO, yaw, pitch, grounded: true, crouch: 0.0 }, Transform::from_translation(pos).with_rotation(Quat::from_rotation_y(yaw)), Visibility::default()))
        .with_children(|p| {
            p.spawn((PlayerCam, Transform::from_xyz(0.0, EYE, 0.0).with_rotation(Quat::from_rotation_x(pitch)), Visibility::default()))
                .with_children(|c| {
                    c.spawn((
                        Flashlight,
                        SpotLight { intensity: 3_000_000.0, range: 45.0, inner_angle: 0.12, outer_angle: 0.42, color: Color::srgb(1.0, 0.95, 0.85), shadow_maps_enabled: true, ..default() },
                        Transform::from_xyz(0.18, -0.12, 0.0),
                        Visibility::Hidden,
                    ));
                });
        });
}

pub fn grab_cursor(mut cursor: Single<&mut CursorOptions>, mouse: Res<ButtonInput<MouseButton>>, key: Res<ButtonInput<KeyCode>>) {
    if mouse.just_pressed(MouseButton::Left) {
        cursor.visible = false;
        cursor.grab_mode = CursorGrabMode::Locked;
    }
    if key.just_pressed(KeyCode::Escape) {
        cursor.visible = true;
        cursor.grab_mode = CursorGrabMode::None;
    }
}

pub fn look(motion: Res<AccumulatedMouseMotion>, cursor: Single<&CursorOptions>, mut q: Query<(&mut Transform, &mut Player)>, mut cam: Query<&mut Transform, (With<PlayerCam>, Without<Player>)>) {
    let Ok((mut t, mut p)) = q.single_mut() else { return };
    if cursor.grab_mode == CursorGrabMode::Locked {
        p.yaw -= motion.delta.x * 0.0022;
        p.pitch = (p.pitch - motion.delta.y * 0.0022).clamp(-1.5, 1.5);
    }
    t.rotation = Quat::from_rotation_y(p.yaw);
    if let Ok(mut c) = cam.single_mut() {
        c.rotation = Quat::from_rotation_x(p.pitch);
        c.translation.y = EYE - 0.55 * p.crouch;
    }
}

pub fn toggle_flashlight(key: Res<ButtonInput<KeyCode>>, mut q: Query<&mut Visibility, With<Flashlight>>) {
    if key.just_pressed(KeyCode::KeyF) {
        for mut v in &mut q {
            *v = if *v == Visibility::Hidden { Visibility::Visible } else { Visibility::Hidden };
        }
    }
}

fn overlap_circle(a: &crate::mesh::Aabb, x: f32, z: f32) -> (f32, f32, f32) {
    let qx = x.clamp(a.min.x, a.max.x);
    let qz = z.clamp(a.min.z, a.max.z);
    let (dx, dz) = (x - qx, z - qz);
    (dx, dz, dx * dx + dz * dz)
}

pub fn move_player(time: Res<Time>, keys: Res<ButtonInput<KeyCode>>, col: Res<Colliders>, mut q: Query<(&mut Transform, &mut Player)>) {
    let Ok((mut t, mut p)) = q.single_mut() else { return };
    let dt = time.delta_secs().min(0.05);
    let (mut fwd, mut side) = (0.0f32, 0.0f32);
    if keys.pressed(KeyCode::KeyW) || keys.pressed(KeyCode::ArrowUp) {
        fwd += 1.0;
    }
    if keys.pressed(KeyCode::KeyS) || keys.pressed(KeyCode::ArrowDown) {
        fwd -= 1.0;
    }
    if keys.pressed(KeyCode::KeyD) || keys.pressed(KeyCode::ArrowRight) {
        side += 1.0;
    }
    if keys.pressed(KeyCode::KeyA) || keys.pressed(KeyCode::ArrowLeft) {
        side -= 1.0;
    }
    let crouch = keys.pressed(KeyCode::ControlLeft);
    p.crouch += ((crouch as i32 as f32) - p.crouch) * (dt * 10.0).min(1.0);
    let speed = if crouch { 2.0 } else if keys.pressed(KeyCode::ShiftLeft) { 7.5 } else { 4.4 };
    let dir = (Vec3::new(-p.yaw.sin(), 0.0, -p.yaw.cos()) * fwd + Vec3::new(p.yaw.cos(), 0.0, -p.yaw.sin()) * side).normalize_or_zero();
    let target = dir * speed;
    let k = if p.grounded { 14.0 } else { 3.0 };
    p.vel.x += (target.x - p.vel.x) * (k * dt).min(1.0);
    p.vel.z += (target.z - p.vel.z) * (k * dt).min(1.0);
    let hh = H - 0.5 * p.crouch;
    let mut pos = t.translation;
    // horizontal : déplacement puis résolution (3 passes), avec montée de marche
    pos.x += p.vel.x * dt;
    pos.z += p.vel.z * dt;
    for _ in 0..3 {
        let mut vy = p.vel.y;
        let mut pp = pos;
        col.near(pos.x, pos.z, R + 0.2, |a| {
            if pp.y + hh <= a.min.y + 0.01 || pp.y >= a.max.y - 0.001 {
                return;
            }
            let (dx, dz, d2) = overlap_circle(a, pp.x, pp.z);
            if d2 >= R * R {
                return;
            }
            if a.max.y - pp.y <= STEP {
                pp.y = a.max.y;
                vy = vy.max(0.0);
                return;
            }
            if d2 > 1e-8 {
                let d = d2.sqrt();
                let m = (R - d) / d;
                pp.x += dx * m;
                pp.z += dz * m;
            } else {
                let (l, r, n, f) = (pp.x - a.min.x, a.max.x - pp.x, pp.z - a.min.z, a.max.z - pp.z);
                let m = l.min(r).min(n).min(f);
                if m == l { pp.x = a.min.x - R } else if m == r { pp.x = a.max.x + R } else if m == n { pp.z = a.min.z - R } else { pp.z = a.max.z + R }
            }
        });
        pos = pp;
        p.vel.y = vy;
    }
    // vertical
    let prev = pos.y;
    if keys.just_pressed(KeyCode::Space) && p.grounded {
        p.vel.y = 6.6;
    }
    p.vel.y -= 21.0 * dt;
    pos.y += p.vel.y * dt;
    let mut ground = 0.0f32;
    col.near(pos.x, pos.z, R + 0.1, |a| {
        let (_, _, d2) = overlap_circle(a, pos.x, pos.z);
        if d2 < R * R && a.max.y <= prev + STEP + 0.001 && a.max.y > ground {
            ground = a.max.y;
        }
    });
    p.grounded = false;
    if p.vel.y <= 0.0 && pos.y <= ground + 0.001 {
        pos.y = ground;
        p.vel.y = 0.0;
        p.grounded = true;
    }
    if p.vel.y > 0.0 {
        let mut ceil = f32::MAX;
        col.near(pos.x, pos.z, R + 0.1, |a| {
            let (_, _, d2) = overlap_circle(a, pos.x, pos.z);
            if d2 < R * R && a.min.y >= prev + hh - 0.05 && a.min.y < ceil {
                ceil = a.min.y;
            }
        });
        if pos.y + hh > ceil {
            pos.y = ceil - hh;
            p.vel.y = 0.0;
        }
    }
    if pos.y < -30.0 {
        pos = vec3(crate::city::PITCH / 2.0, 0.0, crate::city::PITCH / 2.0);
        p.vel = Vec3::ZERO;
    }
    t.translation = pos;
}
