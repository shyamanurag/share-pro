# PWA Icons

This directory contains the icons used for the Progressive Web App (PWA) functionality.

## Icon Sizes

The following icon sizes are required for full PWA support:

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## Generating Icons

You can generate all the required icons by running:

```bash
npm run generate-icons
```

This requires the `canvas` package to be installed. The script will create simple green icons with "TP" (TradePaper) text.

## Manual Creation

If you prefer to create custom icons, you can replace these files with your own designs. Make sure to maintain the same filenames and dimensions for proper PWA functionality.