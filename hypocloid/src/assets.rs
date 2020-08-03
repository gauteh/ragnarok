use warp::{Reply, Rejection, Filter};

pub mod filters {
    use super::*;

    pub fn assets() -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
        warp::path("assets")
            .and(warp::fs::dir("assets/"))
    }
}
