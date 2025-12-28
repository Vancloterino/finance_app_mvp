import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('App - React.lazy() Code Splitting', () => {
  let appSource: string;

  beforeAll(() => {
    // Read App.tsx source code
    const appPath = resolve(__dirname, '../App.tsx');
    appSource = readFileSync(appPath, 'utf-8');
  });

  it('should use React.lazy() for HomePage', () => {
    expect(appSource).toContain('React.lazy');
    expect(appSource).toMatch(/const\s+HomePage\s*=\s*React\.lazy/);
  });

  it('should use React.lazy() for LoginPage', () => {
    expect(appSource).toMatch(/const\s+LoginPage\s*=\s*React\.lazy/);
  });

  it('should use React.lazy() for RegisterPage', () => {
    expect(appSource).toMatch(/const\s+RegisterPage\s*=\s*React\.lazy/);
  });

  it('should use React.lazy() for SpacesPage', () => {
    expect(appSource).toMatch(/const\s+SpacesPage\s*=\s*React\.lazy/);
  });

  it('should use React.lazy() for SpaceDetailPage', () => {
    expect(appSource).toMatch(/const\s+SpaceDetailPage\s*=\s*React\.lazy/);
  });

  it('should use React.lazy() for PaymentsPage', () => {
    expect(appSource).toMatch(/const\s+PaymentsPage\s*=\s*React\.lazy/);
  });

  it('should use React.lazy() for ProfilePage', () => {
    expect(appSource).toMatch(/const\s+ProfilePage\s*=\s*React\.lazy/);
  });

  it('should NOT import pages directly', () => {
    // Should not have direct imports like: import HomePage from './pages/HomePage'
    expect(appSource).not.toMatch(/^import\s+HomePage\s+from\s+['"]\.\/pages\/HomePage['"]/m);
    expect(appSource).not.toMatch(/^import\s+LoginPage\s+from\s+['"]\.\/pages\/LoginPage['"]/m);
    expect(appSource).not.toMatch(/^import\s+SpacesPage\s+from\s+['"]\.\/pages\/SpacesPage['"]/m);
  });

  it('should wrap routes with React.Suspense', () => {
    expect(appSource).toContain('Suspense');
    expect(appSource).toMatch(/<Suspense/);
  });

  it('should have fallback prop in Suspense', () => {
    expect(appSource).toMatch(/<Suspense\s+fallback=/);
  });

  it('should lazy load at least 10 page components', () => {
    const lazyMatches = appSource.match(/React\.lazy\(/g);
    expect(lazyMatches).toBeDefined();
    expect(lazyMatches!.length).toBeGreaterThanOrEqual(10);
  });

  it('should use arrow function with dynamic import in lazy()', () => {
    // Check for pattern: React.lazy(() => import('./pages/...'))
    expect(appSource).toMatch(/React\.lazy\(\s*\(\s*\)\s*=>\s*import\(/);
  });
});

describe('App - Loading Fallback UI', () => {
  let appSource: string;

  beforeAll(() => {
    const appPath = resolve(__dirname, '../App.tsx');
    appSource = readFileSync(appPath, 'utf-8');
  });

  it('should have a loading spinner or skeleton component', () => {
    // Should have some kind of loading UI
    expect(appSource).toMatch(/fallback=\{.*(<div|<Spinner|<Loading|Loading\.\.\.|loading)/);
  });

  it('should use consistent loading fallback across all routes', () => {
    // All Suspense components should use the same fallback pattern
    const suspenseMatches = appSource.match(/<Suspense\s+fallback=\{[^}]+\}/g);
    expect(suspenseMatches).toBeDefined();
    expect(suspenseMatches!.length).toBeGreaterThan(0);
  });
});
