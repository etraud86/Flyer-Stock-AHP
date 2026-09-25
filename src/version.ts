/**
 * Application Version Specification
 * Aldeias Históricas de Portugal - Software de Gestão de Stock e Logística
 */
export const DEFAULT_APP_VERSION = '1.0.1';
export const APP_VERSION = DEFAULT_APP_VERSION;

export function bumpVersion(version: string = DEFAULT_APP_VERSION): string {
  const parts = String(version || DEFAULT_APP_VERSION).replace(/^v/i, '').trim().split('.');
  const major = parseInt(parts[0] || '1', 10);
  const minor = parseInt(parts[1] || '0', 10);
  const patch = parseInt(parts[2] || '1', 10);
  return `${isNaN(major) ? 1 : major}.${isNaN(minor) ? 0 : minor}.${(isNaN(patch) ? 1 : patch) + 1}`;
}

export function formatVersionLabel(version: string = DEFAULT_APP_VERSION): string {
  const clean = String(version || DEFAULT_APP_VERSION).replace(/^v/i, '').trim() || DEFAULT_APP_VERSION;
  return `Secure Version ${clean} Aldeias Históricas de Portugal Software`;
}

export const APP_VERSION_LABEL = formatVersionLabel(DEFAULT_APP_VERSION);
export const APP_BUILD_DATE = '2026-09-24';
