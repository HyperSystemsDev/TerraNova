use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "Type")]
pub enum VectorProviderType {
    Constant {
        #[serde(rename = "Value")]
        value: Option<Value>,
    },
    DensityGradient {
        #[serde(rename = "Density")]
        density: Option<Value>,
        #[serde(rename = "SampleDistance", default)]
        sample_distance: f64,
    },
    Cache {
        #[serde(rename = "VectorProvider")]
        vector_provider: Option<Value>,
    },
    Exported {
        #[serde(rename = "SingleInstance", default)]
        single_instance: bool,
        #[serde(rename = "VectorProvider")]
        vector_provider: Option<Value>,
    },
    Imported {
        #[serde(rename = "Name", default)]
        name: String,
    },
}
