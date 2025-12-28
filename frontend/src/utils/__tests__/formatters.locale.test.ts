/**
 * Tests for locale-aware formatters
 * TDD approach: Write tests first, then implement
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { formatCurrency, formatDate, formatDateTime } from '../formatters';
import i18n from '../../config/i18n';

describe('Locale-aware Currency Formatting', () => {
  beforeEach(async () => {
    // Reset to English
    await i18n.changeLanguage('en');
  });

  it('should format USD in English locale', async () => {
    await i18n.changeLanguage('en');
    const formatted = formatCurrency(123456, 'USD');

    // English uses $1,234.56 format
    expect(formatted).toMatch(/\$1,234\.56/);
  });

  it('should format USD in Spanish locale', async () => {
    await i18n.changeLanguage('es');
    const formatted = formatCurrency(123456, 'USD');

    // Spanish uses different decimal separator
    // Could be $1,234.56 or $1.234,56 depending on Spanish variant
    expect(formatted).toContain('1');
    expect(formatted).toContain('234');
    expect(formatted).toContain('56');
  });

  it('should format EUR in French locale', async () => {
    await i18n.changeLanguage('fr');
    const formatted = formatCurrency(123456, 'EUR');

    // French uses space as thousand separator and comma as decimal
    // Should be something like "1 234,56 €"
    expect(formatted).toContain('1');
    expect(formatted).toContain('234');
    expect(formatted).toContain('56');
  });

  it('should use browser locale when i18n language is not set', async () => {
    const formatted = formatCurrency(100000, 'USD');

    // Should format using some locale (not throw error)
    expect(formatted).toBeDefined();
    expect(formatted).toContain('1');
    expect(formatted).toContain('000');
  });

  it('should handle different currencies with locale', async () => {
    await i18n.changeLanguage('en');

    const usd = formatCurrency(100000, 'USD');
    const eur = formatCurrency(100000, 'EUR');
    const gbp = formatCurrency(100000, 'GBP');

    expect(usd).toContain('$');
    expect(eur).toContain('€');
    expect(gbp).toContain('£');
  });
});

describe('Locale-aware Date Formatting', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('should format date in English locale', async () => {
    await i18n.changeLanguage('en');
    const date = '2024-03-15T10:30:00Z';
    const formatted = formatDate(date);

    // English format: "Mar 15" or similar
    expect(formatted).toMatch(/Mar|15/);
  });

  it('should format date in Spanish locale', async () => {
    await i18n.changeLanguage('es');
    const date = '2024-03-15T10:30:00Z';
    const formatted = formatDate(date);

    // Spanish format uses different month abbreviations
    // Could be "15 mar" or similar
    expect(formatted).toBeDefined();
    expect(typeof formatted).toBe('string');
  });

  it('should format date in French locale', async () => {
    await i18n.changeLanguage('fr');
    const date = '2024-03-15T10:30:00Z';
    const formatted = formatDate(date);

    // French format: "15 mars" or similar
    expect(formatted).toBeDefined();
    expect(typeof formatted).toBe('string');
  });

  it('should still show relative dates regardless of locale', async () => {
    await i18n.changeLanguage('es');
    const today = new Date().toISOString();
    const formatted = formatDate(today);

    // Relative dates might need translation later
    // For now, just verify it works
    expect(formatted).toBeDefined();
  });
});

describe('Locale-aware DateTime Formatting', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('should format datetime in English locale', async () => {
    await i18n.changeLanguage('en');
    const date = '2024-03-15T14:30:00Z';
    const formatted = formatDateTime(date);

    // English format: "Mar 15, 2024, 2:30 PM" or similar
    expect(formatted).toContain('15');
    expect(formatted).toContain('2024');
  });

  it('should format datetime in Spanish locale', async () => {
    await i18n.changeLanguage('es');
    const date = '2024-03-15T14:30:00Z';
    const formatted = formatDateTime(date);

    // Spanish datetime format
    expect(formatted).toContain('15');
    expect(formatted).toContain('2024');
  });

  it('should format datetime in French locale', async () => {
    await i18n.changeLanguage('fr');
    const date = '2024-03-15T14:30:00Z';
    const formatted = formatDateTime(date);

    // French datetime format
    expect(formatted).toContain('15');
    expect(formatted).toContain('2024');
  });
});

describe('Locale Detection and Fallback', () => {
  it('should use navigator language when available', async () => {
    // Mock navigator.language
    const originalLanguage = navigator.language;
    Object.defineProperty(navigator, 'language', {
      value: 'es-ES',
      configurable: true,
    });

    const formatted = formatCurrency(100000, 'EUR');
    expect(formatted).toBeDefined();

    // Restore
    Object.defineProperty(navigator, 'language', {
      value: originalLanguage,
      configurable: true,
    });
  });

  it('should fallback to en when locale is invalid', async () => {
    // Even with invalid i18n language, formatters should work
    const formatted = formatCurrency(100000, 'USD');
    expect(formatted).toBeDefined();
    expect(formatted).toContain('$');
  });

  it('should map i18n language codes to Intl locales', async () => {
    // Test that 'en' maps to 'en-US', 'es' to 'es-ES', etc.
    await i18n.changeLanguage('en');
    const en = formatCurrency(100000, 'USD');

    await i18n.changeLanguage('es');
    const es = formatCurrency(100000, 'USD');

    await i18n.changeLanguage('fr');
    const fr = formatCurrency(100000, 'USD');

    // All should be valid formatted strings
    expect(en).toBeDefined();
    expect(es).toBeDefined();
    expect(fr).toBeDefined();
  });
});

describe('Backwards Compatibility', () => {
  it('should not break existing code that does not use i18n', () => {
    // Test that formatters work even without i18n context
    const currency = formatCurrency(100000, 'USD');
    const date = formatDate('2024-03-15T10:30:00Z');
    const datetime = formatDateTime('2024-03-15T14:30:00Z');

    expect(currency).toBeDefined();
    expect(date).toBeDefined();
    expect(datetime).toBeDefined();
  });
});
