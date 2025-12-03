use serde::{Deserialize, Serialize};
use std::net::{SocketAddr, UdpSocket};
use std::time::Duration;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceInfo {
    pub ip: String,
    pub port: u16,
    pub url: String,
}

#[tauri::command]
pub async fn discover_services() -> Result<Vec<ServiceInfo>, String> {
    let mut services = Vec::new();

    let socket = UdpSocket::bind("0.0.0.0:0").map_err(|e| e.to_string())?;
    socket.set_broadcast(true).map_err(|e| e.to_string())?;
    socket
        .set_read_timeout(Some(Duration::from_secs(2)))
        .map_err(|e| e.to_string())?;

    let broadcast_msg = b"ZHER_DISCOVERY";
    let broadcast_addr: SocketAddr = "255.255.255.255:4837".parse().unwrap();

    socket
        .send_to(broadcast_msg, broadcast_addr)
        .map_err(|e| e.to_string())?;

    let mut buf = [0u8; 1024];
    let start = std::time::Instant::now();

    while start.elapsed() < Duration::from_secs(2) {
        match socket.recv_from(&mut buf) {
            Ok((size, addr)) => {
                if let Ok(response) = std::str::from_utf8(&buf[..size]) {
                    if response.starts_with("ZHER_SERVICE:") {
                        let ip = addr.ip().to_string();
                        services.push(ServiceInfo {
                            ip: ip.clone(),
                            port: 4836,
                            url: format!("http://{}:4836", ip),
                        });
                    }
                }
            }
            Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                std::thread::sleep(Duration::from_millis(100));
            }
            Err(_) => break,
        }
    }

    services.sort_by(|a, b| a.ip.cmp(&b.ip));
    services.dedup_by(|a, b| a.ip == b.ip);

    Ok(services)
}

#[tauri::command]
pub fn validate_service_url(url: String) -> Result<bool, String> {
    if let Ok(parsed) = url::Url::parse(&url) {
        if let Some(port) = parsed.port() {
            if port == 4836 {
                return Ok(true);
            }
        }
    }
    Ok(false)
}
