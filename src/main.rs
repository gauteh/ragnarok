use actix_web::{web, http::header, middleware, App, HttpResponse, HttpServer, Responder, Error};
use actix_cors::Cors;
#[macro_use]
extern crate log;
use env_logger;
use notmuch;
use bytes::Bytes;
extern crate futures;
use futures::stream::once;
use futures::Stream;
use futures::stream::{iter_ok, IterOk};
use serde_derive::{Deserialize, Serialize};
use supercow;
use supercow::Supercow;
use std::sync::Arc;
use itertools::Itertools;

#[derive(Debug, Deserialize, Serialize)]
struct Thread {
    authors: Vec<String>,
    subject: String,
    date: i64,
}

struct Threads {
    t: notmuch::Threads<'static, 'static>
}

impl Threads {
    pub fn new (q: String) -> Threads {
        let db = Arc::new (notmuch::Database::open (
                &String::from("/Users/gauteh/.mail"),
                notmuch::DatabaseMode::ReadOnly).unwrap());

        debug! ("query: start");
        let query = Arc::new (notmuch::Query::create (db.clone (), &q).unwrap ());

        debug! ("query: {}, threads: {}", q, query.count_threads ().unwrap ());

        let threads = 
            <notmuch::Query<'static> as notmuch::QueryExt>
                ::search_threads (query.clone()).unwrap ();

        debug! ("query: done");
        Threads {
            t: threads
        }
    }
}

impl Iterator for Threads {
    type Item = Thread;

    fn next (&mut self) -> Option<Thread> {
        debug! ("iterating");
        match self.t.next() {
            Some (t) => Some (Thread {
                authors: t.authors(),
                subject: t.subject(),
                date: t.oldest_date() }),
            _ => None
        }
    }
}


fn mthreads() -> HttpResponse {
    HttpResponse::Ok ()
        .content_type ("application/json")
        .streaming (
            {
                iter_ok::<_, ()> (
                std::iter::once (Bytes::from ("["))
                    .chain (
                        Threads::new (String::from("*"))
                        .map (|th| Bytes::from(serde_json::ser::to_string (&th).unwrap()))
                        .intersperse (Bytes::from(","))
                        .chain (std::iter::once (Bytes::from("]"))))
                )
            }
        )
}

fn main() -> std::io::Result<()> {
    std::env::set_var("RUST_LOG", "debug");
    env_logger::init();

    HttpServer::new(|| {
        App::new()
            .wrap (
                Cors::new ()
                    .allowed_origin("http://localhost:4200")
                    .allowed_methods(vec!["GET", "POST"])
                    .allowed_headers(vec![header::AUTHORIZATION, header::ACCEPT])
                    .allowed_header(header::CONTENT_TYPE)
                    .max_age(3600),
            )
            .wrap (middleware::Logger::default())
            .route("/threads", web::get().to_async (mthreads))
    })
    .bind("127.0.0.1:8088")?
    .run()
}

