use std::path::PathBuf;
use tauri::AppHandle;

#[tauri::command]
pub async fn read_shared_file(path: String) -> Result<Vec<u8>, String> {
    let file_path = PathBuf::from(&path);

    if !file_path.exists() {
        return Err(format!("File not found: {}", path));
    }

    std::fs::read(&file_path).map_err(|e| format!("Failed to read file: {}", e))
}

#[tauri::command]
pub async fn cleanup_shared_files(_app: AppHandle) -> Result<(), String> {
    // This will be called from Android to clean up cache
    Ok(())
}
