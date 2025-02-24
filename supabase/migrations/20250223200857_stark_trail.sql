/*
  # Add Authentication Timestamps
  
  1. Changes
    - Add created_at timestamp for user signup
    - Add last_login timestamp for user login tracking
    - Add trigger for automatic last_login updates
    
  2. Security
    - Maintain existing RLS policies
    - Only authenticated users can view their own timestamps
*/

DO $$ 
BEGIN
  -- Add created_at if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'auth' 
    AND table_name = 'users' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE auth.users ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT now();
  END IF;

  -- Add last_login if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'auth' 
    AND table_name = 'users' 
    AND column_name = 'last_login'
  ) THEN
    ALTER TABLE auth.users ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Create function to update last_login
CREATE OR REPLACE FUNCTION auth.update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users 
  SET last_login = now() 
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for last_login updates
DROP TRIGGER IF EXISTS on_auth_sign_in ON auth.sessions;
CREATE TRIGGER on_auth_sign_in
  AFTER INSERT ON auth.sessions
  FOR EACH ROW
  EXECUTE FUNCTION auth.update_last_login();