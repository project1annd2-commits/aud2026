/*
  # Remove Authentication Requirement

  1. Security Changes
    - Update RLS policies to allow anonymous access for all operations
    - This enables static access without authentication

  2. Notes
    - This is for development/demo purposes
    - In production, proper authentication should be implemented
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read all schools" ON schools;
DROP POLICY IF EXISTS "Users can insert schools" ON schools;
DROP POLICY IF EXISTS "Users can update their own schools" ON schools;
DROP POLICY IF EXISTS "Users can delete schools" ON schools;

DROP POLICY IF EXISTS "Users can read all teachers" ON teachers;
DROP POLICY IF EXISTS "Users can insert teachers" ON teachers;
DROP POLICY IF EXISTS "Users can update teachers" ON teachers;
DROP POLICY IF EXISTS "Users can delete teachers" ON teachers;

DROP POLICY IF EXISTS "Users can read all mentors" ON mentors;
DROP POLICY IF EXISTS "Users can insert mentors" ON mentors;
DROP POLICY IF EXISTS "Users can update mentors" ON mentors;
DROP POLICY IF EXISTS "Users can delete mentors" ON mentors;

DROP POLICY IF EXISTS "Users can read all audits" ON audits;
DROP POLICY IF EXISTS "Anyone can read audits by access code" ON audits;
DROP POLICY IF EXISTS "Users can insert audits" ON audits;
DROP POLICY IF EXISTS "Users can update audits" ON audits;
DROP POLICY IF EXISTS "Users can delete audits" ON audits;

DROP POLICY IF EXISTS "Users can read all infrastructure audits" ON infrastructure_audits;
DROP POLICY IF EXISTS "Anyone can read infrastructure audits by access code" ON infrastructure_audits;
DROP POLICY IF EXISTS "Users can insert infrastructure audits" ON infrastructure_audits;
DROP POLICY IF EXISTS "Users can update infrastructure audits" ON infrastructure_audits;
DROP POLICY IF EXISTS "Users can delete infrastructure audits" ON infrastructure_audits;

-- Create new policies that allow anonymous access
-- Schools policies
CREATE POLICY "Allow all operations on schools"
  ON schools
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Teachers policies
CREATE POLICY "Allow all operations on teachers"
  ON teachers
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Mentors policies
CREATE POLICY "Allow all operations on mentors"
  ON mentors
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Audits policies
CREATE POLICY "Allow all operations on audits"
  ON audits
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Infrastructure audits policies
CREATE POLICY "Allow all operations on infrastructure audits"
  ON infrastructure_audits
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);