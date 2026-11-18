//! Textures PBR générées par code (couleur, relief, rugosité) : briques, béton, asphalte, trottoir, plâtre.
use bevy::{
    asset::RenderAssetUsages,
    image::{ImageAddressMode, ImageFilterMode, ImageSampler, ImageSamplerDescriptor},
    prelude::*,
    render::render_resource::{Extent3d, TextureDimension, TextureFormat},
};

pub struct PbrSet {
    pub albedo: Handle<Image>,
    pub normal: Handle<Image>,
    pub mr: Handle<Image>,
}

fn hash(x: i32, y: i32, s: u32) -> f32 {
    let mut h = (x as u32).wrapping_mul(374761393) ^ (y as u32).wrapping_mul(668265263) ^ s.wrapping_mul(2246822519);
    h = (h ^ (h >> 13)).wrapping_mul(1274126177);
    ((h ^ (h >> 16)) & 0xffff) as f32 / 65535.0
}

/// bruit de valeur périodique (la texture se raccorde)
fn noise(x: f32, y: f32, period: i32, s: u32) -> f32 {
    let (xi, yi) = (x.floor() as i32, y.floor() as i32);
    let (fx, fy) = (x - xi as f32, y - yi as f32);
    let (u, v) = (fx * fx * (3.0 - 2.0 * fx), fy * fy * (3.0 - 2.0 * fy));
    let p = |a: i32, b: i32| hash(a.rem_euclid(period), b.rem_euclid(period), s);
    let (a, b, c, d) = (p(xi, yi), p(xi + 1, yi), p(xi, yi + 1), p(xi + 1, yi + 1));
    a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

fn fbm(x: f32, y: f32, size: i32, s: u32) -> f32 {
    let mut sum = 0.0;
    let mut amp = 0.5;
    let mut f = 4;
    let mut norm = 0.0;
    for o in 0..4 {
        sum += amp * noise(x / size as f32 * f as f32, y / size as f32 * f as f32, f, s + o);
        norm += amp;
        amp *= 0.5;
        f *= 2;
    }
    sum / norm
}

fn repeat_sampler() -> ImageSampler {
    ImageSampler::Descriptor(ImageSamplerDescriptor {
        address_mode_u: ImageAddressMode::Repeat,
        address_mode_v: ImageAddressMode::Repeat,
        mag_filter: ImageFilterMode::Linear,
        min_filter: ImageFilterMode::Linear,
        mipmap_filter: ImageFilterMode::Linear,
        anisotropy_clamp: 16,
        ..default()
    })
}

fn img(size: u32, data: Vec<u8>, srgb: bool) -> Image {
    let mut i = Image::new(
        Extent3d { width: size, height: size, depth_or_array_layers: 1 },
        TextureDimension::D2,
        data,
        if srgb { TextureFormat::Rgba8UnormSrgb } else { TextureFormat::Rgba8Unorm },
        RenderAssetUsages::RENDER_WORLD,
    );
    i.sampler = repeat_sampler();
    i
}

/// `f(x, y)` -> (couleur, hauteur 0..1, rugosité 0..1, métal 0..1) ; le relief est dérivé de la hauteur.
pub fn generate(images: &mut Assets<Image>, size: u32, strength: f32, f: impl Fn(f32, f32) -> ([f32; 3], f32, f32, f32)) -> PbrSet {
    let n = size as usize;
    let mut h = vec![0.0f32; n * n];
    let mut albedo = vec![0u8; n * n * 4];
    let mut mr = vec![0u8; n * n * 4];
    for y in 0..n {
        for x in 0..n {
            let (c, hh, r, m) = f(x as f32, y as f32);
            h[y * n + x] = hh;
            let i = (y * n + x) * 4;
            albedo[i] = (c[0].clamp(0.0, 1.0) * 255.0) as u8;
            albedo[i + 1] = (c[1].clamp(0.0, 1.0) * 255.0) as u8;
            albedo[i + 2] = (c[2].clamp(0.0, 1.0) * 255.0) as u8;
            albedo[i + 3] = 255;
            mr[i] = 0;
            mr[i + 1] = (r.clamp(0.0, 1.0) * 255.0) as u8;
            mr[i + 2] = (m.clamp(0.0, 1.0) * 255.0) as u8;
            mr[i + 3] = 255;
        }
    }
    let mut normal = vec![0u8; n * n * 4];
    let hh = |x: i32, y: i32| h[(y.rem_euclid(n as i32) as usize) * n + x.rem_euclid(n as i32) as usize];
    for y in 0..n as i32 {
        for x in 0..n as i32 {
            let dx = (hh(x + 1, y) - hh(x - 1, y)) * strength;
            let dy = (hh(x, y + 1) - hh(x, y - 1)) * strength;
            let nv = Vec3::new(-dx, -dy, 1.0).normalize();
            let i = (y as usize * n + x as usize) * 4;
            normal[i] = ((nv.x * 0.5 + 0.5) * 255.0) as u8;
            normal[i + 1] = ((nv.y * 0.5 + 0.5) * 255.0) as u8;
            normal[i + 2] = ((nv.z * 0.5 + 0.5) * 255.0) as u8;
            normal[i + 3] = 255;
        }
    }
    PbrSet { albedo: images.add(img(size, albedo, true)), normal: images.add(img(size, normal, false)), mr: images.add(img(size, mr, false)) }
}

fn mix(a: [f32; 3], b: [f32; 3], t: f32) -> [f32; 3] {
    [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

/// Briques : 16 rangées par répétition, joints creusés, teintes variées, salissures
pub fn brick(images: &mut Assets<Image>, base: [f32; 3], seed: u32) -> PbrSet {
    let size = 512;
    generate(images, size, 5.0, move |x, y| {
        let (rows, cols) = (16.0, 8.0);
        let ry = y / size as f32 * rows;
        let row = ry.floor();
        let off = if (row as i32) % 2 == 0 { 0.0 } else { 0.5 };
        let cx = x / size as f32 * cols + off;
        let col = cx.floor();
        let (fx, fy) = (cx - col, ry - row);
        let mortar = fx < 0.045 || fx > 0.955 || fy < 0.09 || fy > 0.91;
        let tint = hash(col as i32, row as i32, seed);
        let grain = fbm(x, y, size as i32, seed);
        let dirt = fbm(x * 0.5, y * 0.5, size as i32, seed + 9);
        if mortar {
            let g = 0.46 + grain * 0.2;
            ([g, g * 0.97, g * 0.92], 0.05, 0.95, 0.0)
        } else {
            let c = mix(base, [base[0] * 0.55, base[1] * 0.5, base[2] * 0.5], tint * 0.7);
            let c = mix(c, [c[0] * 0.5, c[1] * 0.5, c[2] * 0.5], (dirt - 0.45).max(0.0) * 1.2);
            let edge = ((fx.min(1.0 - fx)) * 14.0).min(1.0) * ((fy.min(1.0 - fy)) * 9.0).min(1.0);
            ([c[0] * (0.85 + grain * 0.3), c[1] * (0.85 + grain * 0.3), c[2] * (0.85 + grain * 0.3)], 0.45 + 0.45 * edge * (0.7 + grain * 0.3), 0.8 + grain * 0.15, 0.0)
        }
    })
}

/// Béton banché : joints de panneaux, trous de banches, coulures
pub fn concrete(images: &mut Assets<Image>, base: [f32; 3], seed: u32) -> PbrSet {
    let size = 512;
    generate(images, size, 3.0, move |x, y| {
        let grain = fbm(x, y, size as i32, seed);
        let fine = hash(x as i32, y as i32, seed + 3);
        let streak = fbm(x * 0.15, y * 1.6, size as i32, seed + 5);
        let (px, py) = (x / size as f32 * 4.0, y / size as f32 * 4.0);
        let (fx, fy) = (px - px.floor(), py - py.floor());
        let seam = fx < 0.012 || fy < 0.012;
        let hole = ((fx - 0.2).powi(2) + (fy - 0.2).powi(2)).sqrt() < 0.012 || ((fx - 0.8).powi(2) + (fy - 0.2).powi(2)).sqrt() < 0.012;
        let l = 0.55 + (grain - 0.5) * 0.12 + fine * 0.04 - (streak - 0.5).max(0.0) * 0.22;
        let c = [base[0] * l * 1.6, base[1] * l * 1.6, base[2] * l * 1.6];
        (c, if seam || hole { 0.1 } else { 0.6 + grain * 0.3 + fine * 0.05 }, 0.88, 0.0)
    })
}

pub fn asphalt(images: &mut Assets<Image>) -> PbrSet {
    let size = 512;
    generate(images, size, 2.5, |x, y| {
        let grain = fbm(x, y, size as i32, 31);
        let fine = hash(x as i32, y as i32, 77);
        let stones = if fine > 0.93 { 0.12 } else { 0.0 };
        let patch = fbm(x * 0.7, y * 0.7, size as i32, 44);
        let wet = (patch - 0.55).max(0.0) * 3.0; // flaques : lisses et sombres
        let v = (0.11 + grain * 0.07 + fine * 0.035 + stones) * (1.0 - wet.min(1.0) * 0.45);
        ([v, v, v * 1.05], 0.35 + grain * 0.3 + fine * 0.25, (0.86 - wet.min(1.0) * 0.62).max(0.12), 0.0)
    })
}

pub fn pavement(images: &mut Assets<Image>) -> PbrSet {
    let size = 512;
    generate(images, size, 4.0, |x, y| {
        let grain = fbm(x, y, size as i32, 12);
        let (px, py) = (x / size as f32 * 4.0, y / size as f32 * 4.0);
        let (fx, fy) = (px - px.floor(), py - py.floor());
        let joint = fx < 0.02 || fy < 0.02;
        let tile = hash(px.floor() as i32, py.floor() as i32, 5);
        let l = 0.36 + grain * 0.14 + tile * 0.06;
        ([l, l * 0.98, l * 0.94], if joint { 0.0 } else { 0.6 + grain * 0.25 }, 0.85, 0.0)
    })
}

pub fn plaster(images: &mut Assets<Image>) -> PbrSet {
    let size = 256;
    generate(images, size, 1.0, |x, y| {
        let grain = fbm(x, y, size as i32, 8);
        let fine = hash(x as i32, y as i32, 2);
        let l = 0.62 + grain * 0.12 + fine * 0.03;
        ([l, l * 0.95, l * 0.86], grain * 0.6, 0.92, 0.0)
    })
}

pub fn wood(images: &mut Assets<Image>) -> PbrSet {
    let size = 256;
    generate(images, size, 2.0, |x, y| {
        let plank = (y / size as f32 * 8.0).floor();
        let fy = y / size as f32 * 8.0 - plank;
        let tint = hash(plank as i32, 0, 21);
        let grain = fbm(x * 0.25 + tint * 40.0, y * 3.0, size as i32, 23);
        let l = 0.28 + tint * 0.12 + grain * 0.12;
        ([l * 1.15, l * 0.75, l * 0.45], if fy < 0.04 { 0.0 } else { 0.5 + grain * 0.3 }, 0.55, 0.0)
    })
}
