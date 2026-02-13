use serde::{Deserialize, Serialize};

/// Settings asset loaded from HytaleGenerator/Settings/.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(default, rename_all = "PascalCase")]
pub struct SettingsAsset {
    pub custom_concurrency: i32,
    pub buffer_capacity_factor: f64,
    pub target_view_distance: f64,
    pub target_player_count: f64,
    pub stats_checkpoints: Vec<i32>,
}

impl SettingsAsset {
    pub fn new() -> Self {
        Self {
            custom_concurrency: -1,
            buffer_capacity_factor: 0.3,
            target_view_distance: 512.0,
            target_player_count: 3.0,
            stats_checkpoints: Vec::new(),
        }
    }
}
