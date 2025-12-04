use serde::{Deserialize, Serialize};
use std::net::{IpAddr, Ipv4Addr, SocketAddr, UdpSocket};
use std::time::Duration;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceInfo {
    pub ip: String,
    pub port: u16,
    pub url: String,
}

#[derive(Debug, Clone)]
struct NetworkInterface {
    #[allow(dead_code)]
    name: String,
    ip: Ipv4Addr,
    broadcast: Ipv4Addr,
    #[allow(dead_code)]
    is_hotspot: bool,
}

fn is_hotspot_interface(name: &str) -> bool {
    let name_lower = name.to_lowercase();
    name_lower.contains("ap")
        || name_lower == "wlan1"
        || name_lower.contains("softap")
        || name_lower.contains("swlan")
        || name_lower == "ap0"
}

fn is_wlan_interface(name: &str) -> bool {
    let name_lower = name.to_lowercase();
    name_lower.starts_with("wlan")
        || name_lower.starts_with("wi-fi")
        || name_lower.starts_with("wifi")
        || name_lower.contains("wireless")
}

fn calculate_broadcast_address(ip: Ipv4Addr) -> Ipv4Addr {
    let octets = ip.octets();
    Ipv4Addr::new(octets[0], octets[1], octets[2], 255)
}

fn get_network_interfaces() -> Vec<NetworkInterface> {
    let mut interfaces = Vec::new();

    if let Ok(ifaces) = local_ip_address::list_afinet_netifas() {
        for (name, ip) in ifaces {
            if let IpAddr::V4(ipv4) = ip {
                if ipv4.is_loopback() {
                    continue;
                }

                let is_hotspot = is_hotspot_interface(&name);
                let is_wlan = is_wlan_interface(&name);

                if is_wlan || is_hotspot {
                    let broadcast = calculate_broadcast_address(ipv4);

                    interfaces.push(NetworkInterface {
                        name: name.clone(),
                        ip: ipv4,
                        broadcast,
                        is_hotspot,
                    });
                }
            }
        }
    }

    interfaces
}

fn get_broadcast_addresses() -> Vec<Ipv4Addr> {
    let interfaces = get_network_interfaces();

    if interfaces.is_empty() {
        return vec![];
    }

    let mut broadcasts: Vec<Ipv4Addr> = interfaces.iter().map(|iface| iface.broadcast).collect();

    broadcasts.sort();
    broadcasts.dedup();

    broadcasts
}

#[tauri::command]
pub async fn discover_services() -> Result<Vec<ServiceInfo>, String> {
    let mut services = Vec::new();

    let socket = UdpSocket::bind("0.0.0.0:0").map_err(|e| format!("Bind failed: {}", e))?;
    socket
        .set_broadcast(true)
        .map_err(|e| format!("Set broadcast failed: {}", e))?;
    socket
        .set_read_timeout(Some(Duration::from_millis(100)))
        .map_err(|e| format!("Set timeout failed: {}", e))?;

    let broadcast_msg = b"ZHER_DISCOVERY";
    let broadcast_addresses = get_broadcast_addresses();

    for broadcast_ip in &broadcast_addresses {
        let broadcast_addr = SocketAddr::new(IpAddr::V4(*broadcast_ip), 4837);
        let _ = socket.send_to(broadcast_msg, broadcast_addr);
    }

    let mut buf = [0u8; 1024];
    let start = std::time::Instant::now();
    let discovery_timeout = Duration::from_secs(3);

    while start.elapsed() < discovery_timeout {
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
            Err(ref e)
                if e.kind() == std::io::ErrorKind::WouldBlock
                    || e.kind() == std::io::ErrorKind::TimedOut =>
            {
                std::thread::sleep(Duration::from_millis(50));
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

#[tauri::command]
pub fn get_local_ip() -> Result<String, String> {
    if let Ok(ip) = local_ip_address::local_ip() {
        return Ok(ip.to_string());
    }
    Err("Failed to get local IP".to_string())
}
