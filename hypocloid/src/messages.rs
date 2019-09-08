use super::*;
use bytes::Bytes;

pub fn messages(req: HttpRequest)
  -> actix_web::Result<HttpResponse>
{
  let route = "/messages";
  let mut query = &req.path()[route.len()..];
  if query.starts_with ("/") {
    query = &query[1..];
  }

  use std::process::Command;

  /* XXX: we presumably need to implement something custom here.
   * also, tokio_process has an async Command which would be good
   * too.
   *
   * XXX: sanitize html here, using e.g. ammonia?
   *
   * */
  let messages = Command::new ("notmuch")
    .arg ("show")
    .arg ("--format=json")
    .arg ("--exclude=false")
    .arg ("--include-html")
    .arg (query)
    .output ()
    .map_err (
      |e| actix_web::error::ErrorInternalServerError (e))?;

  Ok(HttpResponse::Ok ()
    .content_type ("application/json")
    .body (Bytes::from(messages.stdout)))
}

