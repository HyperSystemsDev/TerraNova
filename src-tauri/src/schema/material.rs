use serde::{Deserialize, Serialize};
use serde_json::Value;

/// All 14 material provider types in the V2 world generation system.
///
/// Material providers determine which block material to use at each position
/// in the world, supporting layering, conditions, weighting, and noise-driven
/// selection.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "Type")]
pub enum MaterialProviderType {
    /// Provides one constant block type.
    Constant {
        #[serde(rename = "BlockType", default)]
        block_type: Option<String>,
    },

    /// Separates into Solid and Empty terrain and provides a provider for each.
    Solidity {
        #[serde(rename = "Solid", default)]
        solid: Option<Value>,
        #[serde(rename = "Empty", default)]
        empty: Option<Value>,
    },

    /// Priority queue of material providers; first match wins.
    Queue {
        #[serde(rename = "Queue", default)]
        queue: Vec<Value>,
    },

    /// Applies a child provider on a vertical range, optionally relative to a BaseHeight.
    SimpleHorizontal {
        #[serde(rename = "TopY", default)]
        top_y: Option<i32>,
        #[serde(rename = "TopBaseHeight", default)]
        top_base_height: Option<String>,
        #[serde(rename = "BottomY", default)]
        bottom_y: Option<i32>,
        #[serde(rename = "BottomBaseHeight", default)]
        bottom_base_height: Option<String>,
        #[serde(rename = "Material", default)]
        material: Option<Value>,
    },

    /// Applies a provider on horizontal stripes of varying thickness.
    Striped {
        #[serde(rename = "Stripes", default)]
        stripes: Vec<Value>,
        #[serde(rename = "Material", default)]
        material: Option<Value>,
    },

    /// Picks a provider from a weighted list with optional skip chance.
    Weighted {
        #[serde(rename = "Seed", default)]
        seed: Option<String>,
        #[serde(rename = "SkipChance", default)]
        skip_chance: Option<f64>,
        #[serde(rename = "WeightedMaterials", default)]
        weighted_materials: Vec<Value>,
    },

    /// Selects a region using a density function and value delimiters.
    FieldFunction {
        #[serde(rename = "FieldFunction", default)]
        field_function: Option<Value>,
        #[serde(rename = "Delimiters", default)]
        delimiters: Vec<Value>,
    },

    /// Places layers of blocks on terrain floor or ceiling surfaces.
    SpaceAndDepth {
        #[serde(rename = "LayerContext", default)]
        layer_context: Option<String>,
        #[serde(rename = "MaxExpectedDepth", default)]
        max_expected_depth: Option<i32>,
        #[serde(rename = "Condition", default)]
        condition: Option<Value>,
        #[serde(rename = "Layers", default)]
        layers: Vec<Value>,
    },

    /// Imports an exported MaterialProvider by name.
    Imported {
        #[serde(rename = "Name", default)]
        name: Option<String>,
    },

    /// Exports a material provider for reuse.
    Exported {
        #[serde(rename = "ExportAs", default)]
        export_as: Option<String>,
        #[serde(rename = "Material", default)]
        material: Option<Value>,
    },

    /// Switches material based on biome context.
    Switch {
        #[serde(rename = "SwitchCases", default)]
        switch_cases: Vec<Value>,
    },

    /// Provides material based on depth into surface.
    DepthBased {
        #[serde(rename = "DepthCurve", default)]
        depth_curve: Option<Value>,
        #[serde(rename = "Materials", default)]
        materials: Vec<Value>,
    },

    /// Material provider that selects based on gradient/slope of terrain.
    GradientBased {
        #[serde(rename = "Gradient", default)]
        gradient: Option<Value>,
        #[serde(rename = "Materials", default)]
        materials: Vec<Value>,
    },

    /// Pipeline of material transformations.
    Pipeline {
        #[serde(rename = "Steps", default)]
        steps: Vec<Value>,
    },
}

/// The 4 layer types used by SpaceAndDepth material providers.
///
/// Layers are stacked into the depth of floor or ceiling surfaces,
/// each with a configurable thickness strategy.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "Type")]
pub enum LayerType {
    /// Fixed thickness everywhere.
    ConstantThickness {
        #[serde(rename = "Material", default)]
        material: Option<Value>,
        #[serde(rename = "Thickness", default)]
        thickness: Option<i32>,
    },

    /// Thickness varies per XZ from a random range.
    RangeThickness {
        #[serde(rename = "Material", default)]
        material: Option<Value>,
        #[serde(rename = "RangeMin", default)]
        range_min: Option<i32>,
        #[serde(rename = "RangeMax", default)]
        range_max: Option<i32>,
        #[serde(rename = "Seed", default)]
        seed: Option<String>,
    },

    /// Thickness picked from a weighted list per XZ.
    WeightedThickness {
        #[serde(rename = "Material", default)]
        material: Option<Value>,
        #[serde(rename = "PossibleThicknesses", default)]
        possible_thicknesses: Vec<Value>,
        #[serde(rename = "Seed", default)]
        seed: Option<String>,
    },

    /// Thickness determined by a noise function per XZ.
    NoiseThickness {
        #[serde(rename = "Material", default)]
        material: Option<Value>,
        #[serde(rename = "ThicknessFunctionXZ", default)]
        thickness_function_xz: Option<Value>,
    },
}

/// The 7 condition types used by material providers.
///
/// Conditions check environmental context (space above floor, space below
/// ceiling) to determine whether a material provider should be applied.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "Type")]
pub enum ConditionType {
    /// Validates if a context value equals the configured value.
    EqualsCondition {
        #[serde(rename = "ContextToCheck", default)]
        context_to_check: Option<String>,
        #[serde(rename = "Value", default)]
        value: Option<i32>,
    },

    /// Validates if a context value is greater than the threshold.
    GreaterThanCondition {
        #[serde(rename = "ContextToCheck", default)]
        context_to_check: Option<String>,
        #[serde(rename = "Threshold", default)]
        threshold: Option<i32>,
    },

    /// Validates if a context value is smaller than the threshold.
    SmallerThanCondition {
        #[serde(rename = "ContextToCheck", default)]
        context_to_check: Option<String>,
        #[serde(rename = "Threshold", default)]
        threshold: Option<i32>,
    },

    /// Logical AND: validates only if all sub-conditions validate.
    AndCondition {
        #[serde(rename = "Conditions", default)]
        conditions: Vec<Value>,
    },

    /// Logical OR: validates if any sub-condition validates.
    OrCondition {
        #[serde(rename = "Conditions", default)]
        conditions: Vec<Value>,
    },

    /// Logical NOT: validates if the sub-condition does not validate.
    NotCondition {
        #[serde(rename = "Condition", default)]
        condition: Option<Value>,
    },

    /// Always validates (no parameters).
    AlwaysTrueCondition {},
}
