import puppeteer from 'puppeteer';
import winston from 'winston';
import dotenv from 'dotenv';
import { format } from 'date-fns';
import path from 'path';

dotenv.config();

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
    })
  ]
});

// Add console logging in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Rate limiting utility
const rateLimit = {
  delays: {
    navigation: 2000,
    action: 1000,
    typing: 100
  },
  async wait(type) {
    await new Promise(resolve => setTimeout(resolve, this.delays[type]));
  }
};

class FacebookAutomation {
  constructor() {
    this.browser = null;
    this.page = null;
    this.isLoggedIn = false;
    this.removedPosts = [];
    this.retryAttempts = 3;
    this.retryDelay = 5000;
  }

  async initialize() {
    try {
      logger.info('Initializing Facebook automation');
      this.browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: [
          '--start-maximized',
          '--disable-notifications',
          '--no-sandbox'
        ]
      });
      this.page = await this.browser.newPage();
      
      // Set default navigation timeout
      this.page.setDefaultNavigationTimeout(30000);
      
      // Set user agent
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Enable request interception
      await this.page.setRequestInterception(true);
      this.page.on('request', request => {
        if (['image', 'stylesheet', 'font'].includes(request.resourceType())) {
          request.abort();
        } else {
          request.continue();
        }
      });

      // Handle dialogs
      this.page.on('dialog', async dialog => {
        logger.info(`Dialog message: ${dialog.message()}`);
        await dialog.accept();
      });

