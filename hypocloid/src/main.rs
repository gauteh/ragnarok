#![feature(test)]
#![feature(iter_intersperse)]

#[macro_use]
extern crate log;

use env_logger::Env;
use std::sync::Arc;
use warp::Filter;

/* internal modules */
mod messages;
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

    let api = messages
        .or(threads)
        .or(tags)
        .with(warp::log("hypocloid::api"));

    info!("Listening on 127.0.0.1:8088");
    warp::serve(api).run(([127, 0, 0, 1], 8088)).await;

    Ok(())
}
