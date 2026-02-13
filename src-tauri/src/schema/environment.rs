use serde::{Deserialize, Serialize};
use serde_json::Value;

/// Environment provider types (2 types).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "Type")]
pub enum EnvironmentProviderType {
    Constant {
        #[serde(rename = "Environment", default)]
        environment: String,
    },
    DensityDelimited {
        #[serde(rename = "Density")]
        density: Option<Value>,
        #[serde(rename = "Delimiters", default)]
        delimiters: Vec<Value>,
    },
}

/// Tint provider types (2 types).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "Type")]
pub enum TintProviderType {
    Constant {
        #[serde(rename = "Color", default)]
        color: String,
    },
    DensityDelimited {
        #[serde(rename = "Density")]
        density: Option<Value>,
        #[serde(rename = "Delimiters", default)]
        delimiters: Vec<Value>,
    },
}
