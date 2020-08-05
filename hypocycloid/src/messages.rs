use crate::state::{filters::with_state, HypoState};
use std::convert::Infallible;
use std::sync::Arc;
use warp::{http::Response, reply::Reply, Filter};

pub mod handlers {
    use super::*;

    pub async fn query(query: String, _: Arc<HypoState>) -> Result<impl warp::Reply, Infallible> {
        use std::process::Command;
        debug!("messages: {}", query);

        /* XXX: we presumably need to implement something custom here.
         * also, tokio_process has an async Command which would be good
         * too.
         *
         * XXX: sanitize html here, using e.g. ammonia?
         *
         * */
        let messages = Command::new("notmuch")
            .arg("show")
            .arg("--format=json")
            .arg("--exclude=false")
            .arg("--include-html")
            .arg(query)
            .output();

        match messages {
            Ok(messages) => Ok(Response::builder()
                .header("Content-Type", "application/json")
                .body(messages.stdout)
                .into_response()),
            Err(_) => Ok(warp::http::StatusCode::BAD_REQUEST.into_response()),
        }
    }

    pub async fn all(state: Arc<HypoState>) -> Result<impl warp::Reply, Infallible> {
        query("".to_string(), state).await
    }
}

pub mod filters {
    use super::*;

    pub fn messages(
        state: Arc<HypoState>,
    ) -> impl Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone {
        all(state.clone()).or(query(state.clone()))
    }

    pub fn all(
        state: Arc<HypoState>,
    ) -> impl Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone {
        warp::path!("messages")
            .and(warp::get())
            .and(with_state(state))
            .and_then(handlers::all)
    }

    pub fn query(
        state: Arc<HypoState>,
    ) -> impl Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone {
        warp::path!("messages" / String)
            .and(warp::get())
            .and(with_state(state))
            .and_then(handlers::query)
    }
}
