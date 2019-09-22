use actix_web::{web, HttpResponse, HttpRequest};
use futures::stream::iter_ok;
use serde_derive::Serialize;
use std::sync::Arc;
use itertools::Itertools;
use bytes::Bytes;
use notmuch;
use crate::state::HypoState;

#[derive(Serialize)]
pub struct Thread {
  id: String,
  authors: Vec<String>,
  subject: String,
  newest_date: i64,
  oldest_date: i64,
  total_messages: i32,
  unread: bool,
  tags: Vec<String>
}

pub struct Threads (notmuch::Threads<'static, 'static>);

impl Threads {
  pub fn new (db: String, q: String) -> Threads {
    let db = Arc::new (notmuch::Database::open (
        &db,
        notmuch::DatabaseMode::ReadOnly).unwrap());

    debug! ("threads query: {}..", q);
    let query = Arc::new (notmuch::Query::create (db.clone (), &q).unwrap ());

    let threads =
      <notmuch::Query<'static> as notmuch::QueryExt>
      ::search_threads (query.clone()).unwrap ();

    Threads (threads)
  }
}

impl Iterator for Threads {
  type Item = Thread;

  fn next (&mut self) -> Option<Thread> {
    match self.0.next() {
      Some (t) => Some (Thread {
        id: t.id (),
        authors: t.authors(),
        subject: t.subject(),
        newest_date: t.newest_date (),
        oldest_date: t.oldest_date(),
        total_messages: t.total_messages (),
        unread: t.tags().any (|tag| tag == "unread"),
        tags: t.tags ().collect()
      }),
      _ => None
    }
  }
}

pub fn threads(state: web::Data<HypoState>, req: HttpRequest) -> HttpResponse {
  let route = "/threads";
  let mut query = &req.path()[route.len()..];
  if query.starts_with ("/") {
    query = &query[1..];
  }

  let nmdb = state.notmuch_config
    .get_from (Some("database"), "path").unwrap();

  HttpResponse::Ok ()
    .content_type ("application/x-ndjson")
    .streaming (
      iter_ok::<_, ()> (
        Threads::new (String::from(nmdb), String::from(query))
        .map (|th|
          Bytes::from(
            serde_json::ser::to_string (&th).unwrap()))
        .intersperse (Bytes::from("\n"))
      )
    )
}
