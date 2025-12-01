use futures_util::StreamExt;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, Manager, State};
use tokio::io::AsyncWriteExt;

#[derive(Clone, serde::Serialize)]
struct DownloadProgress {
    id: u64,
    received: u64,
    total: u64,
}

#[tauri::command]
async fn download_file(app: AppHandle, url: String, filename: String) -> Result<String, String> {
    let download_path = app.path().download_dir().map_err(|e| e.to_string())?;
    let file_path = download_path.join(&filename);

    let client = reqwest::Client::new();
    let response = client.get(&url).send().await.map_err(|e| e.to_string())?;

    let total_size = response.content_length().unwrap_or(0);
    let task_id = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as u64;

    // Emit start event
    app.emit(
        "download-started",
        serde_json::json!({
            "id": task_id,
            "name": filename,
            "size": total_size
        }),
    )
    .unwrap_or(());

    let mut file = tokio::fs::File::create(&file_path)
        .await
        .map_err(|e| e.to_string())?;
    let mut stream = response.bytes_stream();
    let mut received = 0;

    while let Some(item) = stream.next().await {
        let chunk = item.map_err(|e| e.to_string())?;
        file.write_all(&chunk).await.map_err(|e| e.to_string())?;
        received += chunk.len() as u64;

        // Emit progress
        app.emit(
            "download-progress",
            DownloadProgress {
                id: task_id,
                received,
                total: total_size,
            },
        )
        .unwrap_or(());
    }

    app.emit("download-completed", serde_json::json!({ "id": task_id }))
        .unwrap_or(());
    Ok("Download started".to_string())
}

struct ServerState {
    running: Arc<Mutex<bool>>,
}

#[tauri::command]
async fn start_server(state: State<'_, ServerState>) -> Result<String, String> {
    {
        let mut running = state.running.lock().map_err(|e| e.to_string())?;
        
        if *running {
            return Err("Server already running".to_string());
        }
        
        *running = true;
    }
    
    let running_clone = Arc::clone(&state.running);
    
    tauri::async_runtime::spawn(async move {
        log::info!("Starting zher server on 0.0.0.0:4836");
        let result = zher::run_server("0.0.0.0".to_string(), "4836".to_string()).await;
        log::info!("Server stopped with result: {:?}", result);
        if let Ok(mut r) = running_clone.lock() {
            *r = false;
        }
    });
    
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
    
    Ok("Server started".to_string())
}

#[tauri::command]
async fn get_server_status(state: State<'_, ServerState>) -> Result<bool, String> {
    let running = state.running.lock().map_err(|e| e.to_string())?;
    Ok(*running)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(ServerState {
            running: Arc::new(Mutex::new(false)),
        })
        .invoke_handler(tauri::generate_handler![
            download_file,
            start_server,
            get_server_status
        ])
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            #[cfg(mobile)]
            app.handle().plugin(tauri_plugin_barcode_scanner::init())?;

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
