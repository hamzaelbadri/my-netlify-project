// Facebook configuration and API utilities
export const FACEBOOK_CONFIG = {
  appId: '962547765965983',
  version: 'v18.0',
  baseUrl: 'https://graph.facebook.com',
  redirectUri: `${window.location.origin}/auth/callback.html`,
  permissions: [
    'pages_manage_posts',
    'pages_read_engagement',
    'pages_show_list',
    'pages_manage_metadata',
    'pages_messaging',
    'public_profile',
    'email'
  ]
} as const;

export type FacebookConfig = typeof FACEBOOK_CONFIG;

export function createGraphApiUrl(path: string, params: Record<string, any> = {}): string {
  try {
    // Validate path
    if (!path) {
      throw new Error('Path is required');
    }

    // Clean path and ensure it doesn't start with a slash
    const cleanPath = path.replace(/^\/+/, '');
    
    // Construct URL parts safely
    const urlParts = [
      FACEBOOK_CONFIG.baseUrl,
      FACEBOOK_CONFIG.version,
      cleanPath
    ].filter(Boolean);

    // Join parts with forward slashes
    const baseUrl = urlParts.join('/');

    // Create URL object for validation and parameter handling
    const url = new URL(baseUrl);

    // Add parameters safely
    Object.entries(params).forEach(([key, value]) => {
      if (value != null && value !== '') {
        let paramValue: string;
        
        if (Array.isArray(value)) {
          paramValue = value.join(',');
        } else if (typeof value === 'object') {
          paramValue = JSON.stringify(value);
        } else {
          paramValue = String(value);
        }

        url.searchParams.append(key, paramValue);
      }
    });

    return url.toString();
  } catch (error) {
    console.error('Failed to create Graph API URL:', error);
    throw new Error('Failed to create valid Facebook API URL');
  }
}

export function validateUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function handleFacebookError(error: any): string {
  if (!error) {
    return 'An unknown error occurred';
  }

  // Handle Facebook API specific errors
  if (error.error?.message) {
    return error.error.message;
  }

  // Handle standard errors
  if (error.message) {
    return error.message;
  }

  // Handle unexpected error formats
  if (typeof error === 'string') {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return 'An unknown error occurred';
  }
}