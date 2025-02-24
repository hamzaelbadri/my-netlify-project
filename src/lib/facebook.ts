import { create } from 'zustand';
import { FACEBOOK_CONFIG, createGraphApiUrl, handleFacebookError, validateUrl } from './facebook-config';
import { tokenManager } from './token-manager';
import { FacebookPage, Post } from '../types';

interface FacebookAuthState {
  accessToken: string | null;
  userInfo: {
    id: string;
    name: string;
    email: string;
    picture?: {
      data: {
        url: string;
      };
    };
  } | null;
  pages: FacebookPage[];
}

class FacebookAuth {
  private static instance: FacebookAuth;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): FacebookAuth {
    if (!FacebookAuth.instance) {
      FacebookAuth.instance = new FacebookAuth();
    }
    return FacebookAuth.instance;
  }

  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = new Promise<void>((resolve, reject) => {
      try {
        if (this.initialized) {
          resolve();
          return;
        }

        // Wait for FB SDK to be ready
        if (window.FB) {
          window.FB.init({
            appId: FACEBOOK_CONFIG.appId,
            cookie: false,
            xfbml: true,
            version: FACEBOOK_CONFIG.version
          });
          this.initialized = true;
          resolve();
        } else {
          // If FB SDK is not loaded yet, wait for fbAsyncInit
          window.fbAsyncInit = () => {
            window.FB.init({
              appId: FACEBOOK_CONFIG.appId,
              cookie: false,
              xfbml: true,
              version: FACEBOOK_CONFIG.version
            });
            this.initialized = true;
            resolve();
          };
        }
      } catch (error) {
        reject(new Error(`Failed to initialize Facebook SDK: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });

    return this.initializationPromise;
  }

  async login(): Promise<{ accessToken: string; userInfo: FacebookAuthState['userInfo']; pages: FacebookPage[] }> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const loginResult = await new Promise<{ authResponse: { accessToken: string } }>((resolve, reject) => {
        window.FB.login((response) => {
          if (response.status === 'connected' && response.authResponse) {
            resolve({ authResponse: response.authResponse });
          } else {
            reject(new Error('Facebook login failed or was cancelled'));
          }
        }, { scope: FACEBOOK_CONFIG.permissions.join(',') });
      });

      const accessToken = loginResult.authResponse.accessToken;
      
      // Get user info and pages in parallel
      const [userInfo, pages] = await Promise.all([
        this.getUserInfo(accessToken),
        this.getPages(accessToken)
      ]);

      return { accessToken, userInfo, pages };
    } catch (error) {
      throw new Error(`Login failed: ${handleFacebookError(error)}`);
    }
  }

  async getUserInfo(accessToken: string): Promise<FacebookAuthState['userInfo']> {
    if (!accessToken) {
      throw new Error('Access token is required to fetch user info');
    }

    try {
      const url = createGraphApiUrl('me', {
        fields: 'id,name,email,picture',
        access_token: accessToken
      });

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch user info: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.id || !data.name) {
        throw new Error('Invalid user data received from Facebook');
      }

      return data;
    } catch (error) {
      throw new Error(`Failed to fetch user info: ${handleFacebookError(error)}`);
    }
  }

  async getPages(accessToken: string): Promise<FacebookPage[]> {
    if (!accessToken) {
      throw new Error('Access token is required to fetch pages');
    }

    try {
      const url = createGraphApiUrl('me/accounts', {
        fields: 'id,name,access_token,picture',
        access_token: accessToken
      });

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch pages: ${response.statusText}`);
      }

      const data = await response.json();
      const pages = data.data || [];

      // Store page tokens
      pages.forEach((page: FacebookPage) => {
        if (page.id && page.accessToken) {
          tokenManager.setToken(page.id, page.accessToken, 60 * 24 * 60 * 60); // 60 days
        }
      });

      return pages;
    } catch (error) {
      throw new Error(`Failed to fetch pages: ${handleFacebookError(error)}`);
    }
  }

  async logout(): Promise<void> {
    if (!this.initialized) return;

    return new Promise((resolve) => {
      window.FB.logout(() => {
        this.initialized = false;
        this.initializationPromise = null;
        tokenManager.clearTokens();
        resolve();
      });
    });
  }

  async verifyPageAccess(pageId: string): Promise<boolean> {
    try {
      const token = tokenManager.getToken(pageId);
      if (!token) {
        return false;
      }

      const url = createGraphApiUrl(pageId, {
        fields: 'id',
        access_token: token
      });

      const response = await fetch(url);
      const data = await response.json();
      return !!data.id;
    } catch (error) {
      console.error('Failed to verify page access:', error);
      return false;
    }
  }
}

export const facebookAuth = FacebookAuth.getInstance();

export const useFacebookStore = create<FacebookAuthState>((set) => ({
  accessToken: null,
  userInfo: null,
  pages: [],
  setAuth: (accessToken: string, userInfo: FacebookAuthState['userInfo'], pages: FacebookPage[]) => 
    set({ accessToken, userInfo, pages }),
  clearAuth: () => set({ accessToken: null, userInfo: null, pages: [] })
}));