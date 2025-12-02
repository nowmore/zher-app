use std::sync::Arc;
use tauri::{AppHandle, State};

pub struct UploadState {
    pub client: Arc<reqwest::Client>,
}

impl UploadState {
    pub fn new() -> Self {
        Self {
            client: Arc::new(reqwest::Client::builder()
                .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                .pool_idle_timeout(std::time::Duration::from_secs(15))
                .pool_max_idle_per_host(10)
                .build()
                .expect("Failed to create upload client")),
        }
    }
}

#[tauri::command]
pub async fn upload_file_chunk(
    _app: AppHandle,
    upload_state: State<'_, UploadState>,
    url: String,
    data: Vec<u8>,
) -> Result<(), String> {
    // Use the shared client
    let response = upload_state
        .client
        .post(&url)
        .header("Content-Type", "application/octet-stream")
        .body(data)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        return Err(format!("Upload failed with status: {}", response.status()));
    }

    Ok(())
}
// End of file
