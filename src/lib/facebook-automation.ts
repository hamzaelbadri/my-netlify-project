import puppeteer, { Browser, Page } from 'puppeteer';
import winston from 'winston';
import dotenv from 'dotenv';
import { format } from 'date-fns';
import path from 'path';
import fs from 'fs/promises';

// Load environment variables
dotenv.config();

// Configuration
const CONFIG = {
  retryAttempts: 3,
  retryDelay: 5000,
  navigationTimeout: 30000,
  delays: {
    navigation: 2000,
    action: 1000,
    typing: 100
  },
  selectors: {
    login: {
      email: '#email',
      password: '#pass',
      submit: '[type="submit"]',
      twoFactorCode: '#approvals_code',
      twoFactorSubmit: '#checkpointSubmitButton'
    },
    page: {
      create: '[data-testid="page-creation-business-option"]',
      name: '[aria-label="Page name"]',
      category: '[aria-label="Category"]',
      createButton: '[data-testid="page-creation-create-button"]',
      success: '[data-testid="page-creation-success"]'
    },
    post: {
      composer: '[data-testid="page_composer_button"]',
      textArea: '[data-testid="status-attachment-mentions-input"]',
      imageUpload: 'input[type="file"]',
      scheduleButton: '[data-testid="schedule-post-button"]',
      dateInput: '[data-testid="scheduled-date-input"]',
      timeInput: '[data-testid="scheduled-time-input"]',
      publishButton: '[data-testid="post-button"]'
    }
  }
};

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/facebook-automation-error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/facebook-automation.log' 
    }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

interface PostOptions {
  content: string;
  imageUrl?: string;
  scheduledTime?: Date;
  firstComment?: string;
}

interface PageStats {
  pageId: string;
  pageName: string;
  totalPosts: number;
  scheduledPosts: number;
  recentEngagement: {
    likes: number;
    comments: number;
    shares: number;
  };
}

export class FacebookAutomation {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private isLoggedIn = false;
  private pageStats: Map<string, PageStats> = new Map();

