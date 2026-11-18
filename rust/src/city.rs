//! La ville : blocs, immeubles enterables (fenêtres vraiment ouvertes, escaliers, pièces meublées, toits), rues, voitures et mobilier (modèles glTF CC0).
use crate::mesh::{Aabb, MeshBuilder};
use crate::tex;
use bevy::{light::NotShadowCaster, prelude::*};
use std::collections::HashMap;

pub const FH: f32 = 3.5; // hauteur d'étage
pub const TH: f32 = 0.6; // épaisseur des murs
pub const BW: f32 = 14.0; // largeur d'un immeuble
pub const N: i32 = 7; // blocs par côté
pub const PITCH: f32 = 22.5; // pas de la grille (bloc + rue)
pub const BLK: f32 = 15.0;
pub const RD: f32 = 7.5; // largeur de rue
pub const WIN_Y0: f32 = 0.25;
pub const WIN_Y1: f32 = 2.75;
pub const DOOR_H: f32 = 2.75;
const STEPS: usize = 14;

pub fn limit() -> f32 {
    (N - 1) as f32 / 2.0 * PITCH + 14.0
}

/// Obstacles : pavés alignés sur les axes, rangés dans une grille pour des tests rapides.
#[derive(Resource, Default)]
pub struct Colliders {
    pub boxes: Vec<Aabb>,
    grid: HashMap<(i32, i32), Vec<u32>>,
}
const CELL: f32 = 8.0;
impl Colliders {
    pub fn add(&mut self, min: Vec3, max: Vec3) {
        let id = self.boxes.len() as u32;
        self.boxes.push(Aabb { min, max });
        for cx in (min.x / CELL).floor() as i32..=(max.x / CELL).floor() as i32 {
            for cz in (min.z / CELL).floor() as i32..=(max.z / CELL).floor() as i32 {
                self.grid.entry((cx, cz)).or_default().push(id);
            }
        }
    }
    pub fn near(&self, x: f32, z: f32, r: f32, mut f: impl FnMut(&Aabb)) {
        let mut seen: Vec<u32> = Vec::new();
        for cx in ((x - r) / CELL).floor() as i32..=((x + r) / CELL).floor() as i32 {
            for cz in ((z - r) / CELL).floor() as i32..=((z + r) / CELL).floor() as i32 {
                if let Some(l) = self.grid.get(&(cx, cz)) {
                    for &id in l {
                        if !seen.contains(&id) {
                            seen.push(id);
                            f(&self.boxes[id as usize]);
                        }
                    }
                }
            }
        }
    }
}

pub struct Rng(pub u64);
impl Rng {
    pub fn next(&mut self) -> f32 {
        self.0 = self.0.wrapping_mul(6364136223846793005).wrapping_add(1442695040888963407);
        ((self.0 >> 33) as f32) / (1u64 << 31) as f32
    }
    pub fn range(&mut self, a: f32, b: f32) -> f32 {
        a + (b - a) * self.next()
    }
    pub fn pick<T: Copy>(&mut self, l: &[T]) -> T {
        l[((self.next() * l.len() as f32) as usize).min(l.len() - 1)]
    }
}

struct Gap {
    u0: f32,
    u1: f32,
    door: bool,
}

fn gaps(ground: bool) -> Vec<Gap> {
    let u = |px: f32| px / 512.0 * BW - BW / 2.0;
    let mut g = Vec::new();
    for c in 0..4 {
        if ground && (c == 1 || c == 2) {
            continue;
        }
        g.push(Gap { u0: u(36.0 + 128.0 * c as f32), u1: u(92.0 + 128.0 * c as f32), door: false });
        if ground && c == 0 {
            g.push(Gap { u0: u(224.0), u1: u(288.0), door: true });
        }
    }
    g.sort_by(|a, b| a.u0.partial_cmp(&b.u0).unwrap());
    g
}

pub struct Lights {
    pub lamps: Vec<Vec3>,
}

/// Géométrie d'un immeuble : renvoie (murs briques/béton, structure, mobilier, lampes de plafond)
struct Bld {
    walls: MeshBuilder,
    inside: MeshBuilder, // planchers, plafonds, marches, cloisons
    furn: MeshBuilder,
    glow: MeshBuilder,
}

fn stair_rect(i: f32, g: usize) -> (f32, f32, f32, f32) {
    // (u0,u1,z0,z1) dans le repère de l'immeuble
    if g % 2 == 0 { (-i + 1.5, i - 1.5, i - 2.6, i - 1.3) } else { (-i + 1.5, i - 1.5, i - 1.3, i) }
}

