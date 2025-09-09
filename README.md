# TOTransit - View TTC Streetcars and Buses Live On A Map

Live at: [totransit.ca](http://totransit.ca)

## 🗺️ Map Technology

- **Tiles:** OpenStreetMap via PMTiles (served locally)
- **Library:** MapLibre GL JS
- **Basemap Style:** OSM Bright

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

3. **Generate the PMTiles file** (required for map tiles):
   ```
   TODO: Add instructions for generating toronto-osm.pmtiles
   ```

4. **Access the app** at [https://localhost](https://localhost)

### Local Dev Features

- ✅ **HTTPS enabled** (required for geolocation)
- ✅ **Trusted SSL certificates** (no browser warnings)
- ✅ **Live file editing** (changes reflect immediately)
- ✅ **PHP error logging** configured for development

### Troubleshooting

- **SSL issues:** Re-run `./setup-dev.sh` to regenerate certificates
- **Port conflicts:** Modify ports in `docker-compose.yml` if 80/443 are in use

## 🛠️ Development

The app consists of:
- `index.php` - Main HTML structure with MapLibre GL setup
- `js/ttc.js` - Core JavaScript functionality with MapLibre GL markers
- `css/style.css` - Styling including MapLibre GL popup styles
- `json.php` - Vehicle data API endpoint
- `map-styles/osm-bright.json` - MapLibre GL style configuration
- `toronto-osm.pmtiles` - Local PMTiles vector data for Toronto area

### File Structure
```
├── index.php          # Main page
├── js/
│   └── ttc.js         # Core app logic with MapLibre GL
├── css/
│   └── style.css      # Styling
├── json.php           # Data endpoint
├── routes.json        # Route definitions
├── scripts/
│   └── update-routes.rb # Script to update routes.json
├── map-styles/
│   └── osm-bright.json # MapLibre GL style
├── toronto-osm.pmtiles # Local vector tiles (generate manually)
├── marker-images/     # Vehicle marker icons (@2x)
├── Dockerfile         # Docker configuration
├── docker-compose.yml # Docker services
└── docker/
    └── ssl.conf       # Apache SSL configuration
```

## 📊 Data Sources

**TTC Real-Time Next Vehicle Arrival (NVAS)**
- Open Data: [TTC Real-Time NVAS Dataset](https://open.toronto.ca/dataset/ttc-real-time-next-vehicle-arrival-nvas/) (retired)
- NextBus XML Feed: [Documentation](http://retro.umoiq.com/xmlFeedDocs/NextBusXMLFeed.pdf)

### Updating Routes

To update the `routes.json` file with the latest TTC route data:

```bash
ruby scripts/update-routes.rb
```

The script will:
- Fetch the latest route list from the TTC XML feed
- Compare with existing routes and warn about any missing routes
- Give you options to keep existing routes or remove missing ones
- Update route information while preserving manual corrections

**Options when routes are missing:**
- `k` - Keep existing routes and update others (recommended for temporary outages)
- `r` - Remove missing routes and update
- `c` - Cancel update

## 📝 License

MIT License - feel free to fork and modify!
