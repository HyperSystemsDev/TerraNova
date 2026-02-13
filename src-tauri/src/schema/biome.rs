use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(default, rename_all = "PascalCase")]
pub struct BiomeAsset {
    pub name: String,
    pub terrain: Option<TerrainAsset>,
    pub floating_function_nodes: Vec<Value>,
    pub material_provider: Option<Value>,
    pub props: Vec<PropRuntimeAsset>,
    pub environment_provider: Option<Value>,
    pub tint_provider: Option<Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(default, rename_all = "PascalCase")]
pub struct TerrainAsset {
    #[serde(rename = "Type")]
    pub terrain_type: String,
    pub density: Option<Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(default, rename_all = "PascalCase")]
pub struct PropRuntimeAsset {
    pub runtime: i32,
    pub positions: Option<Value>,
    pub assignments: Option<Value>,
    pub skip: bool,
}
