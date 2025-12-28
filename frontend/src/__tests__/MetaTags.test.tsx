/**
 * Tests for HTML meta tags and SEO configuration
 *
 * These tests verify that index.html has proper SEO and social media meta tags.
 * Since meta tags are in the static HTML file, we verify the file content directly.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// Read the index.html file
const indexHtmlPath = path.join(__dirname, '../../index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8');

describe('Meta Tags and SEO', () => {
  it('should have proper document title', () => {
    expect(indexHtml).toContain('<title>Shared Finance App');
    expect(indexHtml).toContain('Track Shared Expenses');
  });

  it('should have charset UTF-8', () => {
    expect(indexHtml).toContain('charset="UTF-8"');
  });

  it('should have viewport meta tag', () => {
    expect(indexHtml).toContain('name="viewport"');
    expect(indexHtml).toContain('width=device-width, initial-scale=1.0');
  });

  it('should have description meta tag', () => {
    expect(indexHtml).toContain('name="description"');
    expect(indexHtml).toContain('shared finances');
    expect(indexHtml).toContain('expense tracking');
  });

  it('should have keywords meta tag', () => {
    expect(indexHtml).toContain('name="keywords"');
    expect(indexHtml).toContain('shared expenses');
    expect(indexHtml).toContain('expense tracker');
  });

  it('should have robots meta tag', () => {
    expect(indexHtml).toContain('name="robots"');
    expect(indexHtml).toContain('index, follow');
  });

  it('should have author meta tag', () => {
    expect(indexHtml).toContain('name="author"');
  });

  it('should have language meta tag', () => {
    expect(indexHtml).toContain('name="language"');
  });

  it('should have theme-color meta tag', () => {
    expect(indexHtml).toContain('name="theme-color"');
    expect(indexHtml).toContain('#3b82f6');
  });

  it('should have msapplication-TileColor', () => {
    expect(indexHtml).toContain('msapplication-TileColor');
    expect(indexHtml).toContain('#3b82f6');
  });

  it('should have html lang attribute', () => {
    expect(indexHtml).toContain('<html lang="en">');
  });
});

describe('Open Graph Meta Tags', () => {
  it('should have og:type', () => {
    expect(indexHtml).toContain('property="og:type"');
    expect(indexHtml).toContain('website');
  });

  it('should have og:url', () => {
    expect(indexHtml).toContain('property="og:url"');
    expect(indexHtml).toContain('yourdomain.com');
  });

  it('should have og:title', () => {
    expect(indexHtml).toContain('property="og:title"');
    expect(indexHtml).toContain('Shared Finance App');
  });

  it('should have og:description', () => {
    expect(indexHtml).toContain('property="og:description"');
    expect(indexHtml).toContain('expense tracking');
  });

  it('should have og:image', () => {
    expect(indexHtml).toContain('property="og:image"');
    expect(indexHtml).toContain('og-image.png');
  });

  it('should have og:image dimensions', () => {
    expect(indexHtml).toContain('property="og:image:width"');
    expect(indexHtml).toContain('property="og:image:height"');
    expect(indexHtml).toContain('1200');
    expect(indexHtml).toContain('630');
  });

  it('should have og:site_name', () => {
    expect(indexHtml).toContain('property="og:site_name"');
  });

  it('should have og:locale', () => {
    expect(indexHtml).toContain('property="og:locale"');
    expect(indexHtml).toContain('en_US');
  });
});

describe('Twitter Card Meta Tags', () => {
  it('should have twitter:card', () => {
    expect(indexHtml).toContain('property="twitter:card"');
    expect(indexHtml).toContain('summary_large_image');
  });

  it('should have twitter:url', () => {
    expect(indexHtml).toContain('property="twitter:url"');
  });

  it('should have twitter:title', () => {
    expect(indexHtml).toContain('property="twitter:title"');
    expect(indexHtml).toContain('Shared Finance App');
  });

  it('should have twitter:description', () => {
    expect(indexHtml).toContain('property="twitter:description"');
  });

  it('should have twitter:image', () => {
    expect(indexHtml).toContain('property="twitter:image"');
    expect(indexHtml).toContain('twitter-image.png');
  });
});

describe('Mobile App Meta Tags', () => {
  it('should have apple-mobile-web-app-capable', () => {
    expect(indexHtml).toContain('name="apple-mobile-web-app-capable"');
    expect(indexHtml).toContain('yes');
  });

  it('should have apple-mobile-web-app-status-bar-style', () => {
    expect(indexHtml).toContain('name="apple-mobile-web-app-status-bar-style"');
  });

  it('should have apple-mobile-web-app-title', () => {
    expect(indexHtml).toContain('name="apple-mobile-web-app-title"');
    expect(indexHtml).toContain('Shared Finance');
  });

  it('should have mobile-web-app-capable', () => {
    expect(indexHtml).toContain('name="mobile-web-app-capable"');
    expect(indexHtml).toContain('yes');
  });
});

describe('Security Meta Tags', () => {
  it('should have X-Content-Type-Options', () => {
    expect(indexHtml).toContain('http-equiv="X-Content-Type-Options"');
    expect(indexHtml).toContain('nosniff');
  });

  it('should have X-Frame-Options', () => {
    expect(indexHtml).toContain('http-equiv="X-Frame-Options"');
    expect(indexHtml).toContain('DENY');
  });

  it('should have X-XSS-Protection', () => {
    expect(indexHtml).toContain('http-equiv="X-XSS-Protection"');
    expect(indexHtml).toContain('1; mode=block');
  });
});

describe('Favicon Links', () => {
  it('should have SVG favicon', () => {
    expect(indexHtml).toContain('rel="icon"');
    expect(indexHtml).toContain('type="image/svg+xml"');
    expect(indexHtml).toContain('favicon.svg');
  });

  it('should have PNG favicon sizes', () => {
    expect(indexHtml).toContain('favicon-32x32.png');
    expect(indexHtml).toContain('favicon-16x16.png');
  });

  it('should have apple-touch-icon', () => {
    expect(indexHtml).toContain('rel="apple-touch-icon"');
    expect(indexHtml).toContain('apple-touch-icon.png');
  });

  it('should have manifest', () => {
    expect(indexHtml).toContain('rel="manifest"');
    expect(indexHtml).toContain('site.webmanifest');
  });
});

describe('SEO Best Practices', () => {
  it('should have title length within optimal range', () => {
    const titleMatch = indexHtml.match(/<title>(.*?)<\/title>/);
    const titleLength = titleMatch ? titleMatch[1].length : 0;

    // SEO best practice: 50-60 characters
    expect(titleLength).toBeGreaterThan(30);
    expect(titleLength).toBeLessThan(70);
  });

  it('should have description length within optimal range', () => {
    const descMatch = indexHtml.match(/name="description" content="(.*?)"/);
    const descLength = descMatch ? descMatch[1].length : 0;

    // SEO best practice: 150-160 characters
    expect(descLength).toBeGreaterThan(120);
    expect(descLength).toBeLessThan(200);
  });

  it('should have multiple keywords', () => {
    const keywordsMatch = indexHtml.match(/name="keywords" content="(.*?)"/);
    const keywords = keywordsMatch ? keywordsMatch[1].split(',') : [];

    // Should have at least 5 keywords
    expect(keywords.length).toBeGreaterThan(5);
  });

  it('should contain key business terms in keywords', () => {
    expect(indexHtml.toLowerCase()).toContain('expense');
    expect(indexHtml.toLowerCase()).toContain('finance');
    expect(indexHtml.toLowerCase()).toContain('shared');
  });

  it('should have Plausible analytics script', () => {
    expect(indexHtml).toContain('plausible.io/js/script.js');
  });

  it('should have analytics defer attribute', () => {
    expect(indexHtml).toContain('defer');
    expect(indexHtml).toContain('data-domain');
  });
});

describe('PWA Configuration', () => {
  it('should reference site.webmanifest', () => {
    expect(indexHtml).toContain('site.webmanifest');
  });

  it('should have theme color for PWA', () => {
    expect(indexHtml).toContain('theme-color');
  });

  it('should have mobile app capable tags', () => {
    expect(indexHtml).toContain('mobile-web-app-capable');
    expect(indexHtml).toContain('apple-mobile-web-app-capable');
  });
});
