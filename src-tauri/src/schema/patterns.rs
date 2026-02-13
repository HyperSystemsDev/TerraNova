use serde::{Deserialize, Serialize};
use serde_json::Value;

/// All 15 pattern types in the V2 world generation system.
///
/// Patterns validate world locations based on material composition, spatial
/// relationships, surface detection, and logical operations. They are used
/// to determine valid placement positions for props, materials, and other
/// world generation elements.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "Type")]
pub enum PatternType {
    /// Checks against a specific block material.
    BlockType {
        #[serde(rename = "Material", default)]
        material: Option<String>,
    },

    /// Checks if the block's material belongs to a named BlockSet.
    BlockSet {
        #[serde(rename = "BlockSet", default)]
        block_set: Option<String>,
    },

    /// Offsets the child pattern by an integer vector.
    Offset {
        #[serde(rename = "Pattern", default)]
        pattern: Option<Value>,
        #[serde(rename = "Offset", default)]
        offset: Option<Value>,
    },

    /// Checks for a floor: validates origin and the block directly below.
    Floor {
        #[serde(rename = "Floor", default)]
        floor: Option<Value>,
        #[serde(rename = "Origin", default)]
        origin: Option<Value>,
    },

    /// Checks for a ceiling: validates origin and the block directly above.
    Ceiling {
        #[serde(rename = "Ceiling", default)]
        ceiling: Option<Value>,
        #[serde(rename = "Origin", default)]
        origin: Option<Value>,
    },

    /// Checks for a wall in specified compass directions (N, S, E, W).
    Wall {
        #[serde(rename = "Wall", default)]
        wall: Option<Value>,
        #[serde(rename = "Origin", default)]
        origin: Option<Value>,
        #[serde(rename = "Directions", default)]
        directions: Vec<String>,
        #[serde(rename = "RequireAllDirections", default)]
        require_all_directions: Option<bool>,
    },

    /// Validates surface transitions between materials with configurable
    /// facings, radii, and gap tolerance.
    Surface {
        #[serde(rename = "Surface", default)]
        surface: Option<Value>,
        #[serde(rename = "Medium", default)]
        medium: Option<Value>,
        #[serde(rename = "SurfaceRadius", default)]
        surface_radius: Option<f64>,
        #[serde(rename = "MediumRadius", default)]
        medium_radius: Option<f64>,
        #[serde(rename = "SurfaceGap", default)]
        surface_gap: Option<i32>,
        #[serde(rename = "MediumGap", default)]
        medium_gap: Option<i32>,
        #[serde(rename = "Facings", default)]
        facings: Vec<String>,
        #[serde(rename = "RequireAllFacings", default)]
        require_all_facings: Option<bool>,
    },

    /// Validates a gap between two anchor walls with configurable
    /// gap size, anchor size, depth, and roughness tolerance.
    Gap {
        #[serde(rename = "GapSize", default)]
        gap_size: Option<f64>,
        #[serde(rename = "AnchorSize", default)]
        anchor_size: Option<f64>,
        #[serde(rename = "AnchorRoughness", default)]
        anchor_roughness: Option<f64>,
        #[serde(rename = "DepthDown", default)]
        depth_down: Option<i32>,
        #[serde(rename = "DepthUp", default)]
        depth_up: Option<i32>,
        #[serde(rename = "Angles", default)]
        angles: Vec<f64>,
        #[serde(rename = "GapPattern", default)]
        gap_pattern: Option<Value>,
        #[serde(rename = "AnchorPattern", default)]
        anchor_pattern: Option<Value>,
    },

    /// Defines a cuboid region; validates if all positions inside
    /// match the SubPattern.
    Cuboid {
        #[serde(rename = "Min", default)]
        min: Option<Value>,
        #[serde(rename = "Max", default)]
        max: Option<Value>,
        #[serde(rename = "SubPattern", default)]
        sub_pattern: Option<Value>,
    },

    /// Logical AND: validates only if all child patterns validate.
    And {
        #[serde(rename = "Patterns", default)]
        patterns: Vec<Value>,
    },

    /// Logical OR: validates if at least one child pattern validates.
    Or {
        #[serde(rename = "Patterns", default)]
        patterns: Vec<Value>,
    },

    /// Logical NOT: validates only where the child pattern does not.
    Not {
        #[serde(rename = "Pattern", default)]
        pattern: Option<Value>,
    },

    /// Validates using a density field with value delimiters.
    FieldFunction {
        #[serde(rename = "FieldFunction", default)]
        field_function: Option<Value>,
        #[serde(rename = "Delimiters", default)]
        delimiters: Vec<Value>,
    },

    /// Imports a previously exported Pattern by name.
    Imported {
        #[serde(rename = "Name", default)]
        name: Option<String>,
    },

    /// Exports a pattern for reuse across assets.
    Exported {
        #[serde(rename = "ExportAs", default)]
        export_as: Option<String>,
        #[serde(rename = "Pattern", default)]
        pattern: Option<Value>,
    },

    /// Always outputs a constant boolean value (true/false).
    Constant {
        #[serde(rename = "Value", default)]
        value: Option<bool>,
    },
}
