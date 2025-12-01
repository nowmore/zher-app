# zhe-app

A lightweight Android application client for zher (这儿), a pure LAN file sharing and chat tool. Connect seamlessly to your zher server and enjoy instant file sharing and communication within your local network.

## ✨ Features

- **Connect to zher Server**: Easily connect to your zher server by entering the server address or scanning a QR code
- **Built-in Browser**: Access the full zher web interface directly within the app
- **QR Code Scanner**: Quickly connect to servers using QR code scanning functionality
- **Responsive Design**: Optimized for various Android screen sizes
- **Dark Mode Support**: Toggle between light and dark themes for comfortable usage
- **Modern UI**: Clean, intuitive interface built with modern design principles

## 🛠️ Technology Stack

- **Frontend**: Vue 3 + Tailwind CSS
- **Framework**: Tauri 2 (for building cross-platform desktop and mobile applications)
- **Key Dependencies**:
  - `@tauri-apps/api` - Core Tauri API for native functionality
  - `@tauri-apps/plugin-barcode-scanner` - QR code scanning capabilities
  - `@tauri-apps/plugin-opener` - External application integration

## 📋 Requirements

- Android device running Android 8.0 (Oreo) or higher
- A running zher server on your local network (see [zher](https://github.com/nowmore/zher) for server setup)
- Node.js and Rust development environment (for building from source)

## 🏗️ Building from Source

### Prerequisites

- Node.js 16.0 or higher
- Rust 1.60 or higher
- Android SDK and NDK set up correctly
- Java Development Kit (JDK) 17 or higher

### Build Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/zhe-app.git
   cd zhe-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the Android application:
   ```bash
   npm run build
   ```

   This will generate an APK file for ARM64 architecture.

4. For development and testing:
   ```bash
   npm run debug
   ```

## 🚀 Usage

1. **Start your zher server** on a computer within your local network.
2. **Launch the zhe-app** on your Android device.
3. **Connect to your server** by:
   - Entering the server address (e.g., `http://192.168.1.x:4836`) in the input field
   - Scanning the QR code displayed in the zher web interface
4. **Start sharing files** and communicating with others on your local network!

## 📱 App Interface

### Main Screen
- **Address Input**: Enter the zher server address manually
- **QR Code Scanner**: Scan a QR code to connect automatically
- **Connect Button**: Establish connection to the specified server

### Navigation Tabs
- **zher**: Main connection interface
- **Downloads**: View and manage downloads
- **Services**: Access additional services
- **Settings**: Configure app preferences

## 🔧 Configuration

The application is primarily configured through the Tauri configuration file (`tauri.conf.json`). Key settings include:

- **Window Configuration**: Controls the app's window behavior and appearance
- **Plugin Configuration**: Manages barcode scanner and other native plugins
- **Build Settings**: Define target platforms and build options

## 📁 Project Structure

```
zhe-app/
├── src/                  # Vue.js source code
│   ├── components/       # Vue components
│   │   ├── AddressInput.vue      # Server address input component
│   │   ├── BrowserView.vue       # Built-in browser component
│   │   ├── MainScreen.vue        # Main application screen
│   │   ├── ScannerView.vue       # QR code scanner component
│   │   └── ThemeToggle.vue       # Theme toggle component
│   ├── utils/            # Utility functions
│   ├── App.vue           # Main application component
│   └── main.js           # Application entry point
├── src-tauri/           # Tauri native code
│   ├── src/             # Rust source code
│   └── tauri.conf.json  # Tauri configuration
├── public/              # Static assets
└── package.json         # Node.js project configuration
```

## 🔒 Permissions

The application requires the following permissions:

- **Camera Access**: For QR code scanning functionality
- **Network Access**: To connect to zher servers on your local network

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

### Development Setup

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
5. Push to the branch (`git push origin feature/AmazingFeature`)
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Projects

- [zher](https://github.com/nowmore/zher) - The server-side application for LAN file sharing and chat

## 📞 Support

If you encounter any issues or have questions:

1. Check the [GitHub Issues](https://github.com/yourusername/zhe-app/issues) page
2. Create a new issue with a detailed description of your problem
3. Include steps to reproduce, expected behavior, and actual behavior

## 🎉 Acknowledgments

- Built with [Vue 3](https://vuejs.org/) and [Tailwind CSS](https://tailwindcss.com/)
- Powered by [Tauri](https://tauri.app/) for native Android support
- Inspired by the [zher](https://github.com/nowmore/zher) project

---

**Note**: This application is designed to work with the zher server application. Please ensure you have a zher server running on your local network before using this app.
