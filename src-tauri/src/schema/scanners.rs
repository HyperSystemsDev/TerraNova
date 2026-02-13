use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "Type")]
pub enum ScannerType {
    Origin,
    ColumnLinear {
        #[serde(rename = "MinY", default)]
        min_y: i32,
        #[serde(rename = "MaxY", default)]
        max_y: i32,
        #[serde(rename = "ResultCap", default)]
        result_cap: i32,
        #[serde(rename = "TopDownOrder", default)]
        top_down_order: bool,
        #[serde(rename = "RelativeToPosition", default)]
        relative_to_position: bool,
        #[serde(rename = "BaseHeightName", default)]
        base_height_name: String,
    },
    ColumnRandom {
        #[serde(rename = "MinY", default)]
        min_y: i32,
        #[serde(rename = "MaxY", default)]
        max_y: i32,
        #[serde(rename = "ResultCap", default)]
        result_cap: i32,
        #[serde(rename = "Seed", default)]
        seed: String,
        #[serde(rename = "Strategy", default)]
        strategy: String,
        #[serde(rename = "RelativeToPosition", default)]
        relative_to_position: bool,
        #[serde(rename = "BaseHeightName", default)]
        base_height_name: String,
    },
    Area {
        #[serde(rename = "ResultCap", default)]
        result_cap: i32,
        #[serde(rename = "ScanShape", default)]
        scan_shape: String,
        #[serde(rename = "ScanRange", default)]
        scan_range: i32,
        #[serde(rename = "ChildScanner")]
        child_scanner: Option<Value>,
    },
    Imported {
        #[serde(rename = "Name", default)]
        name: String,
    },
}
