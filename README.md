# TOTransit - View TTC Streetcars and Buses Live

A real-time transit tracking app for Toronto's TTC system, now powered by free Stadia Maps tiles instead of Google Maps.

Live at: [totransit.ca](http://totransit.ca)

## 💰 Cost Savings (March 2025)

- **Before:** C$150/month (Google Maps)
- **After:** $0/month (Stadia Maps)
- **Annual savings:** ~C$1,800

## 🗺️ Map Technology

- **Tiles:** Stadia Maps (completely free)
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
└── routes.json        # Route definitions
```

## 📊 Data Sources

**TTC Real-Time Next Vehicle Arrival (NVAS)**
- Open Data: [Toronto Open Data](http://www1.toronto.ca/wps/portal/open_data/open_data_item_details?vgnextoid=4427790e6f21d210VgnVCM1000003dd60f89RCRD&vgnextchannel=6e886aa8cc819210VgnVCM10000067d60f89RCRD)
- NextBus XML Feed: [Documentation](http://www.nextbus.com/xmlFeedDocs/NextBusXMLFeed.pdf)

## 📝 License

MIT License - feel free to fork and modify!
