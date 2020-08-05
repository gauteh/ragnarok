use warp::{Filter, Rejection, Reply};

use rust_embed::RustEmbed;
use warp_embed::embed;

#[derive(RustEmbed)]
#[folder = "../tetracuspid/assets/"]
struct Assets;

pub mod filters {
    use super::*;

    pub fn assets() -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
        warp::path("assets").and(embed(&Assets))
    }
}
