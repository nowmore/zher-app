mod discovery;
mod download;
mod server;

use std::collections::HashMap;
use std::sync::Arc;
use tauri::Manager;
use tokio::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
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

            let download_state = download::DownloadState {
                records: Arc::new(Mutex::new(Vec::<download::DownloadRecord>::new())),
                active_downloads: Arc::new(Mutex::new(
                    HashMap::<u64, download::ActiveDownload>::new(),
                )),
            };

            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let records = download::load_downloads(&app_handle).await;
                if let Some(state) = app_handle.try_state::<download::DownloadState>() {
                    let mut locked = state.records.lock().await;
                    *locked = records;
                }
            });

            app.manage(download_state);
            app.manage(server::ServerState::new());

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            download::download_file,
            download::pause_download,
            download::resume_download,
            download::cancel_download,
            download::get_downloads,
            download::delete_download,
            download::delete_all_downloads,
            download::open_download_file,
            download::rename_download,
            download::share_download,
            download::open_with_download,
            discovery::discover_services,
            discovery::validate_service_url,
            server::start_server,
            server::stop_server,
            server::get_server_status
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
