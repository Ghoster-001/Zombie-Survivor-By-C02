//! Construction de maillages : on empile des pavés dans un seul `Mesh` (un appel de rendu par immeuble).
use bevy::{asset::RenderAssetUsages, mesh::Indices, prelude::*, render::render_resource::PrimitiveTopology};

#[derive(Clone, Copy, Debug)]
pub struct Aabb {
    pub min: Vec3,
    pub max: Vec3,
}

#[derive(Default)]
pub struct MeshBuilder {
    pos: Vec<[f32; 3]>,
    nor: Vec<[f32; 3]>,
    uv: Vec<[f32; 2]>,
    col: Vec<[f32; 4]>,
    idx: Vec<u32>,
}

impl MeshBuilder {
    pub fn is_empty(&self) -> bool {
        self.idx.is_empty()
    }

    /// Pavé aligné sur les axes ; `tile` = taille (en mètres) d'une répétition de texture ; les UV suivent les coordonnées du monde (aucun étirement).
    pub fn cuboid(&mut self, min: Vec3, max: Vec3, color: [f32; 4], tile: f32) {
        if max.x - min.x < 1e-4 || max.y - min.y < 1e-4 || max.z - min.z < 1e-4 {
            return;
        }
        let (a, b) = (min, max);
        // (normale, 4 coins)
        let faces: [(Vec3, [Vec3; 4]); 6] = [
            (Vec3::X, [vec3(b.x, a.y, a.z), vec3(b.x, b.y, a.z), vec3(b.x, b.y, b.z), vec3(b.x, a.y, b.z)]),
            (Vec3::NEG_X, [vec3(a.x, a.y, b.z), vec3(a.x, b.y, b.z), vec3(a.x, b.y, a.z), vec3(a.x, a.y, a.z)]),
            (Vec3::Y, [vec3(a.x, b.y, a.z), vec3(a.x, b.y, b.z), vec3(b.x, b.y, b.z), vec3(b.x, b.y, a.z)]),
            (Vec3::NEG_Y, [vec3(a.x, a.y, b.z), vec3(a.x, a.y, a.z), vec3(b.x, a.y, a.z), vec3(b.x, a.y, b.z)]),
            (Vec3::Z, [vec3(a.x, a.y, b.z), vec3(b.x, a.y, b.z), vec3(b.x, b.y, b.z), vec3(a.x, b.y, b.z)]),
            (Vec3::NEG_Z, [vec3(b.x, a.y, a.z), vec3(a.x, a.y, a.z), vec3(a.x, b.y, a.z), vec3(b.x, b.y, a.z)]),
        ];
        for (n, c) in faces {
            let base = self.pos.len() as u32;
            for p in c {
                self.pos.push(p.to_array());
                self.nor.push(n.to_array());
                let uv = if n.y != 0.0 {
                    [p.x / tile, p.z / tile]
                } else if n.x != 0.0 {
                    [p.z / tile, -p.y / tile]
                } else {
                    [p.x / tile, -p.y / tile]
                };
                self.uv.push(uv);
                self.col.push(color);
            }
            // sens trigonométrique vu de l'extérieur
            let wind = (c[1] - c[0]).cross(c[2] - c[0]).dot(n);
            if wind > 0.0 {
                self.idx.extend([base, base + 1, base + 2, base, base + 2, base + 3]);
            } else {
                self.idx.extend([base, base + 2, base + 1, base, base + 3, base + 2]);
            }
        }
    }

    pub fn cuboid_c(&mut self, center: Vec3, size: Vec3, color: [f32; 4], tile: f32) {
        self.cuboid(center - size / 2.0, center + size / 2.0, color, tile);
    }

    pub fn build(self) -> Mesh {
        Mesh::new(PrimitiveTopology::TriangleList, RenderAssetUsages::default())
            .with_inserted_attribute(Mesh::ATTRIBUTE_POSITION, self.pos)
            .with_inserted_attribute(Mesh::ATTRIBUTE_NORMAL, self.nor)
            .with_inserted_attribute(Mesh::ATTRIBUTE_UV_0, self.uv)
            .with_inserted_attribute(Mesh::ATTRIBUTE_COLOR, self.col)
            .with_inserted_indices(Indices::U32(self.idx))
    }
}
