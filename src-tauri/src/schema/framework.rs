use serde::{Deserialize, Serialize};
use serde_json::Value;

/// Framework types (2 types).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "Type")]
pub enum FrameworkType {
    DecimalConstants {
        #[serde(rename = "Entries", default)]
        entries: Vec<DecimalConstantEntry>,
    },
    Positions {
        #[serde(rename = "Entries", default)]
        entries: Vec<PositionEntry>,
    },
}

/// Named decimal constant entry.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(default, rename_all = "PascalCase")]
pub struct DecimalConstantEntry {
    pub name: String,
    pub value: f64,
}

/// Named position provider entry.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(default, rename_all = "PascalCase")]
pub struct PositionEntry {
    pub name: String,
    pub positions: Option<Value>,
}
