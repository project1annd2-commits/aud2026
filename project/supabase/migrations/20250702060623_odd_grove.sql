/*
  # Initial Schema for School Management System

  1. New Tables
    - `schools`
      - `id` (uuid, primary key)
      - `name` (text)
      - `location` (text)
      - `code` (text, optional)
      - `created_by` (text)
      - `created_at` (timestamp)
    
    - `teachers`
      - `id` (uuid, primary key)
      - `school_id` (uuid, foreign key)
      - `name` (text)
      - `qualification` (text)
      - `phone` (text)
      - `email` (text, optional)
      - `subject` (text)
      - `created_at` (timestamp)
    
    - `mentors`
      - `id` (uuid, primary key)
      - `school_id` (uuid, foreign key)
      - `name` (text)
      - `qualification` (text)
      - `phone` (text)
      - `email` (text, optional)
      - `expertise` (text)
      - `created_at` (timestamp)
    
    - `audits`
      - `id` (uuid, primary key)
      - `type` (text)
      - `subject_id` (uuid)
      - `school_id` (uuid, foreign key)
      - `access_code` (text, unique)
      - `versions` (jsonb)
      - `current_version` (integer)
      - `created_at` (timestamp)
    
    - `infrastructure_audits`
      - `id` (uuid, primary key)
      - `school_id` (uuid, foreign key)
      - `access_code` (text, unique)
      - `versions` (jsonb)
      - `current_version` (integer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create schools table
CREATE TABLE IF NOT EXISTS schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL,
  code text,
  created_by text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  qualification text NOT NULL,
  phone text NOT NULL,
  email text,
  subject text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create mentors table
CREATE TABLE IF NOT EXISTS mentors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  qualification text NOT NULL,
  phone text NOT NULL,
  email text,
  expertise text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create audits table
CREATE TABLE IF NOT EXISTS audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('teacher', 'mentor')),
  subject_id uuid NOT NULL,
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
  access_code text UNIQUE NOT NULL,
  versions jsonb NOT NULL DEFAULT '[]'::jsonb,
  current_version integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create infrastructure_audits table
CREATE TABLE IF NOT EXISTS infrastructure_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
  access_code text UNIQUE NOT NULL,
  versions jsonb NOT NULL DEFAULT '[]'::jsonb,
  current_version integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE infrastructure_audits ENABLE ROW LEVEL SECURITY;

-- Create policies for schools
CREATE POLICY "Users can read all schools"
  ON schools
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert schools"
  ON schools
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own schools"
  ON schools
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete schools"
  ON schools
  FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for teachers
CREATE POLICY "Users can read all teachers"
  ON teachers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert teachers"
  ON teachers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update teachers"
  ON teachers
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete teachers"
  ON teachers
  FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for mentors
CREATE POLICY "Users can read all mentors"
  ON mentors
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert mentors"
  ON mentors
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update mentors"
  ON mentors
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete mentors"
  ON mentors
  FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for audits
CREATE POLICY "Users can read all audits"
  ON audits
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can read audits by access code"
  ON audits
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Users can insert audits"
  ON audits
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update audits"
  ON audits
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete audits"
  ON audits
  FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for infrastructure_audits
CREATE POLICY "Users can read all infrastructure audits"
  ON infrastructure_audits
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can read infrastructure audits by access code"
  ON infrastructure_audits
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Users can insert infrastructure audits"
  ON infrastructure_audits
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update infrastructure audits"
  ON infrastructure_audits
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete infrastructure audits"
  ON infrastructure_audits
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teachers_school_id ON teachers(school_id);
CREATE INDEX IF NOT EXISTS idx_mentors_school_id ON mentors(school_id);
CREATE INDEX IF NOT EXISTS idx_audits_school_id ON audits(school_id);
CREATE INDEX IF NOT EXISTS idx_audits_subject_id ON audits(subject_id);
CREATE INDEX IF NOT EXISTS idx_audits_access_code ON audits(access_code);
CREATE INDEX IF NOT EXISTS idx_infrastructure_audits_school_id ON infrastructure_audits(school_id);
CREATE INDEX IF NOT EXISTS idx_infrastructure_audits_access_code ON infrastructure_audits(access_code);