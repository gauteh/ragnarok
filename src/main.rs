#![feature(test)]

use actix_web::{web, http::header, middleware, App,
    HttpResponse, HttpServer, HttpRequest};
use actix_cors::Cors;

#[macro_use]
extern crate log;
use env_logger;

use notmuch;
use bytes::Bytes;
extern crate futures;
use futures::stream::iter_ok;
use serde_derive::Serialize;
use std::sync::Arc;
use itertools::Itertools;

mod test;

#[derive(Serialize)]
pub struct Thread {
    id: String,
    authors: Vec<String>,
    subject: String,
    date: i64,
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
                date: t.oldest_date() }),
            _ => None
        }
    }
}

fn mthreads(req: HttpRequest) -> HttpResponse {
    let query: String = req.match_info().get ("query").unwrap_or ("*").parse ().unwrap ();
    HttpResponse::Ok ()
        .content_type ("application/x-ndjson")
        .streaming (
            iter_ok::<_, ()> (
                Threads::new (query)
                .map (|th| Bytes::from(serde_json::ser::to_string (&th).unwrap()))
                .intersperse (Bytes::from("\n"))
            )
        )
}

fn main() -> std::io::Result<()> {
    std::env::set_var("RUST_LOG", "hypocloid=debug,actix_web=info");
    env_logger::init();

    info! ("hello!");

    HttpServer::new(|| {
        App::new()
            .wrap (
                Cors::new ()
                    .allowed_origin("http://localhost:8080")
                    .allowed_methods(vec!["GET", "POST"])
                    .allowed_headers(vec![header::AUTHORIZATION, header::ACCEPT])
                    .allowed_header(header::CONTENT_TYPE)
                    .max_age(3600),
            )
            .wrap (middleware::Logger::default())
            .route("/threads", web::get().to_async (mthreads))
            .route("/threads/{query}", web::get().to_async (mthreads))
    })
    .bind("127.0.0.1:8088")?
    .run()
}