fn put(b: &mut MeshBuilder, col: &mut Colliders, min: Vec3, max: Vec3, color: [f32; 4], tile: f32, solid: bool) {
    b.cuboid(min, max, color, tile);
    if solid {
        col.add(min, max);
    }
}

fn building(cx: f32, cz: f32, fl: usize, rng: &mut Rng, col: &mut Colliders) -> Bld {
    let mut b = Bld { walls: MeshBuilder::default(), inside: MeshBuilder::default(), furn: MeshBuilder::default(), glow: MeshBuilder::default() };
    let half = BW / 2.0;
    let i = half - TH;
    let w = [1.0, 1.0, 1.0, 1.0];
    let h = fl as f32 * FH;
    // --- murs : chaque côté est un assemblage de pavés autour des fenêtres et de la porte ---
    for side in 0..4 {
        let mut wallbox = |u0: f32, u1: f32, y0: f32, y1: f32, b: &mut Bld| {
            let (u0, u1) = if side >= 2 { (u0.max(-half + TH), u1.min(half - TH)) } else { (u0, u1) };
            if u1 - u0 < 1e-3 || y1 - y0 < 1e-3 {
                return;
            }
            let (mn, mx) = match side {
                0 => (vec3(cx + u0, y0, cz - half), vec3(cx + u1, y1, cz - half + TH)),
                1 => (vec3(cx + u0, y0, cz + half - TH), vec3(cx + u1, y1, cz + half)),
                2 => (vec3(cx - half, y0, cz + u0), vec3(cx - half + TH, y1, cz + u1)),
                _ => (vec3(cx + half - TH, y0, cz + u0), vec3(cx + half, y1, cz + u1)),
            };
            put(&mut b.walls, col, mn, mx, w, 2.0, true);
        };
        for f in 0..fl {
            let fy = f as f32 * FH;
            let g = gaps(f == 0);
            let mut cur = -half;
            for gap in &g {
                wallbox(cur, gap.u0, fy, fy + FH, &mut b);
                if gap.door {
                    wallbox(gap.u0, gap.u1, fy + DOOR_H, fy + FH, &mut b);
                } else {
                    wallbox(gap.u0, gap.u1, fy, fy + WIN_Y0, &mut b);
                    wallbox(gap.u0, gap.u1, fy + WIN_Y1, fy + FH, &mut b);
                }
                cur = gap.u1;
            }
            wallbox(cur, half, fy, fy + FH, &mut b);
        }
    }
    // --- sol du rez-de-chaussée, planchers (avec trémie d'escalier), toit et acrotère ---
    put(&mut b.inside, col, vec3(cx - i, 0.0, cz - i), vec3(cx + i, 0.03, cz + i), [0.9, 0.85, 0.8, 1.0], 2.0, false);
    for f in 1..=fl {
        let top = f as f32 * FH;
        let roof = f == fl;
        let (x0, x1, z0, z1) = if roof { (-half, half, -half, half) } else { (-i, i, -i, i) };
        let (hu0, hu1, hz0, hz1) = stair_rect(i, f - 1);
        let (y0, y1) = (top - 0.25, top + if roof { 0.02 } else { 0.0 });
        let pieces = [(x0, hu0, z0, z1), (hu1, x1, z0, z1), (hu0, hu1, z0, hz0), (hu0, hu1, hz1, z1)];
        let c = if roof { [0.55, 0.55, 0.58, 1.0] } else { [0.8, 0.78, 0.74, 1.0] };
        for (a0, a1, c0, c1) in pieces {
            put(&mut b.inside, col, vec3(cx + a0, y0, cz + c0), vec3(cx + a1, y1, cz + c1), c, 2.0, true);
        }
    }
    {
        let (pe, ph) = (0.55, 1.1);
        let y0 = h + 0.02;
        let pc = [0.62, 0.6, 0.58, 1.0];
        put(&mut b.walls, col, vec3(cx - half, y0, cz - half), vec3(cx + half, y0 + ph, cz - half + pe), pc, 2.0, true);
        put(&mut b.walls, col, vec3(cx - half, y0, cz + half - pe), vec3(cx + half, y0 + ph, cz + half), pc, 2.0, true);
        put(&mut b.walls, col, vec3(cx - half, y0, cz - half + pe), vec3(cx - half + pe, y0 + ph, cz + half - pe), pc, 2.0, true);
        put(&mut b.walls, col, vec3(cx + half - pe, y0, cz - half + pe), vec3(cx + half, y0 + ph, cz + half - pe), pc, 2.0, true);
        // équipements du toit
        for _ in 0..4 {
            let (px, pz) = (rng.range(-half + 2.5, half - 2.5), rng.range(-half + 2.5, half - 2.5));
            let (sx, sz, sy) = (rng.range(1.2, 2.2), rng.range(1.0, 1.8), rng.range(0.7, 1.4));
            put(&mut b.inside, col, vec3(cx + px - sx / 2.0, y0, cz + pz - sz / 2.0), vec3(cx + px + sx / 2.0, y0 + sy, cz + pz + sz / 2.0), [0.5, 0.52, 0.55, 1.0], 1.0, true);
            b.inside.cuboid(vec3(cx + px - sx / 2.0 + 0.2, y0 + sy, cz + pz - sz / 2.0 + 0.2), vec3(cx + px + sx / 2.0 - 0.2, y0 + sy + 0.05, cz + pz + sz / 2.0 - 0.2), [0.12, 0.12, 0.13, 1.0], 1.0);
        }
        let (ax, az) = (rng.range(-3.0, 3.0), rng.range(-3.0, 3.0));
        b.inside.cuboid_c(vec3(cx + ax, y0 + 2.2, cz + az), vec3(0.1, 4.4, 0.1), [0.12, 0.12, 0.13, 1.0], 1.0);
        b.glow.cuboid_c(vec3(cx + ax, y0 + 4.5, cz + az), vec3(0.22, 0.22, 0.22), [1.0, 0.1, 0.05, 1.0], 1.0);
    }
    // --- escaliers : deux volées côte à côte le long du mur +z, marches pleines ---
    for g in 0..fl {
        let (u0, u1, z0, z1) = stair_rect(i, g);
        let l = (u1 - u0) / STEPS as f32;
        let base = g as f32 * FH;
        for s in 0..STEPS {
            let (a, c) = if g % 2 == 0 { (u0 + l * s as f32, u0 + l * (s + 1) as f32) } else { (u1 - l * (s + 1) as f32, u1 - l * s as f32) };
            let top = base + FH * (s + 1) as f32 / STEPS as f32;
            put(&mut b.inside, col, vec3(cx + a, base, cz + z0), vec3(cx + c, top, cz + z1), [0.62, 0.6, 0.57, 1.0], 1.0, true);
        }
    }
    // --- cloisons et mobilier ---
    let (zs, z0n, z1s) = (0.0f32, -i + 0.15, i - 2.8);
    let pu = 3.5;
    for f in 0..fl {
        let fy = f as f32 * FH + 0.03;
        let ch = FH - 0.3;
        let pc = [0.85, 0.82, 0.76, 1.0];
        if f > 0 {
            let zcn = (z0n + zs) / 2.0;
            let zcs = (zs + z1s) / 2.0;
            for s in [-1.0f32, 1.0] {
                let u = s * pu;
                for (a, c) in [(z0n, zcn - 0.95), (zcn + 0.95, zcs - 0.95), (zcs + 0.95, z1s)] {
                    put(&mut b.inside, col, vec3(cx + u - 0.1, fy, cz + a), vec3(cx + u + 0.1, fy + ch, cz + c), pc, 2.0, true);
                }
                for (a, c) in [(zcn - 0.95, zcn + 0.95), (zcs - 0.95, zcs + 0.95)] {
                    put(&mut b.inside, col, vec3(cx + u - 0.1, fy + DOOR_H, cz + a), vec3(cx + u + 0.1, fy + ch, cz + c), pc, 2.0, true);
                }
            }
            let ucs = [-4.9f32, 0.0, 4.9];
            let mut cur = -i + 0.15;
            for uc in ucs {
                put(&mut b.inside, col, vec3(cx + cur, fy, cz + zs - 0.1), vec3(cx + uc - 0.95, fy + ch, cz + zs + 0.1), pc, 2.0, true);
                put(&mut b.inside, col, vec3(cx + uc - 0.95, fy + DOOR_H, cz + zs - 0.1), vec3(cx + uc + 0.95, fy + ch, cz + zs + 0.1), pc, 2.0, true);
                cur = uc + 0.95;
            }
            put(&mut b.inside, col, vec3(cx + cur, fy, cz + zs - 0.1), vec3(cx + i - 0.15, fy + ch, cz + zs + 0.1), pc, 2.0, true);
        }
        // pièces : (centre u, centre z, demi-largeur, demi-profondeur)
        let rooms: Vec<(f32, f32, f32, f32)> = if f == 0 {
            vec![(-4.9, (z0n + z1s) / 2.0, 1.3, (z1s - z0n) / 2.0), (0.0, (z0n + z1s) / 2.0, 3.3, (z1s - z0n) / 2.0), (4.9, (z0n + z1s) / 2.0, 1.3, (z1s - z0n) / 2.0)]
        } else {
            let (zcn, zcs) = ((z0n + zs) / 2.0, (zs + z1s) / 2.0);
            let hn = (zs - z0n) / 2.0 - 0.1;
            let hs = (z1s - zs) / 2.0 - 0.1;
            vec![(-4.9, zcn, 1.3, hn), (0.0, zcn, 3.3, hn), (4.9, zcn, 1.3, hn), (-4.9, zcs, 1.3, hs), (0.0, zcs, 3.3, hs), (4.9, zcs, 1.3, hs)]
        };
        for (k, (ru, rz, hu, hz)) in rooms.iter().enumerate() {
            let kind = if f == 0 { 6 + k % 3 } else { (rng.next() * 6.0) as usize % 6 };
            furnish(&mut b, col, cx + ru, cz + rz, *hu, *hz, fy, kind, rng);
            // dalle lumineuse de plafond
            b.glow.cuboid_c(vec3(cx + ru, fy + FH - 0.32, cz + rz), vec3(0.9, 0.04, 0.9), [1.0, 0.93, 0.78, 1.0], 1.0);
        }
    }
    b
}

