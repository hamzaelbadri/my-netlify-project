import { supabase } from './supabase';
import { facebookAuth } from './facebook';

interface SignUpData {
  name: string;
  email: string;
  password: string;
}

interface SignInData {
  email: string;
  password: string;
}

export async function signUp({ name, email, password }: SignUpData) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          created_at: new Date().toISOString()
        }
      }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Sign-up error:', error);
    throw error;
  }
}

export async function signIn({ email, password }: SignInData) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    // Update last login time
    await supabase
      .from('user_profiles')
      .update({ updated_at: new Date().toISOString() })
      .eq('user_id', data.user.id);

    return data;
  } catch (error) {
    console.error('Sign-in error:', error);
    throw error;
  }
}

export async function signInWithFacebook() {
  try {
    const { accessToken, userInfo } = await facebookAuth.login();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: window.location.origin,
        scopes: 'email',
        queryParams: {
          access_token: accessToken
        }
      }
    });

    if (error) throw error;
    return { data, userInfo };
  } catch (error) {
    console.error('Facebook sign-in error:', error);
    throw error;
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    await facebookAuth.logout();
  } catch (error) {
    console.error('Sign-out error:', error);
    throw error;
  }
}

export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;

    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      return {
        ...user,
        profile
      };
    }

    return null;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

export async function updateProfile(userId: string, updates: {
  name?: string;
  avatar_url?: string;
}) {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
}