  async initialize(headless = true): Promise<void> {
    try {
      logger.info('Initializing Facebook automation');
      
      this.validateEnvironment();

      this.browser = await puppeteer.launch({
        headless,
        defaultViewport: null,
        args: [
          '--start-maximized',
          '--disable-notifications',
          '--no-sandbox'
        ]
      });

      this.page = await this.browser.newPage();
      await this.configurePageSettings();
      
      logger.info('Browser initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize automation', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  private validateEnvironment(): void {
    const requiredVars = ['FACEBOOK_EMAIL', 'FACEBOOK_PASSWORD'];
    const missing = requiredVars.filter(v => !process.env[v]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  private async configurePageSettings(): Promise<void> {
    if (!this.page) throw new Error('Browser page not initialized');

    await this.page.setDefaultNavigationTimeout(CONFIG.navigationTimeout);
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Enable request interception for performance
    await this.page.setRequestInterception(true);
    this.page.on('request', request => {
      if (['image', 'stylesheet', 'font'].includes(request.resourceType())) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // Handle dialogs automatically
    this.page.on('dialog', async dialog => {
      logger.info(`Dialog message: ${dialog.message()}`);
      await dialog.accept();
    });
  }

  async login(): Promise<void> {
    try {
      if (!this.page) throw new Error('Browser page not initialized');
      
      logger.info('Attempting to log in to Facebook');
      await this.page.goto('https://www.facebook.com');
      
      if (await this.checkIfLoggedIn()) {
        logger.info('Already logged in to Facebook');
        this.isLoggedIn = true;
        return;
      }

      // Clear existing session
      await this.page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      // Enter credentials
      await this.typeWithDelay(CONFIG.selectors.login.email, process.env.FACEBOOK_EMAIL || '');
      await this.typeWithDelay(CONFIG.selectors.login.password, process.env.FACEBOOK_PASSWORD || '');
      await this.page.click(CONFIG.selectors.login.submit);

      // Handle 2FA if needed
      if (await this.check2FAPrompt()) {
        await this.handle2FA();
      }

      // Verify login
      this.isLoggedIn = await this.retry(this.checkIfLoggedIn.bind(this));
      if (!this.isLoggedIn) {
        throw new Error('Login verification failed');
      }

      logger.info('Successfully logged in to Facebook');
    } catch (error) {
      logger.error('Login failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  async createPost(pageId: string, options: PostOptions): Promise<void> {
    try {
      if (!this.isLoggedIn) throw new Error('Not logged in');
      if (!this.page) throw new Error('Browser page not initialized');

      logger.info('Creating new post', { pageId, options });

      await this.navigateToPage(pageId);
      await this.page.click(CONFIG.selectors.post.composer);
      await this.page.waitForSelector(CONFIG.selectors.post.textArea);

      // Enter post content
      await this.typeWithDelay(CONFIG.selectors.post.textArea, options.content);

      // Upload image if provided
      if (options.imageUrl) {
        await this.uploadImage(options.imageUrl);
      }

      // Schedule post if time provided
      if (options.scheduledTime) {
        await this.schedulePost(options.scheduledTime);
      }

      // Publish post
      await this.page.click(CONFIG.selectors.post.publishButton);
      await this.page.waitForNavigation();

      // Add first comment if provided
      if (options.firstComment) {
        await this.addFirstComment(pageId, options.firstComment);
      }

      logger.info('Post created successfully', { pageId });
    } catch (error) {
      logger.error('Failed to create post', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        pageId 
      });
      throw error;
    }
  }

  private async uploadImage(imageUrl: string): Promise<void> {
    if (!this.page) throw new Error('Browser page not initialized');

    try {
      const fileInput = await this.page.$(CONFIG.selectors.post.imageUpload);
      if (!fileInput) throw new Error('Image upload input not found');

      // Download image to temp directory
      const response = await fetch(imageUrl);
      const buffer = await response.arrayBuffer();
      const tempPath = path.join(process.cwd(), 'temp', `image-${Date.now()}.jpg`);
      await fs.writeFile(tempPath, Buffer.from(buffer));

      // Upload image
      await fileInput.uploadFile(tempPath);

      // Clean up temp file
      await fs.unlink(tempPath);
    } catch (error) {
      logger.error('Failed to upload image', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  private async schedulePost(scheduledTime: Date): Promise<void> {
    if (!this.page) throw new Error('Browser page not initialized');

    try {
      await this.page.click(CONFIG.selectors.post.scheduleButton);
      
      const dateStr = format(scheduledTime, 'yyyy-MM-dd');
      const timeStr = format(scheduledTime, 'HH:mm');

      await this.page.type(CONFIG.selectors.post.dateInput, dateStr);
      await this.page.type(CONFIG.selectors.post.timeInput, timeStr);
    } catch (error) {
      logger.error('Failed to schedule post', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  private async addFirstComment(pageId: string, comment: string): Promise<void> {
    // Implementation for adding first comment
    // This would need to be implemented based on Facebook's specific UI for adding comments
  }

  async getPageStats(pageId: string): Promise<PageStats> {
    if (!this.pageStats.has(pageId)) {
      // Fetch and cache page stats
      const stats = await this.fetchPageStats(pageId);
      this.pageStats.set(pageId, stats);
    }
    return this.pageStats.get(pageId)!;
  }

  private async fetchPageStats(pageId: string): Promise<PageStats> {
    // Implementation for fetching page statistics
    // This would need to be implemented based on Facebook's Insights API or UI
    return {
      pageId,
      pageName: '',
      totalPosts: 0,
      scheduledPosts: 0,
      recentEngagement: {
        likes: 0,
        comments: 0,
        shares: 0
      }
    };
  }

  private async retry<T>(fn: () => Promise<T>, attempts = CONFIG.retryAttempts): Promise<T> {
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === attempts - 1) throw error;
        logger.warn(`Attempt ${i + 1} failed, retrying...`, { error: error instanceof Error ? error.message : 'Unknown error' });
        await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
      }
    }
    throw new Error('Retry failed');
  }

  private async typeWithDelay(selector: string, text: string): Promise<void> {
    if (!this.page) throw new Error('Browser page not initialized');
    await this.page.type(selector, text, { delay: CONFIG.delays.typing });
  }

  private async checkIfLoggedIn(): Promise<boolean> {
    if (!this.page) throw new Error('Browser page not initialized');
    
    try {
      const feedPresent = await this.page.$('[aria-label="News Feed"]');
      const profilePresent = await this.page.$('[aria-label="Your profile"]');
      return !!(feedPresent || profilePresent);
    } catch (error) {
      logger.error('Failed to check login status', { error: error instanceof Error ? error.message : 'Unknown error' });
      return false;
    }
  }

  private async check2FAPrompt(): Promise<boolean> {
    if (!this.page) throw new Error('Browser page not initialized');
    
    try {
      const twoFactorInput = await this.page.$(CONFIG.selectors.login.twoFactorCode);
      return !!twoFactorInput;
    } catch (error) {
      logger.error('Failed to check 2FA prompt', { error: error instanceof Error ? error.message : 'Unknown error' });
      return false;
    }
  }

  private async handle2FA(): Promise<void> {
    if (!this.page) throw new Error('Browser page not initialized');
    
    try {
      logger.info('Waiting for 2FA verification');
      await this.page.waitForNavigation({ 
        timeout: 60000,
        waitUntil: 'networkidle0'
      });
    } catch (error) {
      logger.error('2FA handling failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    try {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.page = null;
        this.isLoggedIn = false;
        logger.info('Browser closed successfully');
      }
    } catch (error) {
      logger.error('Failed to cleanup browser', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }
}