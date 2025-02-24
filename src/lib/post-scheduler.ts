import { supabase } from './supabase';
import { facebookAuth } from './facebook';
import { Post } from '../types';

class PostScheduler {
  private static instance: PostScheduler;
  private checkInterval: number = 5 * 60 * 1000; // 5 minutes
  private intervalId?: NodeJS.Timeout;

  private constructor() {}

  static getInstance(): PostScheduler {
    if (!PostScheduler.instance) {
      PostScheduler.instance = new PostScheduler();
    }
    return PostScheduler.instance;
  }

  async start() {
    // Initial check
    await this.checkScheduledPosts();

    // Set up interval
    this.intervalId = setInterval(() => {
      this.checkScheduledPosts();
    }, this.checkInterval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private async checkScheduledPosts() {
    try {
      // Get posts that are scheduled and due
      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          *,
          post_pages (*)
        `)
        .eq('status', 'scheduled')
        .lte('scheduled_for', new Date().toISOString());

      if (error) throw error;

      // Process each post
      for (const post of posts) {
        await this.processScheduledPost(post);
      }
    } catch (error) {
      console.error('Error checking scheduled posts:', error);
    }
  }

  private async processScheduledPost(post: Post) {
    try {
      // Publish to Facebook
      await facebookAuth.publishPost(post);

      // Update post status
      await supabase
        .from('posts')
        .update({
          status: 'published',
          updated_at: new Date().toISOString()
        })
        .eq('id', post.id);

      // Initialize analytics
      await this.initializeAnalytics(post);
    } catch (error) {
      console.error(`Failed to process post ${post.id}:`, error);
      
      // Update post status to failed
      await supabase
        .from('posts')
        .update({
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          updated_at: new Date().toISOString()
        })
        .eq('id', post.id);
    }
  }

  private async initializeAnalytics(post: Post) {
    try {
      const analytics = post.selectedPages.map(page => ({
        post_id: post.id,
        page_id: page.id,
        likes: 0,
        comments: 0,
        shares: 0,
        reach: 0
      }));

      await supabase
        .from('post_analytics')
        .insert(analytics);
    } catch (error) {
      console.error(`Failed to initialize analytics for post ${post.id}:`, error);
    }
  }
}

export const postScheduler = PostScheduler.getInstance();