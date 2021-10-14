use crate::state::{filters::with_state, HypoState};
use bytes::Bytes;
use futures::stream;
use hyper::Body;
use percent_encoding::percent_decode_str;
use serde_derive::Serialize;
use std::convert::Infallible;
use std::sync::Arc;
use warp::{http::Response, Filter};

#[derive(Debug, Serialize)]
pub struct Thread {
    id: String,
    authors: Vec<String>,
    subject: String,
    newest_date: i64,
    oldest_date: i64,
    total_messages: i32,
    unread: bool,
    tags: Vec<String>,
}

pub struct Threads(notmuch::Threads<'static, 'static>);

impl Threads {
    pub fn new(db: String, q: String) -> Threads {
        let db = Arc::new(notmuch::Database::open(&db, notmuch::DatabaseMode::ReadOnly).unwrap());

        let formatted = &percent_decode_str(&q).decode_utf8();
        debug!("threads query: {}..", formatted.as_ref().unwrap());
        let query =
            Arc::new(notmuch::Query::create(db.clone(), &formatted.as_ref().unwrap()).unwrap());

        let threads =
            <notmuch::Query<'static> as notmuch::QueryExt>::search_threads(query.clone()).unwrap();

        Threads(threads)
    }
}

impl Iterator for Threads {
    type Item = Thread;

    fn next(&mut self) -> Option<Thread> {
        match self.0.next() {
            Some(t) => Some(Thread {
                id: t.id().to_string(),
                authors: t.authors(),
                subject: t.subject().to_string(),
                newest_date: t.newest_date(),
                oldest_date: t.oldest_date(),
                total_messages: t.total_messages(),
                unread: t.tags().any(|tag| tag == "unread"),
                tags: t.tags().collect(),
            }),
            _ => None,
        }
    }
}

pub mod handlers {
    use super::*;

    pub async fn query(
        query: String,
        state: Arc<HypoState>,
    ) -> Result<impl warp::Reply, Infallible> {
        let nmdb = state
            .notmuch_config
            .get_from(Some("database"), "path")
            .unwrap();

        let t = Threads::new(String::from(nmdb), String::from(query))
            .map(|th| Bytes::from(serde_json::ser::to_string(&th).unwrap()))
            .intersperse(Bytes::from("\n"))
            .map(|b| Ok::<_, std::io::Error>(b));

        let s = stream::iter(t);

        Ok(Response::builder()
            .header("Content-Type", "application/x-ndjson")
            .body(Body::wrap_stream(s)))
    }

    pub async fn all(state: Arc<HypoState>) -> Result<impl warp::Reply, Infallible> {
        query("".to_string(), state).await
    }
}

pub mod filters {
    use super::*;

    pub fn threads(
        state: Arc<HypoState>,
    ) -> impl Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone {
        all(state.clone()).or(query(state.clone()))
    }

    pub fn all(
        state: Arc<HypoState>,
    ) -> impl Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone {
        warp::path!("threads")
            .and(warp::get())
            .and(with_state(state))
            .and_then(handlers::all)
    }

    pub fn query(
        state: Arc<HypoState>,
    ) -> impl Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone {
        warp::path!("threads" / String)
            .and(warp::get())
            .and(with_state(state))
            .and_then(handlers::query)
    }
}

#[cfg(test)]
mod test_notmuch {
    use super::*;

    fn init() {
        std::env::set_var("RUST_LOG", "hypocloid=debug");
        let _ = env_logger::builder().is_test(true).try_init();
    }

    #[test]
    fn test_notmuch() {
        init();

        let state = HypoState::new().unwrap();
        let mail_path = state
            .notmuch_config
            .get_from(Some("database"), "path")
            .unwrap();
        let db = notmuch::Database::open(&mail_path, notmuch::DatabaseMode::ReadOnly).unwrap();

        let query = db.create_query("*").unwrap();
        let threads = query.search_threads().unwrap();

        let mut i = 0;
        debug!("counting threads..");
        for _t in threads {
            i += 1;

            if i > 20 {
                break;
            }
        }

        debug!("entries: {}", i);
    }

    #[test]
    fn test_heap_iterator() {
        init();

        let state = HypoState::new().unwrap();
        let mail_path = state
            .notmuch_config
            .get_from(Some("database"), "path")
            .unwrap();

        let threads = Threads::new(String::from(mail_path), String::from("*"));

        let mut i = 0;
        debug!("counting threads..");
        for _t in threads {
            i += 1;

            if i > 20 {
                break;
            }
        }

        debug!("entries: {}", i);
    }
}
