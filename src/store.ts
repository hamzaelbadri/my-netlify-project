import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Post, PostFormData, FacebookPage } from './types';
import { facebookAuth } from './lib/facebook';
import { supabase, createPost, updatePost, deletePost, getPosts, addPostPages, removePostPages } from './lib/supabase';
import { FACEBOOK_CONFIG } from './lib/facebook-config';

interface AuthState {
  isAuthenticated: boolean;
  user: null | {
    id: string;
    name: string;
    email: string;
    picture?: string;
  };
  pages: FacebookPage[];
  savedPagePreferences: FacebookPage[];
}

interface PostStore extends AuthState {
  posts: Post[];
  currentPost: PostFormData;
  isLoading: boolean;
  error: string | null;
  setCurrentPost: (post: PostFormData) => void;
  addPost: (post: Post) => Promise<void>;
  updatePost: (id: string, post: Partial<Post>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  loadPosts: (filters?: {
    status?: ('draft' | 'scheduled' | 'published' | 'failed')[];
    fromDate?: string;
    toDate?: string;
    pageId?: string;
  }) => Promise<void>;
  updatePagePreferences: (pages: FacebookPage[]) => void;
  addPages: (pages: FacebookPage[]) => Promise<void>;
  removePages: (pageIds: string[]) => Promise<void>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

export const usePostStore = create<PostStore>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      pages: [],
      savedPagePreferences: [],
      posts: [],
      isLoading: false,
      error: null,
      currentPost: {
        content: '',
        firstComment: '',
        scheduledFor: new Date().toISOString(),
        selectedPages: [],
      },
      setCurrentPost: (post) => set({ currentPost: post }),
      addPost: async (post) => {
        try {
          set({ isLoading: true, error: null });
          const user = get().user;
          if (!user?.id) throw new Error('User not authenticated');

          const supabasePost = await createPost({
            content: post.content,
            first_comment: post.firstComment,
            image_url: post.imageUrl,
            scheduled_for: post.scheduledFor,
            status: post.status,
            user_id: user.id,
            metadata: {}
          });

          if (post.selectedPages.length > 0) {
            await addPostPages(post.selectedPages.map(page => ({
              post_id: supabasePost.id,
              page_id: page.id,
              page_name: page.name,
              page_access_token: page.accessToken
            })));
          }

          if (post.status === 'published') {
            await facebookAuth.publishPost(post);
          }

          set(state => ({ 
            posts: [...state.posts, { ...post, id: supabasePost.id }],
            error: null 
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create post';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      updatePost: async (id, updatedPost) => {
        try {
          set({ isLoading: true, error: null });

          await updatePost(id, {
            content: updatedPost.content,
            first_comment: updatedPost.firstComment,
            image_url: updatedPost.imageUrl,
            scheduled_for: updatedPost.scheduledFor,
            status: updatedPost.status,
            error: updatedPost.error
          });

          if (updatedPost.selectedPages) {
            await removePostPages(id, get().pages.map(p => p.id));
            await addPostPages(updatedPost.selectedPages.map(page => ({
              post_id: id,
              page_id: page.id,
              page_name: page.name,
              page_access_token: page.accessToken
            })));
          }

          set(state => ({
            posts: state.posts.map(post =>
              post.id === id ? { ...post, ...updatedPost } : post
            ),
            error: null
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update post';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      deletePost: async (id) => {
        try {
          set({ isLoading: true, error: null });
          await deletePost(id);
          set(state => ({
            posts: state.posts.filter(post => post.id !== id),
            error: null
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete post';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      loadPosts: async (filters) => {
        try {
          set({ isLoading: true, error: null });
          const posts = await getPosts(filters);
          set({ posts, error: null });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to load posts';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      updatePagePreferences: (pages) =>
        set({ savedPagePreferences: pages }),
      addPages: async (newPages) => {
        try {
          set({ isLoading: true, error: null });
          
          await Promise.all(
            newPages.map(page => facebookAuth.verifyPageAccess(page.id))
          );
          
          set(state => ({
            pages: [...state.pages, ...newPages],
            error: null
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to add pages';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      removePages: async (pageIds) => {
        try {
          set({ isLoading: true, error: null });
          
          set(state => ({
            pages: state.pages.filter(page => !pageIds.includes(page.id)),
            posts: state.posts.map(post => ({
              ...post,
              selectedPages: post.selectedPages.filter(page => !pageIds.includes(page.id))
            })),
            error: null
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to remove pages';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      login: async () => {
        try {
          set({ isLoading: true, error: null });
          
          const { accessToken, userInfo, pages } = await facebookAuth.login();
          
          if (!userInfo || !userInfo.id || !userInfo.name) {
            throw new Error('Invalid user information received');
          }

          const { data, error: signInError } = await supabase.auth.signInWithOAuth({
            provider: 'facebook',
            options: {
              redirectTo: window.location.origin,
              scopes: FACEBOOK_CONFIG.permissions.join(','),
              queryParams: {
                auth_type: 'rerequest',
                access_token: accessToken
              }
            }
          });

          if (signInError || !data.session) {
            throw new Error(signInError?.message || 'Failed to authenticate with Supabase');
          }

          set({ 
            isAuthenticated: true,
            user: {
              id: data.session.user.id,
              name: userInfo.name,
              email: userInfo.email || '',
              picture: userInfo.picture?.data?.url
            },
            pages,
            error: null
          });

          await get().loadPosts();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          set({ 
            isAuthenticated: false, 
            user: null, 
            pages: [],
            error: errorMessage 
          });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      logout: async () => {
        try {
          set({ isLoading: true, error: null });
          
          await Promise.all([
            facebookAuth.logout(),
            supabase.auth.signOut()
          ]);

          set({ 
            isAuthenticated: false, 
            user: null, 
            pages: [],
            posts: [],
            currentPost: {
              content: '',
              firstComment: '',
              scheduledFor: new Date().toISOString(),
              selectedPages: [],
            },
            error: null
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Logout failed';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'facebook-post-manager',
      partialize: (state) => ({
        savedPagePreferences: state.savedPagePreferences,
      }),
    }
  )
);