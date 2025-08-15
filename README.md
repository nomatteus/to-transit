# TOTransit - View TTC Streetcars and Buses Live

A real-time transit tracking app for Toronto's TTC system, now powered by free Stadia Maps tiles instead of Google Maps.

Live at: [totransit.ca](http://totransit.ca)

## 🗺️ Map Technology

- **Tiles:** Stadia Maps
- **Library:** Leaflet.js

## 🚀 Local Development

### Prerequisites

1. **Install Docker** (recommended: [OrbStack](https://orbstack.dev/) for macOS)
2. **Install mkcert** for trusted SSL certificates:
   ```bash
   # macOS
   brew install mkcert
   
   # Linux/Windows - see https://github.com/FiloSottile/mkcert#installation
   ```

### Setup

1. **Run the setup script** to generate SSL certificates:
   ```bash
   ./setup-dev.sh
   ```

2. **Start the development server**:
   ```bash
   docker-compose up --build
   ```

3. **Access the app** at [https://localhost](https://localhost)

### Features

- ✅ **HTTPS enabled** (required for geolocation)
- ✅ **Trusted SSL certificates** (no browser warnings)
- ✅ **Live file editing** (changes reflect immediately)
- ✅ **PHP error logging** configured for development

### Troubleshooting

- **Permission errors:** Ensure Docker can access the project directory
- **SSL issues:** Re-run `./setup-dev.sh` to regenerate certificates
- **Port conflicts:** Modify ports in `docker-compose.yml` if 80/443 are in use

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
├── Dockerfile         # Docker configuration
├── docker-compose.yml # Docker services
└── docker/
    └── ssl.conf       # Apache SSL configuration
```

## 📊 Data Sources

**TTC Real-Time Next Vehicle Arrival (NVAS)**
- Open Data: [Toronto Open Data](http://www1.toronto.ca/wps/portal/open_data/open_data_item_details?vgnextoid=4427790e6f21d210VgnVCM1000003dd60f89RCRD&vgnextchannel=6e886aa8cc819210VgnVCM10000067d60f89RCRD)
- NextBus XML Feed: [Documentation](http://www.nextbus.com/xmlFeedDocs/NextBusXMLFeed.pdf)

## 📝 License

MIT License - feel free to fork and modify!
