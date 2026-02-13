use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "Type")]
pub enum PropType {
    Box {
        #[serde(rename = "Range")]
        range: Option<Value>,
        #[serde(rename = "Material")]
        material: Option<Value>,
        #[serde(rename = "Pattern")]
        pattern: Option<Value>,
        #[serde(rename = "Scanner")]
        scanner: Option<Value>,
    },
    Column {
        #[serde(rename = "Range")]
        range: Option<Value>,
        #[serde(rename = "Material")]
        material: Option<Value>,
        #[serde(rename = "Pattern")]
        pattern: Option<Value>,
        #[serde(rename = "Scanner")]
        scanner: Option<Value>,
    },
    Cluster {
        #[serde(rename = "Range", default)]
        range: i32,
        #[serde(rename = "DistanceCurve")]
        distance_curve: Option<Value>,
        #[serde(rename = "Seed", default)]
        seed: String,
        #[serde(rename = "WeightedProps")]
        weighted_props: Option<Value>,
        #[serde(rename = "Pattern")]
        pattern: Option<Value>,
        #[serde(rename = "Scanner")]
        scanner: Option<Value>,
    },
    Density {
        #[serde(rename = "Range")]
        range: Option<Value>,
        #[serde(rename = "PlacementMask")]
        placement_mask: Option<Value>,
        #[serde(rename = "Pattern")]
        pattern: Option<Value>,
        #[serde(rename = "Scanner")]
        scanner: Option<Value>,
        #[serde(rename = "Density")]
        density: Option<Value>,
        #[serde(rename = "Material")]
        material: Option<Value>,
    },
    Prefab {
        #[serde(rename = "WeightedPrefabPaths")]
        weighted_prefab_paths: Option<Value>,
        #[serde(rename = "LegacyPath", default)]
        legacy_path: bool,
        #[serde(rename = "Directionality")]
        directionality: Option<Value>,
        #[serde(rename = "Scanner")]
        scanner: Option<Value>,
        #[serde(rename = "BlockMask")]
        block_mask: Option<Value>,
        #[serde(rename = "MoldingDirection", default)]
        molding_direction: String,
        #[serde(rename = "MoldingPattern")]
        molding_pattern: Option<Value>,
        #[serde(rename = "MoldingScanner")]
        molding_scanner: Option<Value>,
        #[serde(rename = "MoldingChildren", default)]
        molding_children: bool,
        #[serde(rename = "LoadEntities", default)]
        load_entities: bool,
    },
    PondFiller {
        #[serde(rename = "Scanner")]
        scanner: Option<Value>,
        #[serde(rename = "Pattern")]
        pattern: Option<Value>,
        #[serde(rename = "Material")]
        material: Option<Value>,
    },
    Queue {
        #[serde(rename = "Props", default)]
        props: Vec<Value>,
    },
    Union {
        #[serde(rename = "Props", default)]
        props: Vec<Value>,
    },
    Offset {
        #[serde(rename = "OffsetX", default)]
        offset_x: i32,
        #[serde(rename = "OffsetY", default)]
        offset_y: i32,
        #[serde(rename = "OffsetZ", default)]
        offset_z: i32,
        #[serde(rename = "Prop")]
        prop: Option<Value>,
    },
    Weighted {
        #[serde(rename = "Entries")]
        entries: Option<Value>,
        #[serde(rename = "Seed", default)]
        seed: String,
    },
    Imported {
        #[serde(rename = "Name", default)]
        name: String,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "Type")]
pub enum DirectionalityType {
    Static {
        #[serde(rename = "Rotation", default)]
        rotation: i32,
        #[serde(rename = "Pattern")]
        pattern: Option<Value>,
    },
    Random {
        #[serde(rename = "Seed", default)]
        seed: String,
        #[serde(rename = "Pattern")]
        pattern: Option<Value>,
    },
    Pattern {
        #[serde(rename = "InitialDirection", default)]
        initial_direction: String,
        #[serde(rename = "Seed", default)]
        seed: String,
        #[serde(rename = "NorthPattern")]
        north_pattern: Option<Value>,
        #[serde(rename = "SouthPattern")]
        south_pattern: Option<Value>,
        #[serde(rename = "EastPattern")]
        east_pattern: Option<Value>,
        #[serde(rename = "WestPattern")]
        west_pattern: Option<Value>,
    },
    Imported {
        #[serde(rename = "Name", default)]
        name: String,
    },
}
