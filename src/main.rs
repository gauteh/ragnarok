use actix_web::{web, middleware, App, HttpResponse, HttpServer, Responder};
use env_logger;
use notmuch;
use serde_derive::{Deserialize, Serialize};

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
    let mut threads = query.search_threads().unwrap();

    let mut t: Vec<Thread> = vec! (); 

    while let Some (th) = threads.next () {
        t.push (Thread { 
            authors: th.authors(), 
            subject: th.subject(),
            date: th.oldest_date() });
    }
    
    HttpResponse::Ok().json (t)
}

fn main() -> std::io::Result<()> {
    std::env::set_var("RUST_LOG", "actix_web=info");
    env_logger::init();

    HttpServer::new(|| {
        App::new()
            .wrap (middleware::Logger::default())
            .route("/threads", web::get().to(threads))
    })
    .bind("127.0.0.1:8088")?
    .run()
}

