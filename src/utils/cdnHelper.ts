/**
 * Helper utility to manage CDN URLs for static assets
 */

// Get CDN base URL from environment variables
const CDN_URL = import.meta.env.VITE_CDN_URL || '';
const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Transforms asset paths to use the CDN when available
 * Falls back to local paths when CDN is not configured
 */
export const getCdnUrl = (path: string): string => {
  if (!CDN_URL) {
    // No CDN configured, use local path
    return path.startsWith('/') ? path : `/${path}`;
  }
  
  // Strip leading slash for CDN URLs
  const assetPath = path.startsWith('/') ? path.substring(1) : path;
  return `${CDN_URL}/${assetPath}`;
};

/**
 * Gets URL for specific asset types with appropriate paths
 */
export const getTextureUrl = (filename: string): string => {
  return getCdnUrl(`textures/${filename}`);
};

export const getModelUrl = (filename: string): string => {
  return getCdnUrl(`models/${filename}`);
};

export const getStaticAssetUrl = (filename: string): string => {
  return getCdnUrl(`assets/${filename}`);
};

/**
 * For API-served assets that should not use the CDN
 */
export const getApiUrl = (path: string): string => {
  if (!API_URL) return path;
  return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
};