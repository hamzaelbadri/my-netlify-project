import { supabase } from './supabase';
import { tokenManager } from './token-manager';
import { createGraphApiUrl } from './facebook-config';

export async function updatePostAnalytics(postId: string) {
  try {
    // Get post and its pages
    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        *,
        post_pages (*)
      `)
      .eq('id', postId)
      .single();

    if (error) throw error;
    if (!post) throw new Error('Post not found');

    // Update analytics for each page
    for (const page of post.post_pages) {
      const token = tokenManager.getToken(page.page_id);
      if (!token) continue;

      const url = createGraphApiUrl(`${page.page_id}_${postId}/insights`, {
        metric: [
          'post_impressions',
          'post_engaged_users',
          'post_reactions_by_type_total',
          'post_comments',
          'post_shares'
        ].join(','),
        access_token: token
      });

      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        console.error(`Failed to fetch analytics for page ${page.page_id}:`, data.error);
        continue;
      }

      // Update analytics in database
      await supabase
        .from('post_analytics')
        .upsert({
          post_id: postId,
          page_id: page.page_id,
          likes: data.reactions?.total || 0,
          comments: data.comments?.total || 0,
          shares: data.shares?.total || 0,
          reach: data.impressions?.total || 0
        });
    }
  } catch (error) {
    console.error('Failed to update post analytics:', error);
    throw error;
  }
}

export async function getPostAnalytics(postId: string) {
  try {
    const { data, error } = await supabase
      .from('post_analytics')
      .select('*')
      .eq('post_id', postId);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to get post analytics:', error);
    throw error;
  }
}

export async function getTeamMembers() {
  try {
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        *,
        user:auth.users (
          id,
          email,
          created_at
        )
      `);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to get team members:', error);
    throw error;
  }
}

export async function updateTeamMember(userId: string, role: 'admin' | 'editor' | 'viewer') {
  try {
    const { error } = await supabase
      .from('team_members')
      .upsert({
        user_id: userId,
        role
      });

    if (error) throw error;
  } catch (error) {
    console.error('Failed to update team member:', error);
    throw error;
  }
}