#![feature(test)]
#![feature(iter_intersperse)]

#[macro_use]
extern crate log;

use env_logger::Env;
use std::env;
use std::sync::Arc;
use warp::{http::Method, Filter};

/* internal modules */
mod messages;
mod models;
mod state;
mod tags;
mod threads;

use state::*;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    env_logger::Builder::from_env(Env::default().default_filter_or("hypocloid=debug,warp=info"))
        .init();
    info!("hypocloid!");
    info!("notmuch config: {}", notmuch_config().to_str().unwrap());

    let state = Arc::new(HypoState::new()?);
    let threads = threads::filters::threads(state.clone());
    let messages = messages::filters::messages(state.clone());
    let tags = tags::filters::all(state.clone());

    let args: Vec<String> = env::args().collect();
    let cors = warp::cors()
        .allow_origin("http://localhost:3000")
        .allow_methods(&[Method::GET, Method::POST, Method::DELETE]);
    let mut is_cors = false;

    if args.iter().any(|i| i == "--allow-cors") {
        is_cors = true;
    }

    if is_cors {
        let api = messages
            .or(threads)
            .or(tags)
            .with(cors)
            .with(warp::log("hypocloid::api"));
        info!("Listening on 127.0.0.1:8088, CORS enabled");
        warp::serve(api).run(([127, 0, 0, 1], 8088)).await;
    } else {
        let api = messages
            .or(threads)
            .or(tags)
            .with(warp::log("hypocloid::api"));
        warp::serve(api).run(([127, 0, 0, 1], 8088)).await;
    }
    Ok(())
}
