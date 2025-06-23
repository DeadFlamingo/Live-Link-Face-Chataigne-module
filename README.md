# Live Link Face Chataigne Module

A comprehensive Chataigne module for controlling Live Link Face iOS app for real-time facial motion capture with remote recording capabilities.

## 🎭 Features

- **Remote Control** - Full OSC-based control of Live Link Face app
- **Remote Recording** - Start/stop recordings remotely with slate and take management
- **AR Session Management** - Start/stop AR tracking sessions
- **Live Link Streaming** - Stream facial data to multiple Unreal Engine targets (up to 10)
- **Device Monitoring** - Real-time battery level and thermal state monitoring
- **Video Display Control** - Toggle iPhone camera preview to save battery
- **Auto-configuration** - Automatic network setup and OS module integration

## 📱 Requirements

- **Chataigne** 1.9.16 or later
- **Live Link Face** iOS app (Epic Games)
- iPhone/iPad with A12 chip or newer
- Network connection between computer and iOS device

## 🚀 Installation

1. Download the module files:
   - `module.json`
   - `LiveLinkFace.js`

2. Place them in your Chataigne modules folder:
   ```
   Documents/Chataigne/modules/LiveLinkFace/
   ```

3. Reload custom modules in Chataigne: `File → Reload custom modules`

4. Add the "Live Link Face" module from `Motion Capture` category

## ⚙️ Setup

### Network Configuration
1. Connect your iOS device and computer to the same network
2. The module automatically detects your computer's IP address
3. In Live Link Face app, set the OSC target to your computer's IP and port 8000

### OSC Outputs Configuration
Configure the "Live Link Face iOS" output with your iPhone's IP address:
- **Remote Host**: Your iPhone's IP address
- **Remote Port**: 8000 (default)

## 🎮 Usage

### Basic Workflow
1. **Start AR Session** - Initialize camera and AR tracking
2. **Set Live Link Subject** - Define subject name for Unreal Engine
3. **Configure Targets** - Add Unreal Engine Live Link receivers
4. **Start Streaming** - Begin facial data transmission
5. **Record** (optional) - Capture performance with slate/take metadata

### Live Link Targets
Configure up to 10 simultaneous streaming targets:
- **Target IP**: Unreal Engine computer IP address
- **Port**: Live Link port (default 11111-11120)
- **Enabled**: Toggle target on/off

### Recording
- **Slate Name**: Scene/shot identifier
- **Take Number**: Auto-increments after each recording
- Real-time recording status with visual indicator

### Device Monitoring
- **Battery Level**: Current iOS device battery percentage
- **Thermal State**: Color-coded thermal monitoring (Green/Yellow/Red)
- **App Status**: Connection status indicator

## 🔧 Commands

### AR Session
- `Start AR Session` - Initialize AR tracking
- `Stop AR Session` - Stop AR tracking

### Live Link
- `Set Subject` - Apply subject name
- `Start Stream` - Begin data streaming
- `Stop Stream` - Stop data streaming

### Recording
- `Start Recording` - Begin capture with current slate/take
- `Stop Recording` - Stop and save recording
- `Set Slate` / `Set Take` - Update metadata

### Device Control
- `Video Display On/Off` - Toggle camera preview
- `Query Battery` / `Query Thermals` - Request device status

## 📊 Status Indicators

| Indicator | Description |
|-----------|-------------|
| **Recording** | Blinks when recording active |
| **Battery Level** | 0-100% charge level |
| **Thermal State** | Green (Cool) → Yellow (Warm) → Red (Hot) |
| **Video Display** | Camera preview on/off status |
| **AR Session Active** | AR tracking session status |
| **App Active** | Live Link Face connection status |

## 🔌 OSC Protocol

The module communicates with Live Link Face using these OSC commands:

| Command | Description |
|---------|-------------|
| `/ARSessionStart` | Start AR session |
| `/ARSessionStop` | Stop AR session |
| `/LiveLinkSubject <name>` | Set subject name |
| `/LiveLinkStreamStart` | Start streaming |
| `/LiveLinkStreamStop` | Stop streaming |
| `/AddLiveLinkAddress <ip> <port>` | Add Live Link target |
| `/ClearAllLiveLinkAddresses` | Clear all targets |
| `/RecordStart <slate> <take>` | Start recording |
| `/RecordStop` | Stop recording |
| `/VideoDisplayOn/Off` | Toggle video display |
| `/BatteryQuery` | Request battery level |
| `/ThermalsQuery` | Request thermal state |

## 🔍 Troubleshooting

### Connection Issues
- Ensure iOS device and computer are on same network
- Check firewall settings (allow port 8000)
- Verify Live Link Face app OSC settings match module configuration

### No AR Session
- iPhone must support Face ID or have A12 chip or newer
- Grant camera permissions to Live Link Face app
- Ensure adequate lighting conditions

### Recording Problems
- Check available storage on iOS device
- Verify slate/take names don't contain invalid characters
- Ensure AR session is active before recording

## 📝 Version History

- **v1.1.0** - Added AR Session support, multiple Live Link targets, improved status monitoring
- **v1.0.2** - Initial release with basic Live Link Face control

## 🙏 Credits

Developed for the Chataigne community. Based on Live Link Face OSC protocol documentation from Epic Games.

## 📄 License

MIT License - Feel free to modify and distribute.

---

For support and updates, please visit the [Issues](../../issues) page.
