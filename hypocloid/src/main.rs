#![feature(test)]
#![feature(async_await)]

extern crate futures;

use actix_web::{web, http::header, middleware, App,
                HttpResponse, HttpServer, HttpRequest};
use actix_cors::Cors;

#[macro_use]
extern crate log;
use env_logger;

/* internal modules */
mod test;
mod threads;
mod messages;
mod state;

use state::*;

fn main() -> std::io::Result<()> {
  std::env::set_var("RUST_LOG", "hypocloid=debug,actix_web=info");
  env_logger::init();

  info! ("hello!");

  debug! ("notmuch config: {}", notmuch_config().to_str().unwrap());

  HttpServer::new(move || {
    App::new()
      .wrap (
        Cors::new ()
        .allowed_origin("http://localhost:8080")
        .allowed_methods(vec!["GET", "POST"])
        .allowed_headers(vec![header::AUTHORIZATION, header::ACCEPT])
        .allowed_header(header::CONTENT_TYPE)
        .max_age(3600)
      )
      .wrap (middleware::Logger::default())
      .data (HypoState::new ())
      .service (
        web::resource ("/threads*")
        .route (
          web::get().to_async (threads::threads))
        )
      .service (
        web::resource ("/messages*")
        .route (
          web::get().to_async (messages::messages))
        )
  })
  .bind("127.0.0.1:8088")?
    .run()
}

