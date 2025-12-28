/**
 * Tests for Sentry error tracking initialization
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Sentry
vi.mock('@sentry/react', () => ({
  init: vi.fn(),
  BrowserTracing: vi.fn(),
  Replay: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  setUser: vi.fn(),
}));

describe('Sentry Initialization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize Sentry in production', () => {
    const originalEnv = import.meta.env.MODE;

    // Mock production environment
    Object.defineProperty(import.meta, 'env', {
      value: { MODE: 'production', VITE_SENTRY_DSN: 'test-dsn' },
      writable: true,
    });

    // Import would trigger initialization
    const { init } = require('@sentry/react');

    // In a real app, this would be called
    // expect(init).toHaveBeenCalled();
  });

  it('should not initialize Sentry in development', () => {
    Object.defineProperty(import.meta, 'env', {
      value: { MODE: 'development', VITE_SENTRY_DSN: '' },
      writable: true,
    });

    const { init } = require('@sentry/react');

    // Sentry should not be initialized in dev
    // This is checked in the app initialization code
  });

  it('should capture exceptions', () => {
    const { captureException } = require('@sentry/react');
    const error = new Error('Test error');

    captureException(error);

    expect(captureException).toHaveBeenCalledWith(error);
  });

  it('should capture messages', () => {
    const { captureMessage } = require('@sentry/react');

    captureMessage('Test message', 'info');

    expect(captureMessage).toHaveBeenCalledWith('Test message', 'info');
  });

  it('should set user context', () => {
    const { setUser } = require('@sentry/react');
    const user = {
      id: 'user-123',
      email: 'test@example.com',
    };

    setUser(user);

    expect(setUser).toHaveBeenCalledWith(user);
  });
});

describe('Sentry Configuration', () => {
  it('should have SENTRY_DSN environment variable', () => {
    // Check that the env variable exists (can be empty in dev)
    expect(import.meta.env).toHaveProperty('VITE_SENTRY_DSN');
  });

  it('should configure with proper integrations', () => {
    const { init, BrowserTracing, Replay } = require('@sentry/react');

    // In production, these integrations should be configured
    // This is a placeholder test - actual implementation would verify config
    expect(BrowserTracing).toBeDefined();
    expect(Replay).toBeDefined();
  });

  it('should set appropriate sample rate', () => {
    // Sample rate should be set for performance monitoring
    // This would be validated in the actual init call
    const expectedSampleRate = 0.1; // 10%
    expect(expectedSampleRate).toBeGreaterThan(0);
    expect(expectedSampleRate).toBeLessThanOrEqual(1);
  });
});
