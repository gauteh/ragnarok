use actix_web::{web, http::header, middleware, App, HttpResponse, HttpServer,
HttpRequest};
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

#[derive(Serialize)]
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

        debug! ("query: {}..", q);
        let query = Arc::new (notmuch::Query::create (db.clone (), &q).unwrap ());
        debug! ("query: done, threads: {}", query.count_threads().unwrap ());

        let threads =
            <notmuch::Query<'static> as notmuch::QueryExt>
                ::search_threads (query.clone()).unwrap ();

        Threads {
            t: threads
        }
    }
}

impl Iterator for Threads {
    type Item = Thread;

    fn next (&mut self) -> Option<Thread> {
        match self.t.next() {
            Some (t) => Some (Thread {
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
            .route("/threads/{query}", web::get().to_async (mthreads))
    })
    .bind("127.0.0.1:8088")?
    .run()
}

