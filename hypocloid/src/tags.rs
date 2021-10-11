use crate::state::{filters::with_state, HypoState};
use std::convert::Infallible;
use std::sync::Arc;
use warp::Filter;

pub mod handlers {
    use super::*;

    pub async fn all(state: Arc<HypoState>) -> Result<impl warp::Reply, Infallible> {
        debug!("getting all tags");

        let db = state
            .notmuch_config
            .get_from(Some("database"), "path")
            .unwrap();

        let db = Arc::new(notmuch::Database::open(&db, notmuch::DatabaseMode::ReadOnly).unwrap());
        Ok(warp::reply::json(
            &db.all_tags().unwrap().collect::<Vec<String>>(),
        ))
    }
}

pub mod filters {
    use super::*;

    pub fn all(
        state: Arc<HypoState>,
    ) -> impl Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone {
        warp::path!("tags")
            .and(warp::get())
            .and(with_state(state))
            .and_then(handlers::all)
    }
}
