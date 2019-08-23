# Hypocloid

## Requirements

1. Rust nightly (or very recent), e.g. through [rustup](https://github.com/rust-lang/rustup.rs/#other-installation-methods)

## Building

1. `cargo build`

## Running

1. `cargo run`

You should now be able to query your notmuch database using `curl`:

```sh
$ curl -sN http://localhost:8088/threads
```

