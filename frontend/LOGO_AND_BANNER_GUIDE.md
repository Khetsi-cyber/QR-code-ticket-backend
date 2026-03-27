# Logo and Background Banner Guide

## Overview
The app now supports a logo in all page headers and a background banner on the login page. The implementation includes graceful fallback - if images are missing, they simply won't display (no broken image icons).

## Required Images

### 1. Logo (logo.png)
- **Location**: `/frontend/public/images/logo.png`
- **Recommended size**: 200-400px width, transparent background
- **Format**: PNG (for transparency support)
- **AspectRatio**: Any (will auto-scale to 35-40px height)
- **Displays on**:
  - Login page header
  - Passenger Dashboard header
  - Driver Dashboard top bar
  - Admin Dashboard header

### 2. Background Banner (banner.jpg)
- **Location**: `/frontend/public/images/banner.jpg`
- **Recommended size**: 1920x1080px or higher
- **Format**: JPG or PNG
- **Displays on**: Login page only (full background with overlay)

## How to Add Your Images

1. **Place your logo file**:
   ```bash
   # From project root
   cp /path/to/your/logo.png frontend/public/images/logo.png
   ```

2. **Place your banner file**:
   ```bash
   # From project root
   cp /path/to/your/banner.jpg frontend/public/images/banner.jpg
   ```

3. **Restart the dev server** (if running):
   ```bash
   # Kill current server: Ctrl+C
   # Then restart:
   cd frontend
   npm start
   ```

## Notes

- **No images yet?** The app works fine without them. Upload when ready.
- **Image not showing?** Check:
  - File name matches exactly: `logo.png` and `banner.jpg`
  - Files are in `/frontend/public/images/` directory
  - Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
- **Dark Mode**: The login banner overlay automatically adjusts opacity for light/dark modes
- **Logo sizing**: Logo automatically scales to fit (35-40px height depending on page)

## Customization

If you want to change image sizes or styling, edit these files:
- **Login.jsx**: Lines 188-215 (banner), Lines 218-229 (logo)
- **UserDashboard.jsx**: Lines 647-653 (logo)
- **DriverDashboard.jsx**: Lines 665-671 (logo)
- **AdminDashboard.jsx**: Lines 1245-1251 (logo)
