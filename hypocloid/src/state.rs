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

    /// Get the path to the notmuch database.
    fn db_path(&self) -> path::PathBuf {
        match env::var_os("NOTMUCH_CONFIG") {
            Some(p) => path::PathBuf::from(p),
            None => {
                match self.notmuch_config.get_from(Some("database"), "path") {
                    Some(p) => path::PathBuf::from(p),
                    None => dirs::home_dir().unwrap().join("mail")
                }
            }
        }
    }

    pub async fn db(&self) -> anyhow::Result<notmuch::Database> {
        unimplemented!()
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
