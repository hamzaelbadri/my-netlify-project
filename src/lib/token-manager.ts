// Token management for Facebook authentication
class TokenManager {
  private static instance: TokenManager;
  private tokens: Map<string, { token: string; expiresAt: number }> = new Map();

  private constructor() {
    this.loadTokens();
  }

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  private loadTokens(): void {
    try {
      const savedTokens = localStorage.getItem('fb_tokens');
      if (savedTokens) {
        const parsed = JSON.parse(savedTokens);
        Object.entries(parsed).forEach(([key, value]) => {
          this.tokens.set(key, value as { token: string; expiresAt: number });
        });
      }
    } catch (error) {
      console.error('Failed to load saved tokens:', error);
      localStorage.removeItem('fb_tokens');
    }
  }

  private saveTokens(): void {
    try {
      const tokens = Object.fromEntries(this.tokens.entries());
      localStorage.setItem('fb_tokens', JSON.stringify(tokens));
    } catch (error) {
      console.error('Failed to save tokens:', error);
    }
  }

  setToken(pageId: string, token: string, expiresIn: number): void {
    this.tokens.set(pageId, {
      token,
      expiresAt: Date.now() + (expiresIn * 1000)
    });
    this.saveTokens();
  }

  getToken(pageId: string): string | null {
    const tokenInfo = this.tokens.get(pageId);
    if (!tokenInfo) return null;

    // Return null if token is expired
    if (Date.now() >= tokenInfo.expiresAt) {
      this.tokens.delete(pageId);
      this.saveTokens();
      return null;
    }

    return tokenInfo.token;
  }

  clearTokens(): void {
    this.tokens.clear();
    localStorage.removeItem('fb_tokens');
  }
}

export const tokenManager = TokenManager.getInstance();