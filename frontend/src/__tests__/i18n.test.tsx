/**
 * Tests for react-i18next internationalization framework
 * TDD approach: Write tests first, then implement
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTranslation, I18nextProvider } from 'react-i18next';
import i18n from '../config/i18n';

describe('i18n Configuration', () => {
  beforeEach(async () => {
    // Reset to English before each test
    await i18n.changeLanguage('en');
  });

  it('should initialize i18n with configured language', async () => {
    expect(i18n).toBeDefined();
    // After beforeEach, language should be 'en'
    await waitFor(() => {
      expect(i18n.language).toBe('en');
    });
  });

  it('should have English, Spanish, and French languages configured', () => {
    const languages = Object.keys(i18n.options.resources || {});
    expect(languages).toContain('en');
    expect(languages).toContain('es');
    expect(languages).toContain('fr');
  });

  it('should detect browser language preference', () => {
    expect(i18n.options.detection).toBeDefined();
    expect(i18n.options.detection?.order).toContain('navigator');
  });

  it('should fall back to English if language not found', () => {
    const fallback = i18n.options.fallbackLng;
    // fallbackLng can be a string or array
    if (Array.isArray(fallback)) {
      expect(fallback).toContain('en');
    } else {
      expect(fallback).toBe('en');
    }
  });

  it('should have interpolation enabled', () => {
    expect(i18n.options.interpolation).toBeDefined();
    expect(i18n.options.interpolation?.escapeValue).toBe(false);
  });
});

describe('useTranslation Hook', () => {
  it('should provide translation function', () => {
    const { result } = renderHook(() => useTranslation(), {
      wrapper: ({ children }) => <I18nextProvider i18n={i18n}>{children}</I18nextProvider>,
    });

    expect(result.current.t).toBeDefined();
    expect(typeof result.current.t).toBe('function');
  });

  it('should provide current language', () => {
    const { result } = renderHook(() => useTranslation(), {
      wrapper: ({ children }) => <I18nextProvider i18n={i18n}>{children}</I18nextProvider>,
    });

    expect(result.current.i18n.language).toBeDefined();
  });

  it('should allow changing language', async () => {
    const { result } = renderHook(() => useTranslation(), {
      wrapper: ({ children }) => <I18nextProvider i18n={i18n}>{children}</I18nextProvider>,
    });

    await act(async () => {
      await result.current.i18n.changeLanguage('es');
    });

    await waitFor(() => {
      expect(result.current.i18n.language).toBe('es');
    });
  });
});

describe('Translation Keys - Common', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('should translate common.loading', async () => {
    const { result } = renderHook(() => useTranslation(), {
      wrapper: ({ children }) => <I18nextProvider i18n={i18n}>{children}</I18nextProvider>,
    });

    const translation = result.current.t('common.loading');
    expect(translation).toBe('Loading...');
  });

  it('should translate common.save', () => {
    const { result } = renderHook(() => useTranslation(), {
      wrapper: ({ children }) => <I18nextProvider i18n={i18n}>{children}</I18nextProvider>,
    });

    const translation = result.current.t('common.save');
    expect(translation).toBe('Save');
  });

  it('should translate common.cancel', () => {
    const { result } = renderHook(() => useTranslation(), {
      wrapper: ({ children }) => <I18nextProvider i18n={i18n}>{children}</I18nextProvider>,
    });

    const translation = result.current.t('common.cancel');
    expect(translation).toBe('Cancel');
  });

  it('should translate common.delete', () => {
    const { result } = renderHook(() => useTranslation(), {
      wrapper: ({ children }) => <I18nextProvider i18n={i18n}>{children}</I18nextProvider>,
    });

    const translation = result.current.t('common.delete');
    expect(translation).toBe('Delete');
  });
});

describe('Translation Keys - Auth', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('should translate auth.login', async () => {
    const { result } = renderHook(() => useTranslation(), {
      wrapper: ({ children }) => <I18nextProvider i18n={i18n}>{children}</I18nextProvider>,
    });

    const translation = result.current.t('auth.login');
    expect(translation).toBe('Log In');
  });

  it('should translate auth.register', () => {
    const { result } = renderHook(() => useTranslation(), {
      wrapper: ({ children }) => <I18nextProvider i18n={i18n}>{children}</I18nextProvider>,
    });

    const translation = result.current.t('auth.register');
    expect(translation).toBe('Sign Up');
  });

  it('should translate auth.logout', () => {
    const { result } = renderHook(() => useTranslation(), {
      wrapper: ({ children }) => <I18nextProvider i18n={i18n}>{children}</I18nextProvider>,
    });

    const translation = result.current.t('auth.logout');
    expect(translation).toBe('Log Out');
  });

  it('should translate auth.email', () => {
    const { result } = renderHook(() => useTranslation(), {
      wrapper: ({ children }) => <I18nextProvider i18n={i18n}>{children}</I18nextProvider>,
    });

    const translation = result.current.t('auth.email');
    expect(translation).toBe('Email');
  });

  it('should translate auth.password', () => {
    const { result } = renderHook(() => useTranslation(), {
      wrapper: ({ children }) => <I18nextProvider i18n={i18n}>{children}</I18nextProvider>,
    });

    const translation = result.current.t('auth.password');
    expect(translation).toBe('Password');
  });
});

describe('Translation Keys - Spanish', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('es');
  });

  it('should translate common.loading to Spanish', async () => {
    const { result } = renderHook(() => useTranslation(), {
      wrapper: ({ children }) => <I18nextProvider i18n={i18n}>{children}</I18nextProvider>,
    });

    await waitFor(() => {
      expect(result.current.i18n.language).toBe('es');
    });

    const translation = result.current.t('common.loading');
    expect(translation).toBe('Cargando...');
  });

  it('should translate auth.login to Spanish', async () => {
    const { result } = renderHook(() => useTranslation(), {
      wrapper: ({ children }) => <I18nextProvider i18n={i18n}>{children}</I18nextProvider>,
    });

    await waitFor(() => {
      expect(result.current.i18n.language).toBe('es');
    });

    const translation = result.current.t('auth.login');
    expect(translation).toBe('Iniciar Sesión');
  });
});

describe('Translation Keys - French', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('fr');
  });

  it('should translate common.loading to French', async () => {
    const { result } = renderHook(() => useTranslation(), {
      wrapper: ({ children }) => <I18nextProvider i18n={i18n}>{children}</I18nextProvider>,
    });

    await waitFor(() => {
      expect(result.current.i18n.language).toBe('fr');
    });

    const translation = result.current.t('common.loading');
    expect(translation).toBe('Chargement...');
  });

  it('should translate auth.login to French', async () => {
    const { result } = renderHook(() => useTranslation(), {
      wrapper: ({ children }) => <I18nextProvider i18n={i18n}>{children}</I18nextProvider>,
    });

    await waitFor(() => {
      expect(result.current.i18n.language).toBe('fr');
    });

    const translation = result.current.t('auth.login');
    expect(translation).toBe('Se Connecter');
  });
});

describe('Language Persistence', () => {
  it('should persist language preference to localStorage', async () => {
    const { result } = renderHook(() => useTranslation(), {
      wrapper: ({ children }) => <I18nextProvider i18n={i18n}>{children}</I18nextProvider>,
    });

    await act(async () => {
      await result.current.i18n.changeLanguage('es');
    });

    await waitFor(() => {
      const stored = localStorage.getItem('i18nextLng');
      expect(stored).toBe('es');
    });
  });
});

describe('Interpolation', () => {
  it('should support variable interpolation', () => {
    const { result } = renderHook(() => useTranslation(), {
      wrapper: ({ children }) => <I18nextProvider i18n={i18n}>{children}</I18nextProvider>,
    });

    // Test will pass once we add interpolation keys
    const translation = result.current.t('common.welcome', { name: 'John' });
    expect(translation).toContain('John');
  });
});
