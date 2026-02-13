use serde::{Deserialize, Serialize};
use serde_json::Value;

/// World structure asset (Type: NoiseRange).
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(default, rename_all = "PascalCase")]
pub struct WorldStructureAsset {
    #[serde(rename = "Type")]
    pub structure_type: String,
    pub biomes: Vec<BiomeRangeAsset>,
    pub density: Option<Value>,
    pub default_biome: String,
    pub default_transition_distance: i32,
    pub max_biome_edge_distance: i32,
    pub framework: Value,
    pub spawn_positions: Option<Value>,
}

/// Biome range entry within a world structure.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(default, rename_all = "PascalCase")]
pub struct BiomeRangeAsset {
    pub biome: String,
    pub min: f64,
    pub max: f64,
}
