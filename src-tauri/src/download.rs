use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::{AppHandle, Emitter, Manager, State};
use tokio::io::{AsyncSeekExt, AsyncWriteExt};
use tokio::sync::{mpsc, Mutex};

#[derive(Clone, serde::Serialize)]
pub struct DownloadProgress {
    pub id: u64,
    pub received: u64,
    pub total: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadRecord {
    pub id: String,
    pub filename: String,
    pub path: String,
    pub size: u64,
    pub timestamp: i64,
}

#[derive(Clone)]
pub(crate) enum DownloadControl {
    Pause,
    Resume,
    Cancel,
}

pub struct ActiveDownload {
    pub control_tx: mpsc::UnboundedSender<DownloadControl>,
}

pub struct DownloadState {
    pub records: Arc<Mutex<Vec<DownloadRecord>>>,
    pub active_downloads: Arc<Mutex<HashMap<u64, ActiveDownload>>>,
}

impl Clone for DownloadState {
    fn clone(&self) -> Self {
        Self {
            records: Arc::clone(&self.records),
            active_downloads: Arc::clone(&self.active_downloads),
        }
    }
}

fn get_unique_filename(dir: &PathBuf, filename: &str) -> String {
    let path = dir.join(filename);

    if !path.exists() {
        return filename.to_string();
    }

    let stem = path.file_stem().and_then(|s| s.to_str()).unwrap_or("");
    let ext = path.extension().and_then(|s| s.to_str()).unwrap_or("");

    let mut counter = 1;
    loop {
        let new_name = if ext.is_empty() {
            format!("{}({})", stem, counter)
        } else {
            format!("{}({}).{}", stem, counter, ext)
        };

        let new_path = dir.join(&new_name);
        if !new_path.exists() {
            return new_name;
        }
        counter += 1;
    }
}

#[tauri::command]
pub async fn download_file(
    app: AppHandle,
    url: String,
    filename: String,
    download_state: State<'_, DownloadState>,
) -> Result<String, String> {
    #[cfg(target_os = "android")]
    let download_path = {
        use std::path::PathBuf;
        PathBuf::from("/storage/emulated/0/Download")
    };

    #[cfg(not(target_os = "android"))]
    let download_path = app.path().download_dir().map_err(|e| e.to_string())?;

    tokio::fs::create_dir_all(&download_path)
        .await
        .map_err(|e| format!("Failed to create download dir: {}", e))?;

    let unique_filename = get_unique_filename(&download_path, &filename);
    let file_path = download_path.join(&unique_filename);
    let temp_path = download_path.join(format!("{}.part", unique_filename));

    let task_id = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as u64;

    let (control_tx, mut control_rx) = mpsc::unbounded_channel();

    {
        let mut active = download_state.active_downloads.lock().await;
        active.insert(
            task_id,
            ActiveDownload {
                control_tx: control_tx.clone(),
            },
        );
    }

    let app_clone = app.clone();
    let download_state_clone = download_state.inner().clone();
    let file_path_clone = file_path.clone();
    let temp_path_clone = temp_path.clone();

    tokio::spawn(async move {
        let result = download_task(
            app_clone.clone(),
            task_id,
            url,
            temp_path_clone.clone(),
            &mut control_rx,
        )
        .await;

        match result {
            Ok(total_size) => {
                if let Err(_) = tokio::fs::rename(&temp_path_clone, &file_path_clone).await {
                    app_clone
                        .emit(
                            "download-failed",
                            serde_json::json!({ "id": task_id, "error": "Failed to save file" }),
                        )
                        .unwrap_or(());
                } else {
                    let record = DownloadRecord {
                        id: task_id.to_string(),
                        filename: unique_filename.clone(),
                        path: file_path_clone.to_string_lossy().to_string(),
                        size: total_size,
                        timestamp: std::time::SystemTime::now()
                            .duration_since(std::time::UNIX_EPOCH)
                            .unwrap()
                            .as_millis() as i64,
                    };

                    {
                        let mut records = download_state_clone.records.lock().await;
                        records.push(record.clone());
                        let records_clone = records.clone();
                        drop(records);

                        let app_clone2 = app_clone.clone();
                        tokio::spawn(async move {
                            save_downloads(&app_clone2, &records_clone).await;
                        });
                    }

                    app_clone
                        .emit("download-completed", serde_json::json!({ "id": task_id }))
                        .unwrap_or(());
                }
            }
            Err(e) => {
                app_clone
                    .emit(
                        "download-failed",
                        serde_json::json!({ "id": task_id, "error": e }),
                    )
                    .unwrap_or(());
            }
        }

        download_state_clone
            .active_downloads
            .lock()
            .await
            .remove(&task_id);
    });

    Ok(task_id.to_string())
}

async fn download_task(
    app: AppHandle,
    task_id: u64,
    url: String,
    temp_path: PathBuf,
    control_rx: &mut mpsc::UnboundedReceiver<DownloadControl>,
) -> Result<u64, String> {
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .build()
        .map_err(|e| e.to_string())?;

    let existing_size = if temp_path.exists() {
        tokio::fs::metadata(&temp_path)
            .await
            .map(|m| m.len())
            .unwrap_or(0)
    } else {
        0
    };

    let mut request = client.get(&url);
    if existing_size > 0 {
        request = request.header("Range", format!("bytes={}-", existing_size));
    }

    let response = request.send().await.map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        return Err(format!(
            "Download failed with status: {}",
            response.status()
        ));
    }

