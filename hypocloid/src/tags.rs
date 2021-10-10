use crate::state::{filters::with_state, HypoState};
use std::convert::Infallible;
use std::sync::Arc;
use warp::{http::Response, reply::Reply, Filter};

pub struct Tags;

impl Tags {
    pub fn new(db: String) -> Vec<String> {
        let db = Arc::new(notmuch::Database::open(&db, notmuch::DatabaseMode::ReadOnly).unwrap());

        debug!("getting all tags");

        let tags: Vec<String> = db.all_tags().unwrap().collect();

        tags
    }
}

pub mod handlers {
    use super::*;

    pub async fn query(state: Arc<HypoState>) -> Result<impl warp::Reply, Infallible> {
        let nmdb = state
            .notmuch_config
            .get_from(Some("database"), "path")
            .unwrap();

        let tags = Tags::new(String::from(nmdb));

        let json = serde_json::to_string(&tags);

        match json {
            Ok(v) => Ok(Response::builder()
                .header("Content-Type", "application/json")
                .header("Access-Control-Allow-Origin", "*")
                .body(v)
                .into_response()),

            Err(_) => Ok(warp::http::StatusCode::BAD_REQUEST.into_response()),
        }
    }

    pub async fn all(state: Arc<HypoState>) -> Result<impl warp::Reply, Infallible> {
        query(state).await
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
