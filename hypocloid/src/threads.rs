use super::*;
use futures::stream::iter_ok;
use serde_derive::Serialize;
use std::sync::Arc;
use itertools::Itertools;
use bytes::Bytes;
use notmuch;

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
  pub fn new (q: String) -> Threads {
    let db = Arc::new (notmuch::Database::open (
        &String::from("/Users/gauteh/.mail"),
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

pub fn threads(req: HttpRequest) -> HttpResponse {
  let query: String = req.match_info().get ("query").unwrap_or ("*").parse ().unwrap ();
  HttpResponse::Ok ()
    .content_type ("application/x-ndjson")
    .streaming (
      iter_ok::<_, ()> (
        Threads::new (query)
        .map (|th|
          Bytes::from(
            serde_json::ser::to_string (&th).unwrap()))
        .intersperse (Bytes::from("\n"))
      )
    )
}
