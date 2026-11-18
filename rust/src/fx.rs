//! Effets : particules (éclats d'os, étincelles), traînées de balles, éclair de bouche.
use bevy::{light::NotShadowCaster, prelude::*};

#[derive(Resource)]
pub struct FxAssets {
    pub cube: Handle<Mesh>,
    pub bone: Handle<StandardMaterial>,
    pub dust: Handle<StandardMaterial>,
    pub spark: Handle<StandardMaterial>,
    pub tracer: Handle<StandardMaterial>,
}

#[derive(Component)]
pub struct Particle {
    pub vel: Vec3,
    pub life: f32,
    pub ttl: f32,
    pub size: f32,
}

#[derive(Component)]
pub struct Tracer {
    pub life: f32,
}

pub fn setup_fx(mut commands: Commands, mut meshes: ResMut<Assets<Mesh>>, mut mats: ResMut<Assets<StandardMaterial>>) {
    commands.insert_resource(FxAssets {
        cube: meshes.add(Cuboid::new(1.0, 1.0, 1.0)),
        bone: mats.add(StandardMaterial { base_color: Color::srgb(0.85, 0.82, 0.7), perceptual_roughness: 0.8, ..default() }),
        dust: mats.add(StandardMaterial { base_color: Color::srgb(0.35, 0.32, 0.28), perceptual_roughness: 1.0, ..default() }),
        spark: mats.add(StandardMaterial { base_color: Color::BLACK, emissive: LinearRgba::rgb(30.0, 16.0, 4.0), ..default() }),
        tracer: mats.add(StandardMaterial { base_color: Color::BLACK, emissive: LinearRgba::rgb(60.0, 45.0, 20.0), alpha_mode: AlphaMode::Add, ..default() }),
    });
}

pub fn rnd(seed: &mut u32) -> f32 {
    *seed = seed.wrapping_mul(1664525).wrapping_add(1013904223);
    ((*seed >> 8) & 0xffff) as f32 / 65535.0
}

#[derive(Clone, Copy)]
pub enum Kind {
    Bone,
    Dust,
    Spark,
}

pub fn burst(commands: &mut Commands, fx: &FxAssets, pos: Vec3, normal: Vec3, n: usize, kind: Kind, seed: &mut u32) {
    for _ in 0..n {
        let r = vec3(rnd(seed) - 0.5, rnd(seed) - 0.2, rnd(seed) - 0.5);
        let vel = (normal * 2.5 + r * 5.0) * (0.6 + rnd(seed));
        let (mat, size, ttl) = match kind {
            Kind::Bone => (fx.bone.clone(), 0.03 + rnd(seed) * 0.05, 0.7 + rnd(seed) * 0.6),
            Kind::Dust => (fx.dust.clone(), 0.04 + rnd(seed) * 0.05, 0.6 + rnd(seed) * 0.5),
            Kind::Spark => (fx.spark.clone(), 0.015 + rnd(seed) * 0.02, 0.25 + rnd(seed) * 0.25),
        };
        commands.spawn((Mesh3d(fx.cube.clone()), MeshMaterial3d(mat), Transform::from_translation(pos).with_scale(Vec3::splat(size)), Particle { vel, life: ttl, ttl, size }, NotShadowCaster));
    }
}

pub fn tracer(commands: &mut Commands, fx: &FxAssets, from: Vec3, to: Vec3) {
    let d = to - from;
    let len = d.length();
    if len < 0.5 {
        return;
    }
    let mid = from + d * 0.5;
    commands.spawn((
        Mesh3d(fx.cube.clone()),
        MeshMaterial3d(fx.tracer.clone()),
        Transform::from_translation(mid).looking_to(d / len, Vec3::Y).with_scale(vec3(0.012, 0.012, len)),
        Tracer { life: 0.07 },
        NotShadowCaster,
    ));
}

pub fn update_fx(mut commands: Commands, time: Res<Time>, mut p: Query<(Entity, &mut Transform, &mut Particle)>, mut t: Query<(Entity, &mut Tracer), Without<Particle>>) {
    let dt = time.delta_secs();
    for (e, mut tr, mut pa) in &mut p {
        pa.life -= dt;
        if pa.life <= 0.0 {
            commands.entity(e).despawn();
            continue;
        }
        pa.vel.y -= 9.8 * dt;
        tr.translation += pa.vel * dt;
        if tr.translation.y < 0.02 {
            tr.translation.y = 0.02;
            pa.vel = pa.vel * 0.15;
        }
        tr.scale = Vec3::splat(pa.size * (pa.life / pa.ttl).clamp(0.2, 1.0));
    }
    for (e, mut tc) in &mut t {
        tc.life -= dt;
        if tc.life <= 0.0 {
            commands.entity(e).despawn();
        }
    }
}
