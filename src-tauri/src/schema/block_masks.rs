use serde::{Deserialize, Serialize};
use serde_json::Value;

/// Block mask asset for controlling block placement.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(default, rename_all = "PascalCase")]
pub struct BlockMaskAsset {
    /// Materials that should not be placed
    pub dont_place: Option<Value>,
    /// Materials that should not be replaced
    pub dont_replace: Option<Value>,
    /// Advanced per-source replacement rules
    pub advanced: Vec<BlockMaskEntryAsset>,
    pub export_as: String,
    pub import: String,
}

/// Individual block mask entry with source→replacement mapping.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(default, rename_all = "PascalCase")]
pub struct BlockMaskEntryAsset {
    /// Source material set to match
    pub source: Option<Value>,
    /// Material set that can replace the source
    pub can_replace: Option<Value>,
}
