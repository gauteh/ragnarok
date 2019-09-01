#![feature(test)]

extern crate futures;

use actix_web::{web, http::header, middleware, App,
HttpResponse, HttpServer, HttpRequest};
use actix_cors::Cors;

#[macro_use]
extern crate log;
use env_logger;

use std::env;
use std::path;
use dirs;
use ini::Ini;

/* internal modules */
mod test;
pub mod threads;
pub mod messages;

pub struct HypoState {
  notmuch_config: Ini
}

fn main() -> std::io::Result<()> {
  std::env::set_var("RUST_LOG", "hypocloid=debug,actix_web=info");
  env_logger::init();

  info! ("hello!");

  /* find notmuch dir */
  let nc = match env::var ("NOTMUCH_CONFIG") {
    Ok (p) => path::PathBuf::from (p),
    _      => { let mut d = dirs::home_dir().unwrap(); d.push (".notmuch-config"); d }
  };

  debug! ("notmuch config: {}", nc.to_str().unwrap());

  HttpServer::new(move || {
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
      .data (HypoState {
        notmuch_config: Ini::load_from_file (nc.clone()).unwrap()
      })
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