#[allow(clippy::too_many_arguments)]
fn furnish(b: &mut Bld, col: &mut Colliders, cx: f32, cz: f32, hu: f32, hz: f32, y: f32, kind: usize, rng: &mut Rng) {
    let mut bx = |dx: f32, dz: f32, sx: f32, sy: f32, sz: f32, y0: f32, c: [f32; 4], solid: bool| {
        let mn = vec3(cx + dx - sx / 2.0, y + y0, cz + dz - sz / 2.0);
        let mx = vec3(cx + dx + sx / 2.0, y + y0 + sy, cz + dz + sz / 2.0);
        put(&mut b.furn, col, mn, mx, c, 1.0, solid);
    };
    let fab = [[0.25, 0.3, 0.42, 1.0], [0.42, 0.22, 0.2, 1.0], [0.3, 0.38, 0.3, 1.0], [0.5, 0.45, 0.35, 1.0]];
    let f1 = rng.pick(&fab);
    let wd = [0.32, 0.2, 0.12, 1.0];
    match kind {
        0 => {
            // salon : canapé, table basse, meuble TV, tapis
            bx(0.0, 0.0, hu * 1.2, 0.01, hz * 1.0, 0.0, [0.5, 0.2, 0.18, 1.0], false);
            bx(0.0, hz - 0.5, 2.1, 0.45, 0.9, 0.0, f1, true);
            bx(0.0, hz - 0.85, 2.1, 0.5, 0.2, 0.45, f1, false);
            bx(0.0, 0.0, 1.1, 0.4, 0.6, 0.0, wd, true);
            bx(0.0, -hz + 0.3, 1.6, 0.5, 0.4, 0.0, [0.1, 0.1, 0.11, 1.0], true);
            bx(0.0, -hz + 0.3, 1.2, 0.7, 0.05, 0.6, [0.02, 0.02, 0.03, 1.0], false);
        }
        1 => {
            // cuisine : plan de travail, frigo, table
            bx(0.0, -hz + 0.35, hu * 1.6, 0.9, 0.6, 0.0, [0.75, 0.75, 0.72, 1.0], true);
            bx(hu - 0.5, -hz + 0.45, 0.7, 1.9, 0.7, 0.0, [0.78, 0.8, 0.82, 1.0], true);
            bx(0.0, 0.5, 1.2, 0.75, 0.8, 0.0, wd, true);
        }
        2 => {
            // chambre : lit, armoire, chevets
            bx(-hu + 1.1, 0.0, 2.0, 0.45, 1.6, 0.0, wd, true);
            bx(-hu + 1.1, 0.0, 1.9, 0.25, 1.5, 0.45, [0.85, 0.83, 0.78, 1.0], false);
            bx(hu - 0.35, -hz + 0.5, 0.7, 2.0, 1.3, 0.0, [0.3, 0.2, 0.13, 1.0], true);
            bx(-hu + 1.1, hz - 0.6, 0.5, 0.5, 0.5, 0.0, wd, true);
        }
        3 => {
            // bureau : deux postes
            for k in [-1.0f32, 1.0] {
                bx(k * hu * 0.5, -hz + 0.5, 1.4, 0.75, 0.7, 0.0, [0.55, 0.5, 0.42, 1.0], true);
                bx(k * hu * 0.5, -hz + 0.3, 0.6, 0.35, 0.05, 0.75, [0.02, 0.03, 0.05, 1.0], false);
                bx(k * hu * 0.5, -hz + 1.3, 0.5, 0.5, 0.5, 0.0, [0.12, 0.12, 0.14, 1.0], true);
            }
        }
        4 => {
            // salle de bain : baignoire, lavabo
            bx(0.0, -hz + 0.45, hu * 1.7, 0.55, 0.8, 0.0, [0.9, 0.92, 0.95, 1.0], true);
            bx(hu - 0.35, hz - 0.35, 0.6, 0.85, 0.45, 0.0, [0.9, 0.92, 0.95, 1.0], true);
        }
        5 => {
            // rangement : caisses et étagères
            for _ in 0..4 {
                let (dx, dz) = (rng.range(-hu + 0.5, hu - 0.5), rng.range(-hz + 0.5, hz - 0.5));
                bx(dx, dz, 0.7, rng.range(0.4, 0.9), 0.7, 0.0, [0.45, 0.34, 0.2, 1.0], true);
            }
            bx(-hu + 0.25, 0.0, 0.4, 2.0, hz * 1.4, 0.0, [0.4, 0.42, 0.45, 1.0], true);
        }
        6 => {
            // rez-de-chaussée : rayonnages de boutique
            for k in 0..3 {
                bx(0.0, -hz + 1.2 + k as f32 * (hz * 2.0 - 2.4) / 2.0, hu * 1.6, 1.6, 0.45, 0.0, [0.45, 0.47, 0.5, 1.0], true);
            }
        }
        7 => {
            // hall : banque d'accueil, banquettes
            bx(0.0, hz - 1.2, hu * 1.4, 1.1, 0.8, 0.0, wd, true);
            bx(-hu + 0.6, -hz + 1.0, 1.5, 0.45, 0.7, 0.0, f1, true);
            bx(hu - 0.6, -hz + 1.0, 1.5, 0.45, 0.7, 0.0, f1, true);
        }
        _ => {
            // café : tables et chaises
            for k in 0..3 {
                let dz = -hz + 1.2 + k as f32 * 2.0;
                bx(0.0, dz, 0.9, 0.75, 0.9, 0.0, wd, true);
                bx(0.8, dz, 0.4, 0.45, 0.4, 0.0, [0.4, 0.2, 0.15, 1.0], true);
                bx(-0.8, dz, 0.4, 0.45, 0.4, 0.0, [0.4, 0.2, 0.15, 1.0], true);
            }
        }
    }
}