    let total_size = if let Some(content_range) = response.headers().get("content-range") {
        content_range
            .to_str()
            .ok()
            .and_then(|s| s.split('/').nth(1))
            .and_then(|s| s.parse::<u64>().ok())
            .unwrap_or_else(|| existing_size + response.content_length().unwrap_or(0))
    } else {
        response.content_length().unwrap_or(0)
    };

    app.emit(
        "download-started",
        serde_json::json!({
            "id": task_id,
            "name": temp_path.file_name().and_then(|n| n.to_str()).unwrap_or(""),
            "size": total_size
        }),
    )
    .unwrap_or(());

    let mut file = tokio::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&temp_path)
        .await
        .map_err(|e| e.to_string())?;

    if existing_size > 0 {
        file.seek(tokio::io::SeekFrom::End(0))
            .await
            .map_err(|e| e.to_string())?;
    }

    let mut stream = response.bytes_stream();
    let mut received = existing_size;
    let mut paused = false;

    loop {
        tokio::select! {
            control = control_rx.recv() => {
                match control {
                    Some(DownloadControl::Pause) => {
                        paused = true;
                        app.emit("download-paused", serde_json::json!({ "id": task_id })).unwrap_or(());
                    }
                    Some(DownloadControl::Resume) => {
                        paused = false;
                        app.emit("download-resumed", serde_json::json!({ "id": task_id })).unwrap_or(());
                    }
                    Some(DownloadControl::Cancel) | None => {
                        file.flush().await.map_err(|e| e.to_string())?;
                        return Err("Download cancelled".to_string());
                    }
                }
            }
            item = stream.next(), if !paused => {
                match item {
                    Some(Ok(chunk)) => {
                        file.write_all(&chunk).await.map_err(|e| e.to_string())?;
                        received += chunk.len() as u64;

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
                    Some(Err(e)) => {
                        file.flush().await.map_err(|e| e.to_string())?;
                        return Err(e.to_string());
                    }
                    None => {
                        file.flush().await.map_err(|e| e.to_string())?;
                        return Ok(total_size);
                    }
                }
            }
        }
    }
}

#[tauri::command]
pub async fn pause_download(
    task_id: u64,
    download_state: State<'_, DownloadState>,
) -> Result<(), String> {
    let active = download_state.active_downloads.lock().await;
    if let Some(download) = active.get(&task_id) {
        download
            .control_tx
            .send(DownloadControl::Pause)
            .map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("Download not found".to_string())
    }
}

#[tauri::command]
pub async fn resume_download(
    task_id: u64,
    download_state: State<'_, DownloadState>,
) -> Result<(), String> {
    let active = download_state.active_downloads.lock().await;
    if let Some(download) = active.get(&task_id) {
        download
            .control_tx
            .send(DownloadControl::Resume)
            .map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("Download not found".to_string())
    }
}

