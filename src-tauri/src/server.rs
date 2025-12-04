use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use tauri::State;
use tokio::sync::oneshot;
use tokio::task::JoinHandle;
use zher::run_server_with_shutdown;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerStatus {
    pub running: bool,
    pub port: u16,
    pub url: String,
}

pub struct ServerState {
    status: Arc<Mutex<ServerStatus>>,
    handle: Arc<Mutex<Option<JoinHandle<()>>>>,
    shutdown_tx: Arc<Mutex<Option<oneshot::Sender<()>>>>,
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
            shutdown_tx: Arc::new(Mutex::new(None)),
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

    let (shutdown_tx, shutdown_rx) = oneshot::channel();

    let handle = tokio::spawn(async move {
        let _ = run_server_with_shutdown("0.0.0.0".to_string(), port.to_string(), shutdown_rx).await;
    });

    let mut handle_lock = server_state.handle.lock().unwrap();
    *handle_lock = Some(handle);

    let mut shutdown_lock = server_state.shutdown_tx.lock().unwrap();
    *shutdown_lock = Some(shutdown_tx);

    Ok(true)
}

#[tauri::command]
pub async fn stop_server(server_state: State<'_, ServerState>) -> Result<(), String> {
    // Scope to ensure locks are dropped before await
    {
        let mut status = server_state.status.lock().unwrap();

        if !status.running {
            return Err("Server not running".to_string());
        }

        status.running = false;
        status.port = 0;
        status.url.clear();
    } // status lock dropped here

    // Send shutdown signal
    {
        let mut shutdown_lock = server_state.shutdown_tx.lock().unwrap();
        if let Some(tx) = shutdown_lock.take() {
            let _ = tx.send(());
        }
    }

    // Wait for server to shutdown gracefully
    let handle = {
        let mut handle_lock = server_state.handle.lock().unwrap();
        handle_lock.take()
    }; // handle lock dropped here

    if let Some(handle) = handle {
        // Wait for the task to complete (with timeout)
        let _ = tokio::time::timeout(
            tokio::time::Duration::from_secs(2),
            handle
        ).await;
    }

    Ok(())
}

#[tauri::command]
pub async fn get_server_status(server_state: State<'_, ServerState>) -> Result<bool, String> {
    let status = server_state.status.lock().unwrap();
    Ok(status.running)
}
