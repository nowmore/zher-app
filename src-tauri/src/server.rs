use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use tauri::State;
use tokio::task::JoinHandle;
use zher::run_server;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerStatus {
    pub running: bool,
    pub port: u16,
    pub url: String,
}

pub struct ServerState {
    status: Arc<Mutex<ServerStatus>>,
    handle: Arc<Mutex<Option<JoinHandle<()>>>>,
}

impl ServerState {
    pub fn new() -> Self {
        Self {
            status: Arc::new(Mutex::new(ServerStatus {
                running: false,
                port: 0,
                url: String::new(),
            })),
            handle: Arc::new(Mutex::new(None)),
        }
    }
}

#[tauri::command]
pub async fn start_server(server_state: State<'_, ServerState>) -> Result<bool, String> {
    let mut status = server_state.status.lock().unwrap();

    if status.running {
        return Ok(true);
    }

    status.running = true;
    status.port = 4836;
    status.url = format!("http://0.0.0.0:{}", status.port);

    let port = status.port;
    drop(status);

    let handle = tokio::spawn(async move {
        let _ = run_server("0.0.0.0".to_string(), port.to_string()).await;
    });

    let mut handle_lock = server_state.handle.lock().unwrap();
    *handle_lock = Some(handle);

    Ok(true)
}

#[tauri::command]
pub async fn stop_server(server_state: State<'_, ServerState>) -> Result<(), String> {
    let mut status = server_state.status.lock().unwrap();

    if !status.running {
        return Err("Server not running".to_string());
    }

    status.running = false;
    status.port = 0;
    status.url.clear();
    drop(status);

    let mut handle_lock = server_state.handle.lock().unwrap();
    if let Some(handle) = handle_lock.take() {
        handle.abort();
    }

    Ok(())
}

#[tauri::command]
pub async fn get_server_status(server_state: State<'_, ServerState>) -> Result<bool, String> {
    let status = server_state.status.lock().unwrap();
    Ok(status.running)
}