#[tauri::command]
pub async fn cancel_download(
    task_id: u64,
    download_state: State<'_, DownloadState>,
) -> Result<(), String> {
    let active = download_state.active_downloads.lock().await;
    if let Some(download) = active.get(&task_id) {
        download
            .control_tx
            .send(DownloadControl::Cancel)
            .map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("Download not found".to_string())
    }
}

#[tauri::command]
pub async fn get_downloads(
    download_state: State<'_, DownloadState>,
) -> Result<Vec<DownloadRecord>, String> {
    let records = download_state.records.lock().await;
    Ok(records.clone())
}

#[tauri::command]
pub async fn delete_download(
    app: AppHandle,
    id: String,
    download_state: State<'_, DownloadState>,
) -> Result<(), String> {
    let (path, records) = {
        let mut records = download_state.records.lock().await;

        if let Some(pos) = records.iter().position(|r| r.id == id) {
            let record = records.remove(pos);
            let path = record.path.clone();
            (Some(path), records.clone())
        } else {
            (None, records.clone())
        }
    };

    if let Some(path) = path {
        let _ = tokio::fs::remove_file(&path).await;
        save_downloads(&app, &records).await;
    }

    Ok(())
}

#[tauri::command]
pub async fn delete_all_downloads(
    app: AppHandle,
    download_state: State<'_, DownloadState>,
) -> Result<(), String> {
    let paths = {
        let mut records = download_state.records.lock().await;
        let paths: Vec<String> = records.iter().map(|r| r.path.clone()).collect();
        records.clear();
        paths
    };

    for path in paths {
        let _ = tokio::fs::remove_file(&path).await;
    }

    save_downloads(&app, &[]).await;

    Ok(())
}

