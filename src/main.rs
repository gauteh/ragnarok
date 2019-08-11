use actix_web::{web, http::header, middleware, App, HttpResponse, HttpServer, Responder, Error};
use actix_cors::Cors;
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

fn threads() -> impl Responder {
    let mail_path = "/Users/gauteh/.mail";
    let db = notmuch::Database::open (&mail_path, notmuch::DatabaseMode::ReadOnly).unwrap();

    let query = db.create_query ("astrid").unwrap();
    let threads = query.search_threads().unwrap();

    let t: Vec<bytes::Bytes> =
        std::iter::once (Bytes::from ("["))
        .chain (
            threads
            .map (
                |th| Thread { authors: th.authors(),
                        subject: th.subject(),
                        date: th.oldest_date() })
            .map (|th| Bytes::from(serde_json::ser::to_string (&th).unwrap()))
            .intersperse (Bytes::from(","))
            .chain (std::iter::once (Bytes::from("]"))))
            .collect ();

    let s: IterOk<_, ()> = iter_ok (t);

    HttpResponse::Ok()
        .content_type ("application/json")
        .streaming (s)
}

fn main() -> std::io::Result<()> {
    std::env::set_var("RUST_LOG", "actix_web=info");
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
            .route("/threads", web::get().to(threads))
    })
    .bind("127.0.0.1:8088")?
    .run()
}

