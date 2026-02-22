# 🛒 Sant Masala - Grocery Store Billing Software

A complete **PWA-based billing software** for grocery stores with **thermal printer support**, built with Flask and modern web technologies. Supports **bilingual interface (English & Gujarati)** and works on **all devices** (laptop, phone, tablet).

![Sant Masala](https://img.shields.io/badge/Version-1.0.0-green) ![Python](https://img.shields.io/badge/Python-3.8+-blue) ![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

### 🧾 Billing / POS
- Fast product selection with category filters
- Multiple price variants per product (different weights)
- Real-time cart with quantity management
- Discount and tax calculation
- Multiple payment methods (Cash, UPI, Card)
- Customer information storage

### 🖨️ Thermal Printer Support
- **USB Printing** - Direct USB connection to 58mm/80mm thermal printers
- **Bluetooth Printing** - Wireless printing from mobile devices
- **Browser Print** - Fallback printing using browser
- ESC/POS compatible command generation
- Bilingual receipts (English + Gujarati)

### 📦 Product Management
- Add, edit, delete products
- Multiple price variants (50g, 100g, 250g, 500g, 1kg)
- Category management
- Stock tracking
- Featured products

### 📊 Admin Dashboard
- Sales overview with statistics
- Order management with status tracking
- Customer database
- Settings configuration

### 🌐 PWA (Progressive Web App)
- Install on any device like a native app
- Works offline
- Fast loading with service worker caching
- Push notification ready

### 🔤 Bilingual Support
- English and Gujarati language
- Easy language switching
- Bilingual product names and bills

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. **Clone/Download the project**
```bash
cd sant-masala-billing
```

2. **Create virtual environment** (recommended)
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Run the application**
```bash
python app.py
```

5. **Open in browser**
```
http://localhost:5000
```

## 📱 Access from Mobile/Tablet

1. Find your computer's IP address (e.g., `192.168.1.100`)
2. On mobile, open: `http://192.168.1.100:5000`
3. Click "Add to Home Screen" to install as app

## 🖨️ Printer Setup

### USB Thermal Printer (58mm)
1. Connect printer via USB
2. Go to Settings → Printer Settings
3. Select "USB Thermal Printer"
4. Click "Test Print"
5. Browser will ask to select your printer

### Bluetooth Thermal Printer
1. Pair printer with your device (phone/tablet)
2. Go to Settings → Printer Settings
3. Select "Bluetooth Thermal Printer"
4. Click "Test Print"
5. Select your printer from the list

### Browser Compatibility
- **USB Printing**: Chrome, Edge (Desktop only)
- **Bluetooth Printing**: Chrome, Edge (Android & Desktop)
- **Browser Print**: All browsers

## 📁 Project Structure

```
sant-masala-billing/
├── app.py                 # Flask application
├── requirements.txt       # Python dependencies
├── templates/
│   ├── base.html         # Base template
│   ├── index.html        # Landing page
│   ├── pos.html          # Billing interface
│   └── admin/
│       ├── index.html    # Dashboard
│       ├── products.html # Product management
│       ├── categories.html
│       ├── orders.html
│       ├── customers.html
│       └── settings.html
├── static/
│   ├── css/
│   │   └── style.css     # Main styles
│   ├── js/
│   │   ├── app.js        # Core functions
│   │   ├── api.js        # API client
│   │   ├── i18n.js       # Translations
│   │   └── printer.js    # Thermal printing
│   ├── manifest.json     # PWA manifest
│   └── sw.js             # Service worker
└── sant_masala.db        # SQLite database (auto-created)
```

## 🔧 Configuration

### Shop Details
Go to Admin → Settings to configure:
- Shop Name (English & Gujarati)
- Address
- Phone Number
- GST Number (optional)

### Printer Settings
- Printer Type (USB/Bluetooth/Browser)
- Paper Width (58mm/80mm)

## 📋 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dashboard/stats` | GET | Dashboard statistics |
| `/api/categories` | GET, POST | List/Create categories |
| `/api/categories/<id>` | GET, PUT, DELETE | Category CRUD |
| `/api/products` | GET, POST | List/Create products |
| `/api/products/<id>` | GET, PUT, DELETE | Product CRUD |
| `/api/orders` | GET, POST | List/Create orders |
| `/api/orders/<id>` | GET, PUT, DELETE | Order CRUD |
| `/api/customers` | GET, POST | List/Create customers |
| `/api/settings` | GET, POST | Get/Save settings |
| `/api/print/receipt/<id>` | GET | Get receipt data |

## 🎨 Customization

### Adding New Languages
Edit `static/js/i18n.js` and add translations:
```javascript
const translations = {
    en: { ... },
    gu: { ... },
    hi: { ... }  // Add Hindi
};
```

### Changing Theme Colors
Edit CSS variables in `static/css/style.css`:
```css
:root {
    --primary: #e63946;      /* Main color */
    --secondary: #1a1a2e;    /* Dark color */
    --accent: #ffd700;       /* Gold accent */
}
```

## 🔒 Security Notes

- This is designed for **local/intranet use**
- For production, add:
  - User authentication
  - HTTPS
  - Database backup
  - Input validation

## 📝 License

MIT License - Feel free to use for personal or commercial projects.

## 🙏 Support

If you find this useful, consider:
- ⭐ Starring the project
- 🐛 Reporting bugs
- 💡 Suggesting features

---

**Made with ❤️ for Indian Grocery Stores**

*Sant Masala - Real Taste For Real People! | સંત મસાલા - અસલી સ્વાદ અસલી લોકો માટે!*
