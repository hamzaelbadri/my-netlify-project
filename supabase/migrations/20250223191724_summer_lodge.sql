/*
  # Create posts table and related schemas

  1. New Tables
    - `posts`
      - `id` (uuid, primary key)
      - `content` (text, required)
      - `first_comment` (text)
      - `image_url` (text)
      - `scheduled_for` (timestamptz)
      - `status` (enum: draft, scheduled, published, failed)
      - `error` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `user_id` (uuid, foreign key to auth.users)
      - `metadata` (jsonb for storing Facebook-specific data)
    
    - `post_pages`
      - `id` (uuid, primary key)
      - `post_id` (uuid, foreign key to posts)
      - `page_id` (text, Facebook page ID)
      - `page_name` (text)
      - `page_access_token` (text, encrypted)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own posts
    - Add policies for post_pages access
*/

-- Create post status enum
CREATE TYPE post_status AS ENUM ('draft', 'scheduled', 'published', 'failed');

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  first_comment text,
  image_url text,
  scheduled_for timestamptz,
  status post_status NOT NULL DEFAULT 'draft',
  error text,
  metadata jsonb DEFAULT '{}'::jsonb,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create post_pages table for many-to-many relationship
CREATE TABLE IF NOT EXISTS post_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  page_id text NOT NULL,
  page_name text NOT NULL,
  page_access_token text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(post_id, page_id)
);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_pages ENABLE ROW LEVEL SECURITY;

-- Create policies for posts
CREATE POLICY "Users can create their own posts"
  ON posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own posts"
  ON posts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
  ON posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
  ON posts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for post_pages
CREATE POLICY "Users can manage post pages through posts"
  ON post_pages
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_pages.post_id
      AND posts.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX posts_user_id_idx ON posts(user_id);
CREATE INDEX posts_status_idx ON posts(status);
CREATE INDEX posts_scheduled_for_idx ON posts(scheduled_for);
CREATE INDEX post_pages_post_id_idx ON post_pages(post_id);
CREATE INDEX post_pages_page_id_idx ON post_pages(page_id);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();