use serde::{Deserialize, Serialize};
use serde_json::Value;

/// All 19 curve types in the V2 world generation system.
///
/// Curves map decimal input values to decimal output values (f(x) = y),
/// providing the basic mathematical building blocks for shaping terrain,
/// controlling thickness, defining falloff, and more.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "Type")]
pub enum CurveType {
    /// User-defined piecewise linear curve from plotted points.
    /// Points connect with straight lines; constant before first and after last.
    Manual {
        #[serde(rename = "Points", default)]
        points: Vec<Value>,
    },

    /// Exponential falloff from 1.0 at input 0 to 0.0 at the range.
    DistanceExponential {
        #[serde(rename = "Exponent", default)]
        exponent: Option<f64>,
        #[serde(rename = "Range", default)]
        range: Option<f64>,
    },

    /// S-shaped falloff combining two exponential curves.
    DistanceS {
        #[serde(rename = "ExponentA", default)]
        exponent_a: Option<f64>,
        #[serde(rename = "ExponentB", default)]
        exponent_b: Option<f64>,
        #[serde(rename = "Range", default)]
        range: Option<f64>,
        #[serde(rename = "Transition", default)]
        transition: Option<f64>,
        #[serde(rename = "TransitionSmooth", default)]
        transition_smooth: Option<f64>,
    },

    /// Hard ceiling on the child curve's output.
    Ceiling {
        #[serde(rename = "Ceiling", default)]
        ceiling: Option<f64>,
        #[serde(rename = "Curve", default)]
        curve: Option<Value>,
    },

    /// Hard floor on the child curve's output.
    Floor {
        #[serde(rename = "Floor", default)]
        floor: Option<f64>,
        #[serde(rename = "Curve", default)]
        curve: Option<Value>,
    },

    /// Smooth ceiling with configurable transition range.
    SmoothCeiling {
        #[serde(rename = "Ceiling", default)]
        ceiling: Option<f64>,
        #[serde(rename = "Range", default)]
        range: Option<f64>,
        #[serde(rename = "Curve", default)]
        curve: Option<Value>,
    },

    /// Smooth floor with configurable transition range.
    SmoothFloor {
        #[serde(rename = "Floor", default)]
        floor: Option<f64>,
        #[serde(rename = "Range", default)]
        range: Option<f64>,
        #[serde(rename = "Curve", default)]
        curve: Option<Value>,
    },

    /// Smooth clamp between two walls with transition range.
    SmoothClamp {
        #[serde(rename = "WallA", default)]
        wall_a: Option<f64>,
        #[serde(rename = "WallB", default)]
        wall_b: Option<f64>,
        #[serde(rename = "Range", default)]
        range: Option<f64>,
        #[serde(rename = "Curve", default)]
        curve: Option<Value>,
    },

    /// Smoothed maximum between two curves.
    SmoothMax {
        #[serde(rename = "Range", default)]
        range: Option<f64>,
        #[serde(rename = "CurveA", default)]
        curve_a: Option<Value>,
        #[serde(rename = "CurveB", default)]
        curve_b: Option<Value>,
    },

    /// Smoothed minimum between two curves.
    SmoothMin {
        #[serde(rename = "Range", default)]
        range: Option<f64>,
        #[serde(rename = "CurveA", default)]
        curve_a: Option<Value>,
        #[serde(rename = "CurveB", default)]
        curve_b: Option<Value>,
    },

    /// Hard clamp between two wall values.
    Clamp {
        #[serde(rename = "WallA", default)]
        wall_a: Option<f64>,
        #[serde(rename = "WallB", default)]
        wall_b: Option<f64>,
        #[serde(rename = "Curve", default)]
        curve: Option<Value>,
    },

    /// Inverts the child curve (positive becomes negative and vice versa).
    Inverter {
        #[serde(rename = "Curve", default)]
        curve: Option<Value>,
    },

    /// Outputs the maximum value of all child curves.
    Max {
        #[serde(rename = "Curves", default)]
        curves: Vec<Value>,
    },

    /// Outputs the minimum value of all child curves.
    Min {
        #[serde(rename = "Curves", default)]
        curves: Vec<Value>,
    },

    /// Multiplies all child curves' outputs together.
    Multiplier {
        #[serde(rename = "Curves", default)]
        curves: Vec<Value>,
    },

    /// Logical NOT: maps 1 to 0 and 0 to 1, with linear scaling in between.
    Not {
        #[serde(rename = "Curve", default)]
        curve: Option<Value>,
    },

    /// Adds all child curves' values together.
    Sum {
        #[serde(rename = "Curves", default)]
        curves: Vec<Value>,
    },

    /// Imports a previously exported Curve by name.
    Imported {
        #[serde(rename = "Name", default)]
        name: Option<String>,
    },

    /// Exports a curve for reuse across assets.
    Exported {
        #[serde(rename = "ExportAs", default)]
        export_as: Option<String>,
        #[serde(rename = "Curve", default)]
        curve: Option<Value>,
    },
}
