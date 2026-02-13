use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "Type")]
pub enum PositionProviderType {
    List {
        #[serde(rename = "Positions", default)]
        positions: Vec<Value>,
    },
    Mesh2D {
        #[serde(rename = "PointGenerator")]
        point_generator: Option<PointGenerator>,
        #[serde(rename = "PointsY", default)]
        points_y: i32,
    },
    Mesh3D {
        #[serde(rename = "PointGenerator")]
        point_generator: Option<PointGenerator>,
    },
    FieldFunction {
        #[serde(rename = "FieldFunction")]
        field_function: Option<Value>,
        #[serde(rename = "Positions")]
        positions: Option<Value>,
        #[serde(rename = "Delimiters", default)]
        delimiters: Vec<Value>,
    },
    Occurrence {
        #[serde(rename = "Seed", default)]
        seed: String,
        #[serde(rename = "FieldFunction")]
        field_function: Option<Value>,
        #[serde(rename = "Positions")]
        positions: Option<Value>,
    },
    Offset {
        #[serde(rename = "OffsetX", default)]
        offset_x: i32,
        #[serde(rename = "OffsetY", default)]
        offset_y: i32,
        #[serde(rename = "OffsetZ", default)]
        offset_z: i32,
        #[serde(rename = "Positions")]
        positions: Option<Value>,
    },
    Union {
        #[serde(rename = "Positions", default)]
        positions: Vec<Value>,
    },
    SimpleHorizontal {
        #[serde(rename = "RangeY")]
        range_y: Option<Value>,
        #[serde(rename = "Positions")]
        positions: Option<Value>,
    },
    Cache {
        #[serde(rename = "Positions")]
        positions: Option<Value>,
        #[serde(rename = "SectionSize", default)]
        section_size: i32,
        #[serde(rename = "CacheSize", default)]
        cache_size: i32,
    },
    BaseHeight {
        #[serde(rename = "MinYRead", default)]
        min_y_read: f64,
        #[serde(rename = "MaxYRead", default)]
        max_y_read: f64,
        #[serde(rename = "BedName", default)]
        bed_name: String,
        #[serde(rename = "Positions")]
        positions: Option<Value>,
    },
    Anchor {
        #[serde(rename = "Reversed", default)]
        reversed: bool,
        #[serde(rename = "Positions")]
        positions: Option<Value>,
    },
    Bound {
        #[serde(rename = "Bounds")]
        bounds: Option<Value>,
        #[serde(rename = "Positions")]
        positions: Option<Value>,
    },
    Framework {
        #[serde(rename = "Name", default)]
        name: String,
    },
    Imported {
        #[serde(rename = "Name", default)]
        name: String,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(default, rename_all = "PascalCase")]
pub struct PointGenerator {
    #[serde(rename = "Type")]
    pub generator_type: String,
    pub spacing: i32,
    pub jitter: f64,
    pub seed: String,
}
