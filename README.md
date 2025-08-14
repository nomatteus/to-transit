# TOTransit - View TTC Streetcars and Buses Live

A real-time transit tracking app for Toronto's TTC system, now powered by free OpenStreetMap tiles instead of Google Maps.

Live at: [totransit.ca](http://totransit.ca)

## 🚀 Quick Start (Local Development)

### Option 1: Node.js Server (Recommended)
```bash
npm install
npm start
```
Then open: http://localhost:8000

### Option 2: Python Server
```bash
python3 server.py
```
Then open: http://localhost:8000

### Option 3: PHP Built-in Server
```bash
npm run serve
# or directly:
php -S localhost:8000
```
Then open: http://localhost:8000

## 📋 Requirements

- **PHP** (any recent version)
- **Node.js** (for npm option)
- **Python 3** (for Python option)

### Installing PHP

**macOS:**
```bash
brew install php
```

**Ubuntu/Debian:**
```bash
sudo apt install php-cli
```

**Windows:**
Download from [php.net/downloads](https://www.php.net/downloads)

## 💰 Cost Savings (March 2025)

- **Before:** C$150/month (Google Maps)
- **After:** $0/month (OpenStreetMap)
- **Annual savings:** ~C$1,800

## 🗺️ Map Technology

- **Tiles:** OpenStreetMap (completely free)
- **Library:** Leaflet.js (lightweight, fast)
- **No API keys:** Zero signup required
- **No usage limits:** Unlimited map loads

## 🛠️ Development

The app consists of:
- `index.php` - Main HTML structure
- `js/ttc.js` - Core JavaScript functionality
- `css/style.css` - Styling
- `json.php` - Vehicle data API endpoint

### File Structure
```
├── index.php          # Main page
├── js/
│   └── ttc.js         # Core app logic
├── css/
│   └── style.css      # Styling
├── json.php           # Data endpoint
├── routes.json        # Route definitions
├── server.js          # Node.js dev server
├── server.py          # Python dev server
└── package.json       # npm configuration
```

## 🔧 Available Commands

```bash
npm start              # Start Node.js server
npm run dev            # Start Python server  
npm run serve          # Start PHP built-in server
npm run help           # Show all commands
```

## 📊 Data Sources

**TTC Real-Time Next Vehicle Arrival (NVAS)**
- Open Data: [Toronto Open Data](http://www1.toronto.ca/wps/portal/open_data/open_data_item_details?vgnextoid=4427790e6f21d210VgnVCM1000003dd60f89RCRD&vgnextchannel=6e886aa8cc819210VgnVCM10000067d60f89RCRD)
- NextBus XML Feed: [Documentation](http://www.nextbus.com/xmlFeedDocs/NextBusXMLFeed.pdf)

## 📝 License

MIT License - feel free to fork and modify!
