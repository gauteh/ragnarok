#![feature(test)]

use actix_web::{web, http::header, middleware, App,
    HttpResponse, HttpServer, HttpRequest};
use actix_cors::Cors;

#[macro_use]
extern crate log;
use env_logger;

extern crate futures;

mod test;
pub mod threads;

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
            .route("/threads", web::get().to_async (threads::threads))
            .route("/threads/{query}", web::get().to_async (threads::threads))
    })
    .bind("127.0.0.1:8088")?
    .run()
}

