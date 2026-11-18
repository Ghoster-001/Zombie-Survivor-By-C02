//! Interface : vie, munitions, arme, vague, score, viseur, marqueur de touche, flash de dégâts, écran de mort.
use crate::{game::Game, weapons};
use bevy::prelude::*;

#[derive(Component)]
pub struct HpBar;
#[derive(Component)]
pub struct HpText;
#[derive(Component)]
pub struct AmmoText;
#[derive(Component)]
pub struct WaveText;
#[derive(Component)]
pub struct Banner;
#[derive(Component)]
pub struct Hurt;
#[derive(Component)]
pub struct Marker;
#[derive(Component)]
pub struct Crosshair;
#[derive(Component)]
pub struct DeathText;

fn txt(size: f32, color: Color) -> (TextFont, TextColor) {
    (TextFont { font_size: FontSize::Px(size), ..default() }, TextColor(color))
}

pub fn setup_hud(mut commands: Commands) {
    // flash de dégâts plein écran
    commands.spawn((Hurt, Node { position_type: PositionType::Absolute, width: percent(100), height: percent(100), ..default() }, BackgroundColor(Color::srgba(0.6, 0.0, 0.0, 0.0))));
    // viseur
    for (w, h) in [(14.0, 2.0), (2.0, 14.0)] {
        commands.spawn((Crosshair, Node { position_type: PositionType::Absolute, left: percent(50), top: percent(50), width: px(w), height: px(h), margin: UiRect { left: px(-w / 2.0), top: px(-h / 2.0), ..default() }, ..default() }, BackgroundColor(Color::srgba(1.0, 1.0, 1.0, 0.8))));
    }
    commands.spawn((Marker, Node { position_type: PositionType::Absolute, left: percent(50), top: percent(50), width: px(26), height: px(26), margin: UiRect { left: px(-13), top: px(-13), ..default() }, border: UiRect::all(px(2)), ..default() }, BorderColor::all(Color::srgba(1.0, 0.3, 0.2, 0.0))));
    // vague / score
    commands.spawn((WaveText, Text::new(""), txt(24.0, Color::srgb(0.95, 0.9, 0.8)), Node { position_type: PositionType::Absolute, left: px(24), top: px(18), ..default() }));
    // vie
    commands.spawn((Node { position_type: PositionType::Absolute, left: px(24), bottom: px(24), width: px(300), height: px(26), border: UiRect::all(px(2)), ..default() }, BorderColor::all(Color::srgb(0.1, 0.1, 0.1)), BackgroundColor(Color::srgba(0.0, 0.0, 0.0, 0.55)))).with_children(|p| {
        p.spawn((HpBar, Node { width: percent(100), height: percent(100), ..default() }, BackgroundColor(Color::srgb(0.25, 0.7, 0.3))));
    });
    commands.spawn((HpText, Text::new("100"), txt(20.0, Color::WHITE), Node { position_type: PositionType::Absolute, left: px(332), bottom: px(24), ..default() }));
    // munitions
    commands.spawn((AmmoText, Text::new(""), txt(30.0, Color::srgb(1.0, 0.92, 0.7)), TextLayout::justify(Justify::Right), Node { position_type: PositionType::Absolute, right: px(28), bottom: px(24), ..default() }));
    // bannière de vague et écran de mort
    commands.spawn((Banner, Text::new(""), txt(64.0, Color::srgba(1.0, 0.85, 0.5, 0.0)), TextLayout::justify(Justify::Center), Node { position_type: PositionType::Absolute, left: percent(50), top: percent(22), margin: UiRect { left: px(-330), ..default() }, width: px(660), ..default() }));
    commands.spawn((DeathText, Text::new(""), txt(54.0, Color::srgba(1.0, 0.3, 0.25, 0.0)), TextLayout::justify(Justify::Center), Node { position_type: PositionType::Absolute, left: percent(50), top: percent(38), margin: UiRect { left: px(-400) , ..default() }, width: px(800), ..default() }));
}

#[allow(clippy::type_complexity)]
pub fn update_hud(
    g: Res<Game>,
    lo: Res<weapons::Loadout>,
    mut hp: Query<&mut Node, With<HpBar>>,
    mut hpt: Query<&mut Text, (With<HpText>, Without<AmmoText>, Without<WaveText>, Without<Banner>, Without<DeathText>)>,
    mut ammo: Query<&mut Text, (With<AmmoText>, Without<HpText>, Without<WaveText>, Without<Banner>, Without<DeathText>)>,
    mut wave: Query<&mut Text, (With<WaveText>, Without<HpText>, Without<AmmoText>, Without<Banner>, Without<DeathText>)>,
    mut banner: Query<(&mut Text, &mut TextColor), (With<Banner>, Without<DeathText>, Without<HpText>, Without<AmmoText>, Without<WaveText>)>,
    mut death: Query<(&mut Text, &mut TextColor), (With<DeathText>, Without<Banner>, Without<HpText>, Without<AmmoText>, Without<WaveText>)>,
    mut hurt: Query<&mut BackgroundColor, With<Hurt>>,
    mut marker: Query<&mut BorderColor, With<Marker>>,
    mut cross: Query<&mut Visibility, With<Crosshair>>,
) {
    for mut n in &mut hp {
        n.width = percent(100.0 * g.hp / g.max_hp);
    }
    for mut t in &mut hpt {
        **t = format!("{}", g.hp.ceil() as i32);
    }
    let w = &weapons::WEAPONS[lo.cur];
    for mut t in &mut ammo {
        **t = if w.melee { w.name.to_string() } else if lo.reload > 0.0 { format!("{}\nRECHARGEMENT…", w.name) } else { format!("{}\n{} / {}", w.name, lo.ammo[lo.cur], lo.reserve[lo.cur]) };
    }
    for mut t in &mut wave {
        **t = format!("VAGUE {}   ·   {} MORTS   ·   {} TÊTES", g.wave, g.kills, g.headshots);
    }
    for (mut t, mut c) in &mut banner {
        **t = format!("VAGUE {}", g.wave);
        c.0 = Color::srgba(1.0, 0.85, 0.5, (g.banner / 1.0).clamp(0.0, 1.0));
    }
    for (mut t, mut c) in &mut death {
        if g.dead {
            **t = format!("VOUS ÊTES MORT\nvague {} · {} morts\nR : recommencer", g.wave, g.kills);
            c.0 = Color::srgba(1.0, 0.3, 0.25, 1.0);
        } else {
            c.0 = Color::srgba(1.0, 0.3, 0.25, 0.0);
        }
    }
    for mut b in &mut hurt {
        b.0 = Color::srgba(0.6, 0.0, 0.0, 0.5 * g.hurt + if g.dead { 0.35 } else { 0.0 } + if g.hp < 30.0 && !g.dead { 0.12 } else { 0.0 });
    }
    for mut m in &mut marker {
        *m = BorderColor::all(if g.hit_head { Color::srgba(1.0, 0.85, 0.2, g.hit_marker) } else { Color::srgba(1.0, 0.3, 0.2, g.hit_marker) });
    }
    for mut v in &mut cross {
        *v = if lo.ads > 0.5 && w.zoom > 3.0 { Visibility::Hidden } else { Visibility::Inherited };
    }
}
