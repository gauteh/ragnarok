use hypocycloid;
use web_view::*;

#[tokio::main]
async fn main() {
    tokio::spawn(async move { hypocycloid::main().await });

    web_view::builder()
        .title("Astroid")
        .content(Content::Url("http://localhost:8088/assets/index.html"))
        .size(600, 800)
        .resizable(true)
        .debug(true)
        .user_data(())
        .invoke_handler(|_webview, _arg| Ok(()))
        .run()
        .unwrap();
}
