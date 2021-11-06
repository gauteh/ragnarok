#![feature(test)]
#![feature(iter_intersperse)]

#[macro_use]
extern crate log;

use argh::FromArgs;
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

#[derive(FromArgs)]
/// Reach new heights.
struct Options {
    /// add CORS headers allowing the specified origin
    #[argh(option)]
    allow_cors: Option<String>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let options: Options = argh::from_env();
    env_logger::Builder::from_env(Env::default().default_filter_or("hypocloid=debug,warp=info"))
        .init();
    info!("hypocloid!");
    info!("notmuch config: {}", notmuch_config().to_str().unwrap());

    let state = Arc::new(HypoState::new()?);
    let threads = threads::filters::threads(state.clone());
    let messages = messages::filters::messages(state.clone());
    let tags = tags::filters::all(state.clone());

    if options.allow_cors.is_some() {
        let origin = options.allow_cors.unwrap();
        let cors = warp::cors().allow_origin(&*origin).allow_methods(&[
            Method::GET,
            Method::POST,
            Method::DELETE,
        ]).allow_headers(vec!["Content-Type"]);

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
