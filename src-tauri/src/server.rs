use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use tauri::State;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerStatus {
    pub running: bool,
    pub port: u16,
    pub url: String,
}

pub struct ServerState {
    status: Arc<Mutex<ServerStatus>>,
}

impl ServerState {
    pub fn new() -> Self {
        Self {
            status: Arc::new(Mutex::new(ServerStatus {
                running: false,
                port: 0,
                url: String::new(),
            })),
        }
    }
}

#[tauri::command]
pub async fn start_server(
    port: u16,
    server_state: State<'_, ServerState>,
) -> Result<ServerStatus, String> {
    let mut status = server_state.status.lock().unwrap();
    
    if status.running {
        return Err("Server already running".to_string());
    }
    
    status.running = true;
    status.port = port;
    status.url = format!("http://0.0.0.0:{}", port);
    
    Ok(status.clone())
}

#[tauri::command]
pub async fn stop_server(
    server_state: State<'_, ServerState>,
) -> Result<(), String> {
    let mut status = server_state.status.lock().unwrap();
    
    if !status.running {
        return Err("Server not running".to_string());
    }
    
    status.running = false;
    status.port = 0;
    status.url.clear();
    
    Ok(())
}

#[tauri::command]
pub async fn get_server_status(
    server_state: State<'_, ServerState>,
) -> Result<ServerStatus, String> {
    let status = server_state.status.lock().unwrap();
    Ok(status.clone())
}