pub struct Mats {
    pub brick: Vec<Handle<StandardMaterial>>,
    pub concrete: Vec<Handle<StandardMaterial>>,
}

fn pbr(images: &mut Assets<Image>, mats: &mut Assets<StandardMaterial>, set: tex::PbrSet, uv_scale: f32, rough: f32) -> Handle<StandardMaterial> {
    let _ = images;
    mats.add(StandardMaterial {
        base_color_texture: Some(set.albedo),
        normal_map_texture: Some(set.normal),
        metallic_roughness_texture: Some(set.mr),
        perceptual_roughness: rough,
        metallic: 1.0, // multiplié par le canal B de la texture (0 ici)
        uv_transform: bevy::math::Affine2::from_scale(Vec2::splat(uv_scale)),
        ..default()
    })
}

pub fn build_city(
    mut commands: Commands,
    mut meshes: ResMut<Assets<Mesh>>,
    mut materials: ResMut<Assets<StandardMaterial>>,
    mut images: ResMut<Assets<Image>>,
    assets: Res<AssetServer>,
    mut col: ResMut<Colliders>,
) {
    let mut rng = Rng(0x1CEDCAFE);
    let half = N as f32 * PITCH / 2.0;
    // matériaux
    let brick: Vec<_> = [([0.55, 0.26, 0.2], 1), ([0.5, 0.36, 0.24], 2), ([0.4, 0.2, 0.17], 3)]
        .iter()
        .map(|(c, s)| {
            let t = tex::brick(&mut images, *c, *s);
            pbr(&mut images, &mut materials, t, 1.0, 1.0)
        })
        .collect();
    let conc: Vec<_> = [([0.55, 0.55, 0.57], 11), ([0.5, 0.52, 0.56], 12)]
        .iter()
        .map(|(c, s)| {
            let t = tex::concrete(&mut images, *c, *s);
            pbr(&mut images, &mut materials, t, 1.0, 1.0)
        })
        .collect();
    let plaster = {
        let t = tex::plaster(&mut images);
        pbr(&mut images, &mut materials, t, 1.0, 1.0)
    };
    let wood = {
        let t = tex::wood(&mut images);
        pbr(&mut images, &mut materials, t, 1.0, 1.0)
    };
    let asphalt = {
        let t = tex::asphalt(&mut images);
        materials.add(StandardMaterial {
            base_color_texture: Some(t.albedo),
            normal_map_texture: Some(t.normal),
            metallic_roughness_texture: Some(t.mr),
            perceptual_roughness: 1.0,
            metallic: 1.0,
            reflectance: 0.6,
            uv_transform: bevy::math::Affine2::from_scale(Vec2::splat(60.0)),
            ..default()
        })
    };
    let pave = {
        let t = tex::pavement(&mut images);
        pbr(&mut images, &mut materials, t, 1.0, 1.0)
    };
    let plain = materials.add(StandardMaterial { base_color: Color::WHITE, perceptual_roughness: 0.85, ..default() });
    let furn_mat = materials.add(StandardMaterial { base_color: Color::WHITE, perceptual_roughness: 0.7, ..default() });
    let glow_mat = materials.add(StandardMaterial { base_color: Color::BLACK, emissive: LinearRgba::rgb(40.0, 36.0, 28.0), ..default() });
    let paint_y = materials.add(StandardMaterial { base_color: Color::srgb(0.85, 0.7, 0.2), perceptual_roughness: 0.6, ..default() });
    let paint_w = materials.add(StandardMaterial { base_color: Color::srgb(0.85, 0.85, 0.82), perceptual_roughness: 0.6, ..default() });

    // sol : une grande dalle d'asphalte
    commands.spawn((Mesh3d(meshes.add(Plane3d::default().mesh().size(520.0, 520.0))), MeshMaterial3d(asphalt), Transform::default()));
    // blocs (trottoirs) et marquages
    let mut curbs = MeshBuilder::default();
    let mut marks_y = MeshBuilder::default();
    let mut marks_w = MeshBuilder::default();
    for i in 0..N {
        for j in 0..N {
            let (cx, cz) = ((i as f32 - (N - 1) as f32 / 2.0) * PITCH, (j as f32 - (N - 1) as f32 / 2.0) * PITCH);
            let (mn, mx) = (vec3(cx - BLK / 2.0, 0.0, cz - BLK / 2.0), vec3(cx + BLK / 2.0, 0.2, cz + BLK / 2.0));
            curbs.cuboid(mn, mx, [1.0; 4], 2.0);
            col.add(mn, mx);
        }
    }
    for k in 0..=N {
        let c = k as f32 * PITCH - half;
        let mut t = -half - 4.0;
        while t < half + 4.0 {
            let mm = (t + half).rem_euclid(PITCH);
            if mm > RD / 2.0 + 1.5 && mm < PITCH - RD / 2.0 - 1.5 {
                marks_y.cuboid(vec3(c - 0.07, 0.012, t), vec3(c + 0.07, 0.016, t + 1.6), [1.0; 4], 1.0);
                marks_y.cuboid(vec3(t, 0.012, c - 0.07), vec3(t + 1.6, 0.016, c + 0.07), [1.0; 4], 1.0);
            }
            t += 3.2;
        }
        for l in 0..=N {
            let o = l as f32 * PITCH - half;
            for s in 0..9 {
                let d = -1.9 + s as f32 * 0.5;
                let z = RD / 2.0 + 0.7;
                marks_w.cuboid(vec3(c + d, 0.012, o - z - 1.0), vec3(c + d + 0.28, 0.016, o - z + 1.0), [1.0; 4], 1.0);
                marks_w.cuboid(vec3(c + d, 0.012, o + z - 1.0), vec3(c + d + 0.28, 0.016, o + z + 1.0), [1.0; 4], 1.0);
                marks_w.cuboid(vec3(o - z - 1.0, 0.012, c + d), vec3(o - z + 1.0, 0.016, c + d + 0.28), [1.0; 4], 1.0);
                marks_w.cuboid(vec3(o + z - 1.0, 0.012, c + d), vec3(o + z + 1.0, 0.016, c + d + 0.28), [1.0; 4], 1.0);
            }
        }
    }
    commands.spawn((Mesh3d(meshes.add(curbs.build())), MeshMaterial3d(pave), Transform::default()));
    commands.spawn((Mesh3d(meshes.add(marks_y.build())), MeshMaterial3d(paint_y), Transform::default(), NotShadowCaster));
    commands.spawn((Mesh3d(meshes.add(marks_w.build())), MeshMaterial3d(paint_w), Transform::default(), NotShadowCaster));

    // immeubles
    let mut lamps_in: Vec<Vec3> = Vec::new();
    for i in 0..N {
        for j in 0..N {
            let (cx, cz) = ((i as f32 - (N - 1) as f32 / 2.0) * PITCH, (j as f32 - (N - 1) as f32 / 2.0) * PITCH);
            let mid = i == N / 2 && j == N / 2;
            if rng.next() < 0.18 || mid {
                continue;
            }
            let fl = rng.pick(&[4usize, 4, 8, 8, 8, 12]);
            let v = (rng.next() * 5.0) as usize;
            info!("immeuble {cx} {cz} etages {fl}");
            let bld = building(cx, cz, fl, &mut rng, &mut col);
            let wall_mat = if v < 3 { brick[v].clone() } else { conc[v - 3].clone() };
            commands.spawn((Mesh3d(meshes.add(bld.walls.build())), MeshMaterial3d(wall_mat), Transform::default()));
            commands.spawn((Mesh3d(meshes.add(bld.inside.build())), MeshMaterial3d(plaster.clone()), Transform::default()));
            if !bld.furn.is_empty() {
                commands.spawn((Mesh3d(meshes.add(bld.furn.build())), MeshMaterial3d(furn_mat.clone()), Transform::default()));
            }
            commands.spawn((Mesh3d(meshes.add(bld.glow.build())), MeshMaterial3d(glow_mat.clone()), Transform::default(), NotShadowCaster));
            for f in 0..fl.min(3) {
                lamps_in.push(vec3(cx, f as f32 * FH + 2.6, cz - 1.5));
                lamps_in.push(vec3(cx, f as f32 * FH + 2.6, cz + 2.0));
            }
        }
    }
    let _ = (&plain, &wood);
    commands.insert_resource(InteriorLights(lamps_in.clone()));
    for p in lamps_in {
        commands.spawn((
            PointLight { intensity: 22_000.0, range: 11.0, color: Color::srgb(1.0, 0.86, 0.66), shadow_maps_enabled: false, ..default() },
            Transform::from_translation(p),
            InteriorLight,
        ));
    }

    // lampadaires aux carrefours
    let pole_mat = materials.add(StandardMaterial { base_color: Color::srgb(0.12, 0.13, 0.14), metallic: 0.7, perceptual_roughness: 0.45, ..default() });
    let bulb_mat = materials.add(StandardMaterial { base_color: Color::BLACK, emissive: LinearRgba::rgb(120.0, 80.0, 40.0), ..default() });
    let mut poles = MeshBuilder::default();
    let mut bulbs = MeshBuilder::default();
    for k in 1..N {
        for l in 1..N {
            let (x0, z0) = (k as f32 * PITCH - half, l as f32 * PITCH - half);
            let (x, z) = (x0 + RD / 2.0 - 0.6, z0 + RD / 2.0 - 0.6);
            poles.cuboid_c(vec3(x, 3.75, z), vec3(0.14, 7.5, 0.14), [1.0; 4], 1.0);
            poles.cuboid_c(vec3(x - 0.55, 7.45, z), vec3(1.2, 0.1, 0.1), [1.0; 4], 1.0);
            bulbs.cuboid_c(vec3(x - 1.05, 7.38, z), vec3(0.5, 0.1, 0.3), [1.0; 4], 1.0);
            col.add(vec3(x - 0.2, 0.0, z - 0.2), vec3(x + 0.2, 7.5, z + 0.2));
            commands.spawn((
                PointLight { intensity: 900_000.0, range: 24.0, color: Color::srgb(1.0, 0.72, 0.42), shadow_maps_enabled: false, ..default() },
                Transform::from_xyz(x - 1.05, 7.0, z),
            ));
        }
    }
    commands.spawn((Mesh3d(meshes.add(poles.build())), MeshMaterial3d(pole_mat), Transform::default()));
    commands.spawn((Mesh3d(meshes.add(bulbs.build())), MeshMaterial3d(bulb_mat), Transform::default(), NotShadowCaster));

    // voitures et mobilier (modèles glTF CC0 KayKit)
    let scene = |name: &str| assets.load(GltfAssetLabel::Scene(0).from_asset(format!("models/city/{name}.gltf")));
    let cars = ["car_hatchback", "car_police", "car_sedan", "car_stationwagon", "car_taxi"];
    let cs = 5.5;
    let mut placed = 0;
    let mut tries = 0;
    while placed < 70 && tries < 600 {
        tries += 1;
        let k = (rng.next() * (N + 1) as f32) as i32;
        let vert = rng.next() < 0.5;
        let c = k as f32 * PITCH - half;
        let t = rng.range(-half + 6.0, half - 6.0);
        let mm = (t + half).rem_euclid(PITCH);
        if mm < RD / 2.0 + 3.5 || mm > PITCH - RD / 2.0 - 3.5 {
            continue;
        }
        let off = if rng.next() < 0.5 { -1.0 } else { 1.0 } * rng.range(1.0, 2.0);
        let (x, z) = if vert { (c + off, t) } else { (t, c + off) };
        let (sx, sz) = if vert { (2.4, 5.4) } else { (5.4, 2.4) };
        let mut hit = false;
        col.near(x, z, 4.0, |a| {
            if x + sx / 2.0 > a.min.x && x - sx / 2.0 < a.max.x && z + sz / 2.0 > a.min.z && z - sz / 2.0 < a.max.z {
                hit = true;
            }
        });
        if hit {
            continue;
        }
        let model = rng.pick(&cars);
        let ry = if vert { 0.0 } else { std::f32::consts::FRAC_PI_2 } + if rng.next() < 0.5 { std::f32::consts::PI } else { 0.0 } + rng.range(-0.04, 0.04);
        commands.spawn((WorldAssetRoot(scene(model)), Transform::from_xyz(x, 0.07 * cs, z).with_rotation(Quat::from_rotation_y(ry)).with_scale(Vec3::splat(cs))));
        col.add(vec3(x - sx / 2.0, 0.0, z - sz / 2.0), vec3(x + sx / 2.0, 1.6, z + sz / 2.0));
        placed += 1;
    }
    // mobilier urbain le long des trottoirs
    let props: [(&str, f32, [f32; 2], f32); 7] = [
        ("firehydrant", 5.5, [0.7, 0.7], 1.2),
        ("trash_A", 5.5, [0.0, 0.0], 0.0),
        ("bench", 5.5, [2.4, 0.8], 0.9),
        ("bush", 5.5, [1.0, 1.0], 1.6),
        ("box_A", 5.5, [1.0, 1.0], 1.0),
        ("dumpster", 5.5, [3.2, 1.8], 1.6),
        ("box_B", 5.5, [0.8, 0.8], 0.8),
    ];
    for i in 0..N {
        for j in 0..N {
            let (cx, cz) = ((i as f32 - (N - 1) as f32 / 2.0) * PITCH, (j as f32 - (N - 1) as f32 / 2.0) * PITCH);
            for (nx, nz) in [(0.0f32, -1.0f32), (0.0, 1.0), (-1.0, 0.0), (1.0, 0.0)] {
                for _ in 0..3 {
                    if rng.next() > 0.5 {
                        continue;
                    }
                    let (name, s, sz2, hh) = rng.pick(&props);
                    let t = if rng.next() < 0.5 { -1.0 } else { 1.0 } * rng.range(2.8, 6.0);
                    let d = BLK / 2.0 + 0.9 + sz2[1] / 2.0;
                    let (x, z) = (cx + nx * d + if nz != 0.0 { t } else { 0.0 }, cz + nz * d + if nx != 0.0 { t } else { 0.0 });
                    let (ex, ez) = (sz2[0] / 2.0 + 0.4, sz2[1] / 2.0 + 0.4);
                    let mut hit = false;
                    col.near(x, z, 5.0, |a| {
                        if x + ex > a.min.x && x - ex < a.max.x && z + ez > a.min.z && z - ez < a.max.z {
                            hit = true;
                        }
                    });
                    if hit {
                        continue;
                    }
                    let ry = (-nx).atan2(-nz) + if matches!(name, "bench" | "dumpster") { 0.0 } else { rng.range(0.0, 6.28) };
                    commands.spawn((WorldAssetRoot(scene(name)), Transform::from_xyz(x, 0.0, z).with_rotation(Quat::from_rotation_y(ry)).with_scale(Vec3::splat(s))));
                    if hh > 0.0 {
                        let (hx, hz) = if nx != 0.0 { (sz2[1] / 2.0, sz2[0] / 2.0) } else { (sz2[0] / 2.0, sz2[1] / 2.0) };
                        col.add(vec3(x - hx, 0.0, z - hz), vec3(x + hx, hh, z + hz));
                    }
                }
            }
        }
    }
    // limites de la ville
    let l = limit();
    for (a, b) in [(vec3(-l - 3.0, 0.0, -l - 3.0), vec3(l + 3.0, 40.0, -l)), (vec3(-l - 3.0, 0.0, l), vec3(l + 3.0, 40.0, l + 3.0)), (vec3(-l - 3.0, 0.0, -l), vec3(-l, 40.0, l)), (vec3(l, 0.0, -l), vec3(l + 3.0, 40.0, l))] {
        col.add(a, b);
    }
}

#[derive(Resource)]
pub struct InteriorLights(pub Vec<Vec3>);
#[derive(Component)]
pub struct InteriorLight;

/// Les lumières d'intérieur ne sont allumées qu'à proximité du joueur (économie de calcul)
pub fn cull_interior_lights(player: Query<&Transform, With<crate::player::Player>>, mut lights: Query<(&Transform, &mut Visibility), With<InteriorLight>>) {
    let Ok(p) = player.single() else { return };
    for (t, mut v) in &mut lights {
        let near = t.translation.distance(p.translation) < 38.0;
        let want = if near { Visibility::Visible } else { Visibility::Hidden };
        if *v != want {
            *v = want;
        }
    }
}
