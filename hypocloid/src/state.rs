use std::env;
use std::path;
use dirs;
use ini::Ini;

pub fn notmuch_config() -> std::path::PathBuf {
  let nc = match env::var ("NOTMUCH_CONFIG") {
    Ok (p) => path::PathBuf::from (p),
    _      => { let mut d = dirs::home_dir().unwrap(); d.push (".notmuch-config"); d }
  };

  nc
}

pub struct HypoState {
  pub notmuch_config: Ini
}

impl HypoState {
  pub fn new () -> HypoState {
    HypoState {
      notmuch_config: Ini::load_from_file (notmuch_config()).unwrap()
    }
  }
}


