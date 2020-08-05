use ini::Ini;
use std::convert::Infallible;
use std::env;
use std::path;
use std::sync::Arc;
use warp::Filter;

pub fn notmuch_config() -> std::path::PathBuf {
    match env::var("NOTMUCH_CONFIG") {
        Ok(p) => path::PathBuf::from(p),
        _ => {
            let mut d = dirs::home_dir().unwrap();
            d.push(".notmuch-config");
            d
        }
    }
}

pub struct HypoState {
    pub notmuch_config: Ini,
}

impl HypoState {
    pub fn new() -> anyhow::Result<HypoState> {
        Ok(HypoState {
            notmuch_config: Ini::load_from_file(notmuch_config())?,
        })
    }
}

pub mod filters {
    use super::*;

    pub fn with_state(
        state: Arc<HypoState>,
    ) -> impl Filter<Extract = (Arc<HypoState>,), Error = Infallible> + Clone {
        warp::any().map(move || Arc::clone(&state))
    }
}
