//! The Infected Grounds — version native (Bevy) : ville 3D réaliste, rendu physique (atmosphère, ombres, SSAO, reflets, brume volumétrique, bloom).
mod city;
mod enemy;
mod fx;
mod game;
mod hud;
mod mesh;
mod player;
mod steam;
mod tex;
mod weapons;

use bevy::{
    anti_alias::taa::TemporalAntiAliasing,
    camera::Exposure,
    core_pipeline::tonemapping::Tonemapping,
    light::{atmosphere::ScatteringMedium, light_consts::lux, Atmosphere, AtmosphereEnvironmentMapLight, CascadeShadowConfigBuilder, FogVolume, SunDisk, VolumetricFog, VolumetricLight},
    pbr::{AtmosphereSettings, DefaultOpaqueRendererMethod, ScreenSpaceAmbientOcclusion, ScreenSpaceReflections},
    post_process::bloom::Bloom,
    prelude::*,
    render::view::screenshot::{save_to_disk, Screenshot},
    window::PresentMode,
};

/// Mode capture d'écran (tests sans carte graphique) : IG_SHOT=chemin.png IG_CAM=x,y,z,yaw,pitch IG_FRAMES=n
#[derive(Resource, Default)]
pub struct ShotCfg {
    pub path: Option<String>,
    pub cam: Option<(Vec3, f32, f32)>,
    pub frames: u32,
}

fn main() {
    let mut shot = ShotCfg { frames: 60, ..default() };
    if let Ok(p) = std::env::var("IG_SHOT") {
        shot.path = Some(p);
    }
    if let Ok(c) = std::env::var("IG_CAM") {
        let v: Vec<f32> = c.split(',').filter_map(|s| s.trim().parse().ok()).collect();
        if v.len() == 5 {
            shot.cam = Some((vec3(v[0], v[1], v[2]), v[3], v[4]));
        }
    }
    if let Some(n) = std::env::var("IG_FRAMES").ok().and_then(|s| s.parse().ok()) {
        shot.frames = n;
    }
    let headless_shot = shot.path.is_some();
    App::new()
        .insert_resource(DefaultOpaqueRendererMethod::deferred())
        .insert_resource(ClearColor(Color::BLACK))
        .insert_resource(GlobalAmbientLight { brightness: 40.0, ..default() })
        .insert_resource(shot)
        .init_resource::<city::Colliders>()
        .init_resource::<game::Game>()
        .init_resource::<weapons::Loadout>()
        .add_plugins(DefaultPlugins.set(WindowPlugin {
            primary_window: Some(Window {
                title: "The Infected Grounds".into(),
                resolution: (if headless_shot { 1280 } else { 1600 }, if headless_shot { 720 } else { 900 }).into(),
                present_mode: PresentMode::AutoVsync,
                ..default()
            }),
            ..default()
        }))
        .add_plugins(steam::SteamPlugin)
        .add_systems(Startup, (setup_sky, city::build_city, player::spawn_player, setup_camera, fx::setup_fx, weapons::setup_weapons, enemy::setup_enemies, hud::setup_hud).chain())
        .add_systems(Update, (game::tick_game, player::grab_cursor, player::look, player::move_player, player::toggle_flashlight, weapons::weapon_system, enemy::wave_director, enemy::enemy_ai, enemy::enemy_anim, enemy::restart, fx::update_fx, hud::update_hud, city::cull_interior_lights, screenshot_and_exit).chain())
        .run();
}

fn setup_sky(mut commands: Commands, mut media: ResMut<Assets<ScatteringMedium>>) {
    let earth = media.add(ScatteringMedium::earth(256, 256));
    commands.spawn(Atmosphere::earth(earth));
    // soleil bas (fin de journée) : ombres longues, lumière dorée
    commands.spawn((
        DirectionalLight { shadow_maps_enabled: true, illuminance: lux::RAW_SUNLIGHT, ..default() },
        Transform::from_xyz(-0.9, 0.2, -0.55).looking_at(Vec3::ZERO, Vec3::Y),
        CascadeShadowConfigBuilder { num_cascades: 4, first_cascade_far_bound: 10.0, maximum_distance: 220.0, overlap_proportion: 0.25, ..default() }.build(),
        VolumetricLight,
        SunDisk::EARTH,
    ));
    // voile de brume sur toute la ville
    commands.spawn((FogVolume { density_factor: 0.012, scattering: 0.6, absorption: 0.05, ..default() }, Transform::from_scale(vec3(400.0, 45.0, 400.0)).with_translation(Vec3::Y * 20.0)));
}

fn setup_camera(mut commands: Commands, cam: Query<Entity, With<player::PlayerCam>>) {
    let Ok(e) = cam.single() else { return };
    commands.entity(e).insert((
        Camera3d::default(),
        Msaa::Off,
        Exposure { ev100: 12.0 },
        Tonemapping::AcesFitted,
        (Bloom::NATURAL, TemporalAntiAliasing::default(), ScreenSpaceAmbientOcclusion::default()),
        (AtmosphereSettings::default(), AtmosphereEnvironmentMapLight::default(), VolumetricFog { ambient_intensity: 0.0, ..default() }),
        ScreenSpaceReflections::default(),
        Projection::Perspective(PerspectiveProjection { fov: 75f32.to_radians(), near: 0.05, ..default() }),
    ));
}

fn screenshot_and_exit(mut commands: Commands, shot: Res<ShotCfg>, mut frame: Local<u32>, mut exit: MessageWriter<AppExit>) {
    let Some(path) = shot.path.clone() else { return };
    *frame += 1;
    if *frame == shot.frames {
        commands.spawn(Screenshot::primary_window()).observe(save_to_disk(path));
    }
    if *frame == shot.frames + 40 {
        exit.write(AppExit::Success);
    }
}