      logger.info('Browser initialized successfully');
      return true;

    } catch (error) {
      logger.error('Failed to initialize automation', { error: error.message });
      throw error;
    }
  }

  async retry(fn, context, ...args) {
    for (let i = 0; i < this.retryAttempts; i++) {
      try {
        return await fn.apply(context, args);
      } catch (error) {
        if (i === this.retryAttempts - 1) throw error;
        logger.warn(`Attempt ${i + 1} failed, retrying...`, { error: error.message });
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
  }

  async login() {
    try {
      logger.info('Attempting to log in to Facebook');
      await this.page.goto('https://www.facebook.com');
      await rateLimit.wait('navigation');
      
      // Check if already logged in
      const isAlreadyLoggedIn = await this.checkIfLoggedIn();
      if (isAlreadyLoggedIn) {
        logger.info('Already logged in to Facebook');
        this.isLoggedIn = true;
        return true;
      }

      // Clear any existing cookies
      await this.page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      // Enter credentials with human-like delays
      await this.typeWithDelay('#email', process.env.FACEBOOK_EMAIL);
      await this.typeWithDelay('#pass', process.env.FACEBOOK_PASSWORD);
      await rateLimit.wait('action');
      await this.page.click('[type="submit"]');

      // Wait for navigation
      await this.page.waitForNavigation({ waitUntil: 'networkidle0' });
      await rateLimit.wait('navigation');

      // Check for 2FA
      const has2FA = await this.check2FAPrompt();
      if (has2FA) {
        await this.handle2FA();
      }

      // Verify login success
      this.isLoggedIn = await this.retry(this.checkIfLoggedIn, this);
      if (!this.isLoggedIn) {
        throw new Error('Login verification failed');
      }

      logger.info('Successfully logged in to Facebook');
      return true;

    } catch (error) {
      logger.error('Login failed', { error: error.message });
      throw error;
    }
  }

  async typeWithDelay(selector, text) {
    await this.page.type(selector, text, { delay: 100 });
    await rateLimit.wait('typing');
  }

  async createFacebookPage() {
    try {
      logger.info('Starting Facebook page creation process');
      
      // Navigate to page creation
      await this.page.goto('https://www.facebook.com/pages/create/');
      await rateLimit.wait('navigation');

      // Select business/brand page type
      await this.page.click('[data-testid="page-creation-business-option"]');
      await rateLimit.wait('action');

      // Fill page details
      const pageName = process.env.PAGE_NAME || 'My Business Page';
      const category = process.env.PAGE_CATEGORY || 'Business';

      await this.typeWithDelay('[aria-label="Page name"]', pageName);
      await this.typeWithDelay('[aria-label="Category"]', category);
      await this.page.keyboard.press('Enter');
      await rateLimit.wait('action');

      // Click create page button
      await this.page.click('[data-testid="page-creation-create-button"]');
      await rateLimit.wait('navigation');

      // Verify page creation
      const pageCreated = await this.verifyPageCreation();
      if (!pageCreated) {
        throw new Error('Failed to verify page creation');
      }

      logger.info('Facebook page created successfully');
      return true;

    } catch (error) {
      logger.error('Failed to create Facebook page', { error: error.message });
      throw error;
    }
  }

  async verifyPageCreation() {
    try {
      // Wait for success elements
      await this.page.waitForSelector('[data-testid="page-creation-success"]');
      
      // Get page ID from URL
      const url = this.page.url();
      const pageId = url.match(/\/(\d+)(?:\/|$)/)?.[1];
      
      if (pageId) {
        logger.info('New page created', { pageId });
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Failed to verify page creation', { error: error.message });
      return false;
    }
  }

  async navigateToPage(pageId) {
    try {
      logger.info('Navigating to Facebook page', { pageId });
      
      await this.page.goto(`https://www.facebook.com/${pageId}`);
      await rateLimit.wait('navigation');
      
      // Handle cookie consent if present
      const cookieConsent = await this.page.$('[data-testid="cookie-policy-manage-dialog"]');
      if (cookieConsent) {
        await this.page.click('[data-testid="cookie-policy-manage-dialog-accept-button"]');
        await rateLimit.wait('action');
      }
      
      // Verify page access
      const pageAccessError = await this.page.$('[data-testid="page_not_found_message"]');
      if (pageAccessError) {
        throw new Error('Page access denied or page not found');
      }

      // Verify admin access
      const hasAdminAccess = await this.retry(this.verifyPageAdminAccess, this);
      if (!hasAdminAccess) {
        throw new Error('No admin access to the page');
      }

      logger.info('Successfully navigated to Facebook page');
      return true;

    } catch (error) {
      logger.error('Failed to navigate to page', { error: error.message, pageId });
      throw error;
    }
  }

  async checkIfLoggedIn() {
    try {
      const feedPresent = await this.page.$('[aria-label="News Feed"]');
      const profilePresent = await this.page.$('[aria-label="Your profile"]');
      return !!(feedPresent || profilePresent);
    } catch (error) {
      logger.error('Failed to check login status', { error: error.message });
      return false;
    }
  }

  async check2FAPrompt() {
    try {
      const selectors = [
        '[aria-label="Two-factor authentication required"]',
        '#approvals_code',
        'input[name="approvals_code"]'
      ];
      
      for (const selector of selectors) {
        const element = await this.page.$(selector);
        if (element) return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Failed to check 2FA prompt', { error: error.message });
      return false;
    }
  }

  async handle2FA() {
    try {
      logger.info('Handling 2FA verification');
      
      // Wait for user to enter 2FA code manually
      await this.page.waitForNavigation({ 
        timeout: 60000,
        waitUntil: 'networkidle0'
      });
      
      // Verify 2FA success
      const loginError = await this.page.$('[data-testid="login_error"]');
      if (loginError) {
        throw new Error('2FA verification failed');
      }
      
      logger.info('2FA verification completed');
    } catch (error) {
      logger.error('2FA handling failed', { error: error.message });
      throw error;
    }
  }

  async verifyPageAdminAccess() {
    try {
      const adminSelectors = [
        '[aria-label="Page Settings"]',
        '[data-testid="page_admin_panel"]',
        '[data-testid="page_composer_button"]'
      ];
      
      for (const selector of adminSelectors) {
        const element = await this.page.$(selector);
        if (element) return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Failed to verify page admin access', { error: error.message });
      return false;
    }
  }

  async navigateToScheduledPosts() {
    try {
      logger.info('Navigating to scheduled posts');
      
      await this.retry(async () => {
        await this.page.click('[data-testid="page_publishing_tools"]');
        await this.page.waitForNavigation({ waitUntil: 'networkidle0' });
        await rateLimit.wait('navigation');
      }, this);

      await this.retry(async () => {
        await this.page.click('[data-testid="scheduled_posts_filter"]');
        await rateLimit.wait('action');
        
        const scheduledPostsHeader = await this.page.$('[data-testid="scheduled_posts_header"]');
        if (!scheduledPostsHeader) {
          throw new Error('Failed to load scheduled posts view');
        }
      }, this);
      
      logger.info('Successfully navigated to scheduled posts');
      return true;

    } catch (error) {
      logger.error('Failed to navigate to scheduled posts', { error: error.message });
      throw error;
    }
  }

  async removeScheduledPost(postIdentifier) {
    try {
      logger.info('Attempting to remove scheduled post', { postIdentifier });

      const post = await this.retry(this.findPost, this, postIdentifier);
      if (!post) {
        throw new Error('Post not found');
      }

      await this.retry(async () => {
        await post.click('[aria-label="Delete"]');
        await rateLimit.wait('action');
        await this.page.waitForSelector('[data-testid="confirm_delete_button"]');
      }, this);
      
      await this.retry(async () => {
        await this.page.click('[data-testid="confirm_delete_button"]');
        await rateLimit.wait('action');
        await this.page.waitForSelector('[data-testid="delete_success_message"]');
      }, this);

      this.removedPosts.push({
        identifier: postIdentifier,
        timestamp: new Date().toISOString(),
        status: 'success'
      });

      logger.info('Successfully removed scheduled post', { postIdentifier });
      return true;

    } catch (error) {
      this.removedPosts.push({
        identifier: postIdentifier,
        timestamp: new Date().toISOString(),
        status: 'failed',
        error: error.message
      });
      
      logger.error('Failed to remove scheduled post', { 
        error: error.message,
        postIdentifier 
      });
      throw error;
    }
  }

  async findPost(identifier) {
    try {
      const posts = await this.page.$$('[data-testid="scheduled_post_item"]');
      
      for (const post of posts) {
        const content = await post.$eval('.post-content', el => el.textContent);
        const date = await post.$eval('.post-date', el => el.textContent);
        const title = await post.$eval('.post-title', el => el.textContent).catch(() => '');
        
        if (
          content.includes(identifier) || 
          date.includes(identifier) || 
          title.includes(identifier)
        ) {
          return post;
        }
      }
      
      return null;
    } catch (error) {
      logger.error('Failed to find post', { error: error.message, identifier });
      return null;
    }
  }

  async cleanup() {
    try {
      if (this.browser) {
        const logPath = path.join(process.cwd(), 'logs', 'removal-log.json');
        await this.saveRemovalLog(logPath);
        
        await this.browser.close();
        logger.info('Browser closed successfully');
      }
    } catch (error) {
      logger.error('Failed to cleanup browser', { error: error.message });
    }
  }

  async saveRemovalLog(logPath) {
    try {
      const fs = await import('fs/promises');
      await fs.writeFile(
        logPath,
        JSON.stringify(this.removedPosts, null, 2)
      );
      logger.info('Removal log saved successfully', { logPath });
    } catch (error) {
      logger.error('Failed to save removal log', { error: error.message });
    }
  }

  getRemovalLog() {
    return this.removedPosts;
  }
}

// Example usage
async function main() {
  const automation = new FacebookAutomation();
  
  try {
    await automation.initialize();
    await automation.login();
    
    // Create a new page if needed
    if (process.env.CREATE_NEW_PAGE === 'true') {
      await automation.createFacebookPage();
    }
    
    const pageId = process.env.FACEBOOK_PAGE_ID;
    await automation.navigateToPage(pageId);
    await automation.navigateToScheduledPosts();
    
    // Example: Remove a specific post
    const postToRemove = process.env.POST_IDENTIFIER;
    if (postToRemove) {
      await automation.removeScheduledPost(postToRemove);
    }
    
    // Get removal log
    const removalLog = automation.getRemovalLog();
    logger.info('Posts removed during this session', { removalLog });
    
  } catch (error) {
    logger.error('Automation failed', { error: error.message });
  } finally {
    await automation.cleanup();
  }
}

// Run the automation
main();