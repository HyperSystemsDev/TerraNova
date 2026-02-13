use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "Type")]
pub enum AssignmentType {
    Constant {
        #[serde(rename = "Prop")]
        prop: Option<Value>,
    },
    FieldFunction {
        #[serde(rename = "FieldFunction")]
        field_function: Option<Value>,
        #[serde(rename = "Delimiters", default)]
        delimiters: Vec<Value>,
    },
    Sandwich {
        #[serde(rename = "Delimiters", default)]
        delimiters: Vec<Value>,
    },
    Weighted {
        #[serde(rename = "SkipChance", default)]
        skip_chance: f64,
        #[serde(rename = "Seed", default)]
        seed: String,
        #[serde(rename = "WeightedAssignments", default)]
        weighted_assignments: Vec<Value>,
    },
    Imported {
        #[serde(rename = "Name", default)]
        name: String,
    },
}
