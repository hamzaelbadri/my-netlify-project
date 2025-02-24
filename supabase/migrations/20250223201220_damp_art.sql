/*
  # Add Post Analytics and Team Features

  1. New Tables
    - post_analytics
      - id (uuid, primary key)
      - post_id (uuid, references posts)
      - page_id (text)
      - likes (integer)
      - comments (integer)
      - shares (integer)
      - reach (integer)
      - updated_at (timestamptz)
    
    - team_members
      - id (uuid, primary key)
      - user_id (uuid, references auth.users)
      - role (text: admin, editor, viewer)
      - created_at (timestamptz)

  2. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
*/

-- Create post_analytics table
CREATE TABLE IF NOT EXISTS post_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  page_id text NOT NULL,
  likes integer DEFAULT 0,
  comments integer DEFAULT 0,
  shares integer DEFAULT 0,
  reach integer DEFAULT 0,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE post_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Create policies for post_analytics
CREATE POLICY "Users can view analytics for their posts"
  ON post_analytics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_analytics.post_id
      AND posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update analytics for their posts"
  ON post_analytics
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_analytics.post_id
      AND posts.user_id = auth.uid()
    )
  );

-- Create policies for team_members
CREATE POLICY "Users can view team members"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage team members"
  ON team_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.user_id = auth.uid()
      AND team_members.role = 'admin'
    )
  );

-- Create function to check scheduled posts
CREATE OR REPLACE FUNCTION check_scheduled_posts()
RETURNS void AS $$
BEGIN
  -- Update posts that are ready to be published
  UPDATE posts
  SET status = 'published',
      updated_at = now()
  WHERE status = 'scheduled'
    AND scheduled_for <= now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes
CREATE INDEX post_analytics_post_id_idx ON post_analytics(post_id);
CREATE INDEX post_analytics_page_id_idx ON post_analytics(page_id);
CREATE INDEX team_members_user_id_idx ON team_members(user_id);
CREATE INDEX team_members_role_idx ON team_members(role);