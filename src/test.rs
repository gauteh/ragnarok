#[cfg(test)]

mod test_notmuch {
    fn init () {
        std::env::set_var("RUST_LOG", "hypocloid=debug,actix_web=info");
        let _ = env_logger::builder().is_test (true).try_init ();
    }

    #[test]
    fn test_notmuch () {
        init ();

        let mail_path = "/Users/gauteh/.mail";
        let db = notmuch::Database::open (&mail_path, notmuch::DatabaseMode::ReadOnly).unwrap();

        let query = db.create_query ("*").unwrap();
        let threads = query.search_threads().unwrap();

        let mut i = 0;
        debug! ("counting threads..");
        for _t in threads {
            i += 1;

            if i % 500 == 0 {
                debug! ("entries: {}", i);
            }

            if i > 20000 {
                break;
            }
        }

        debug! ("entries: {}", i);
    }

    #[test]
    fn test_heap_iterator () {
        init ();

        use super::super::*;

        let threads = Threads::new (String::from ("*"));

        let mut i = 0;
        debug! ("counting threads..");
        for _t in threads {
            i += 1;

            if i % 500 == 0 {
                debug! ("entries: {}", i);
            }

            if i > 20000 {
                break;
            }
        }

        debug! ("entries: {}", i);
    }

}
