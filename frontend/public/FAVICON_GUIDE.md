# Favicon Guide

This directory should contain the following favicon files for complete branding coverage:

## Required Favicon Files

### Standard Favicons
- **favicon.ico** - 48x48px - Legacy browser support
- **favicon-16x16.png** - 16x16px - Browser tab icon (small)
- **favicon-32x32.png** - 32x32px - Browser tab icon (standard)

### Apple Touch Icons
- **apple-touch-icon.png** - 180x180px - iOS home screen icon
- **apple-touch-icon-precomposed.png** - 180x180px - iOS older devices

### Android Chrome Icons
- **android-chrome-192x192.png** - 192x192px - Android home screen
- **android-chrome-512x512.png** - 512x512px - Android splash screen

### Windows Tiles
- **mstile-150x150.png** - 150x150px - Windows Start menu tile

### Social Media / Open Graph
- **og-image.png** - 1200x630px - Facebook/LinkedIn sharing
- **twitter-image.png** - 1200x675px - Twitter card image

### Screenshots (PWA)
- **screenshot-wide.png** - 1280x720px - Desktop PWA install dialog
- **screenshot-narrow.png** - 750x1334px - Mobile PWA install dialog

## Generating Favicons

You can use these tools to generate favicons from your logo:

1. **RealFaviconGenerator**: https://realfavicongenerator.net/
   - Upload your logo (at least 512x512px)
   - Customize for each platform
   - Download complete favicon package

2. **Favicon.io**: https://favicon.io/
   - Simple text-to-favicon or image converter
   - Generates all required sizes

3. **ImageMagick** (Command line):
   ```bash
   # Generate from SVG or PNG
   convert logo.png -resize 32x32 favicon-32x32.png
   convert logo.png -resize 16x16 favicon-16x16.png
   convert logo.png -resize 180x180 apple-touch-icon.png
   convert logo.png -resize 192x192 android-chrome-192x192.png
   convert logo.png -resize 512x512 android-chrome-512x512.png
   ```

## Design Guidelines

- **Keep it simple**: Favicons are displayed at very small sizes
- **High contrast**: Ensure it's visible on both light and dark backgrounds
- **Recognizable**: Should be identifiable at 16x16px
- **Transparent background**: For PNG files (except og-image)
- **Square aspect ratio**: Most platforms expect 1:1 ratio

## Color Scheme

Current theme color: **#3b82f6** (Blue)

Match your favicon colors to your brand:
- Primary: #3b82f6 (Blue)
- Background: #ffffff (White)
- Dark mode: #1e293b (Dark slate)

## Testing

After adding favicons, test on:
- Chrome/Edge (desktop & mobile)
- Firefox (desktop & mobile)
- Safari (desktop & iOS)
- Open Graph validators (Facebook Sharing Debugger, Twitter Card Validator)

## Current Status

✅ **site.webmanifest** - PWA manifest configured
✅ **browserconfig.xml** - Windows tiles configured
✅ **robots.txt** - SEO crawler configuration
⏳ **Favicon files** - Need to be generated from logo design

## Next Steps

1. Design a custom logo (at least 512x512px, SVG preferred)
2. Generate all favicon sizes using RealFaviconGenerator
3. Replace placeholder images with actual brand assets
4. Update `yourdomain.com` references with actual domain
5. Test on all major browsers and platforms
