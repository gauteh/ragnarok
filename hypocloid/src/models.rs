use serde_derive::Deserialize;

#[derive(Deserialize, Debug)]
pub struct TagRequest {
    pub add: Option<Vec<String>>,
    pub remove: Option<Vec<String>>,
}


