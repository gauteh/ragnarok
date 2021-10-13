use crate::state::{filters::with_state, HypoState};
use std::convert::Infallible;
use std::sync::Arc;
use warp::{http::Response, reply::Reply, Filter};

use crate::models::TagRequest;

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


    pub fn tag(
        query: String,
        command: TagRequest,
        state: Arc<HypoState>,
    ) -> impl warp::Reply {
        debug!("changing tags on {}: {:?}", query, command);

        let nmdb = state
            .notmuch_config
            .get_from(Some("database"), "path")
            .unwrap();

        let db =
            notmuch::Database::open(&String::from(nmdb), notmuch::DatabaseMode::ReadWrite).unwrap();
        let dbquery =  notmuch::Query::create(db, &("id:".to_owned()+&query)).unwrap();

        let messages =
            <notmuch::Query<'static> as notmuch::QueryExt>::search_messages(dbquery).unwrap();

        for mh in messages {
            match command.add {
                Some(ref x) => {
                    for tag in x {
                        mh.add_tag(tag).unwrap();
                    }
                }
                None => debug!("no tags to add"),
            }

            match command.remove {
                Some(ref x) => {
                    for tag in x {
                        mh.remove_tag(tag).unwrap();
                    }
                }
                None => debug!("no tags to remove"),
            }
        }

        warp::http::StatusCode::NO_CONTENT
    }

}

pub mod filters {
    use super::*;

    pub fn messages(
        state: Arc<HypoState>,
    ) -> impl Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone {
        all(state.clone())
            .or(query(state.clone()))
            .or(tag(state.clone()))
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

    pub fn tag(
        state: Arc<HypoState>,
    ) -> impl Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone {
        warp::path!("messages" / String / "tag")
            .and(warp::post())
            .and(warp::body::json())
            .and(with_state(state))
            .map(handlers::tag)
    }
}

