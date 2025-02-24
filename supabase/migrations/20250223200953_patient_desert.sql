/*
  # Add User Authentication Metadata and Timestamps

  1. New Tables
    - `user_metadata`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `last_ip` (text)
      - `last_user_agent` (text)
      - `login_count` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on user_metadata table
    - Add policies for authenticated users to read their own metadata
    - Add policies for system to update metadata

  3. Changes
    - Add trigger to track login metadata
*/

-- Create user_metadata table
CREATE TABLE IF NOT EXISTS public.user_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  last_ip text,
  last_user_agent text,
  login_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_metadata ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own metadata"
  ON public.user_metadata
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can update metadata"
  ON public.user_metadata
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create function to update metadata
CREATE OR REPLACE FUNCTION public.handle_user_login()
RETURNS TRIGGER AS $$
DECLARE
  user_agent text;
  ip_address text;
BEGIN
  -- Get user agent and IP from session metadata
  user_agent := current_setting('request.headers', true)::json->>'user-agent';
  ip_address := current_setting('request.headers', true)::json->>'x-real-ip';

  -- Insert or update user metadata
  INSERT INTO public.user_metadata (
    user_id,
    last_ip,
    last_user_agent,
    login_count
  )
  VALUES (
    NEW.user_id,
    ip_address,
    user_agent,
    1
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    last_ip = EXCLUDED.last_ip,
    last_user_agent = EXCLUDED.last_user_agent,
    login_count = user_metadata.login_count + 1,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for login tracking
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.sessions;
CREATE TRIGGER on_auth_user_login
  AFTER INSERT ON auth.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_login();

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_metadata_updated_at
  BEFORE UPDATE ON public.user_metadata
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX user_metadata_user_id_idx ON public.user_metadata(user_id);
CREATE INDEX user_metadata_login_count_idx ON public.user_metadata(login_count);