/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FACEBOOK_APP_ID: string
  readonly VITE_FACEBOOK_APP_SECRET: string
  readonly VITE_FACEBOOK_ACCESS_TOKEN: string
  readonly VITE_FACEBOOK_API_VERSION: string
  readonly VITE_FACEBOOK_CONFIG_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  FB: {
    init(options: {
      appId: string;
      cookie?: boolean;
      xfbml?: boolean;
      version: string;
    }): void;
    login(
      callback: (response: {
        status: 'connected' | 'not_authorized' | 'unknown';
        authResponse?: {
          accessToken: string;
          expiresIn: number;
          signedRequest: string;
          userID: string;
        };
      }) => void,
      options?: { scope: string }
    ): void;
    logout(callback: () => void): void;
    api(
      path: string,
      method: string,
      params: any,
      callback: (response: any) => void
    ): void;
  };
}

// Facebook SDK types
declare namespace fb {
  interface AuthResponse {
    accessToken: string;
    expiresIn: number;
    signedRequest: string;
    userID: string;
  }

  interface StatusResponse {
    status: 'connected' | 'not_authorized' | 'unknown';
    authResponse: AuthResponse;
  }
}