#[tauri::command]
pub async fn open_download_file(app: AppHandle, path: String) -> Result<(), String> {
    if !tokio::fs::try_exists(&path).await.unwrap_or(false) {
        return Err("File not found".to_string());
    }

    use tauri_plugin_opener::OpenerExt;
    app.opener()
        .open_url(&path, None::<&str>)
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn rename_download(
    app: AppHandle,
    id: String,
    new_name: String,
    download_state: State<'_, DownloadState>,
) -> Result<(), String> {
    if new_name.trim().is_empty() {
        return Err("Invalid filename".to_string());
    }

    let (old_path, new_path, records) = {
        let mut records = download_state.records.lock().await;

        if let Some(record) = records.iter_mut().find(|r| r.id == id) {
            let old_path = PathBuf::from(&record.path);
            let parent = old_path.parent().ok_or("Invalid path")?;
            let new_path = parent.join(&new_name);

            if new_path.exists() {
                return Err("File already exists".to_string());
            }

            let old_path_str = record.path.clone();
            record.filename = new_name.clone();
            record.path = new_path.to_string_lossy().to_string();

            (
                old_path_str,
                new_path.to_string_lossy().to_string(),
                records.clone(),
            )
        } else {
            return Err("Download not found".to_string());
        }
    };

    tokio::fs::rename(&old_path, &new_path)
        .await
        .map_err(|e| format!("Failed to rename file: {}", e))?;

    save_downloads(&app, &records).await;

    Ok(())
}

#[tauri::command]
pub async fn share_download(
    #[allow(unused_variables)] app: AppHandle,
    path: String,
) -> Result<(), String> {
    if !tokio::fs::try_exists(&path).await.unwrap_or(false) {
        return Err("File not found".to_string());
    }

    #[cfg(target_os = "android")]
    {
        share_file_android(&app, &path).await
    }

    #[cfg(not(target_os = "android"))]
    {
        Err("Share not supported on this platform".to_string())
    }
}

#[cfg(target_os = "android")]
async fn share_file_android(app: &AppHandle, path: &str) -> Result<(), String> {
    use jni::objects::{JObject, JValue};
    use jni::JavaVM;

    let path_owned = path.to_string();
    let app_identifier = app.config().identifier.clone();

    app.run_on_main_thread(move || unsafe {
        let vm = JavaVM::from_raw(ndk_context::android_context().vm().cast()).unwrap();
        let mut env = vm.attach_current_thread().unwrap();

        let activity = JObject::from_raw(ndk_context::android_context().context().cast());

        let file_path = env.new_string(&path_owned).unwrap();
        let file_class = env.find_class("java/io/File").unwrap();
        let file = env
            .new_object(
                file_class,
                "(Ljava/lang/String;)V",
                &[JValue::Object(&file_path)],
            )
            .unwrap();

        let provider_class = env
            .find_class("androidx/core/content/FileProvider")
            .unwrap();
        let authority = env
            .new_string(format!("{}.fileprovider", app_identifier))
            .unwrap();

        let uri = env
            .call_static_method(
                provider_class,
                "getUriForFile",
                "(Landroid/content/Context;Ljava/lang/String;Ljava/io/File;)Landroid/net/Uri;",
                &[
                    JValue::Object(&activity),
                    JValue::Object(&authority),
                    JValue::Object(&file),
                ],
            )
            .unwrap()
            .l()
            .unwrap();

        let mime_str = env.new_string("application/octet-stream").unwrap();

        let intent_class = env.find_class("android/content/Intent").unwrap();
        let action_send = env
            .get_static_field(&intent_class, "ACTION_SEND", "Ljava/lang/String;")
            .unwrap()
            .l()
            .unwrap();
        let intent = env
            .new_object(
                &intent_class,
                "(Ljava/lang/String;)V",
                &[JValue::Object(&action_send)],
            )
            .unwrap();

        env.call_method(
            &intent,
            "setType",
            "(Ljava/lang/String;)Landroid/content/Intent;",
            &[JValue::Object(&mime_str)],
        )
        .unwrap();

        let extra_stream = env
            .get_static_field(&intent_class, "EXTRA_STREAM", "Ljava/lang/String;")
            .unwrap()
            .l()
            .unwrap();
        env.call_method(
            &intent,
            "putExtra",
            "(Ljava/lang/String;Landroid/os/Parcelable;)Landroid/content/Intent;",
            &[JValue::Object(&extra_stream), JValue::Object(&uri)],
        )
        .unwrap();

        let flag_grant_read = 0x00000001i32;
        env.call_method(
            &intent,
            "addFlags",
            "(I)Landroid/content/Intent;",
            &[JValue::Int(flag_grant_read)],
        )
        .unwrap();

        let chooser_title = env.new_string("Share File").unwrap();
        let chooser = env
            .call_static_method(
                &intent_class,
                "createChooser",
                "(Landroid/content/Intent;Ljava/lang/CharSequence;)Landroid/content/Intent;",
                &[JValue::Object(&intent), JValue::Object(&chooser_title)],
            )
            .unwrap()
            .l()
            .unwrap();

        env.call_method(
            &activity,
            "startActivity",
            "(Landroid/content/Intent;)V",
            &[JValue::Object(&chooser)],
        )
        .unwrap();
    })
    .map_err(|e| format!("Failed to share file: {:?}", e))
}

#[tauri::command]
pub async fn open_with_download(app: AppHandle, path: String) -> Result<(), String> {
    share_download(app, path).await
}

async fn save_downloads(app: &AppHandle, records: &[DownloadRecord]) {
    if let Ok(app_data) = app.path().app_data_dir() {
        let _ = tokio::fs::create_dir_all(&app_data).await;
        let downloads_file = app_data.join("downloads.json");
        if let Ok(json) = serde_json::to_string(records) {
            let _ = tokio::fs::write(downloads_file, json).await;
        }
    }
}

pub async fn load_downloads(app: &AppHandle) -> Vec<DownloadRecord> {
    if let Ok(app_data) = app.path().app_data_dir() {
        let downloads_file = app_data.join("downloads.json");
        if let Ok(content) = tokio::fs::read_to_string(downloads_file).await {
            if let Ok(records) = serde_json::from_str(&content) {
                return records;
            }
        }
    }
    Vec::new()
}
