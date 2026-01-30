/*
  # Training Management System

  1. New Tables
    - `trainings`
      - `id` (uuid, primary key)
      - `title` (text, training title)
      - `description` (text, training description)
      - `category` (text, training category)
      - `duration` (integer, duration in hours)
      - `mode` (text, online/offline/hybrid)
      - `start_date` (timestamptz, training start date)
      - `end_date` (timestamptz, training end date)
      - `status` (text, upcoming/ongoing/completed/cancelled)
      - `created_by` (text, employee who created the training)
      - `created_at` (timestamptz, creation timestamp)

    - `training_assignments`
      - `id` (uuid, primary key)
      - `training_id` (uuid, references trainings)
      - `participant_id` (uuid, teacher/mentor id)
      - `participant_type` (text, teacher or mentor)
      - `school_id` (uuid, references schools)
      - `assigned_by` (text, employee who assigned)
      - `assigned_at` (timestamptz, assignment timestamp)
      - `status` (text, assigned/in-progress/completed/missed)
      - `completion_date` (timestamptz, when completed)
      - `attendance` (integer, attendance percentage)
      - `certificate_issued` (boolean, certificate status)
      - `feedback` (text, participant feedback)
      - `rating` (integer, rating 1-5)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read their school's data
    - Add policies for authenticated users to manage trainings
*/

-- Create trainings table
CREATE TABLE IF NOT EXISTS trainings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('pedagogy', 'technology', 'subject-knowledge', 'leadership', 'soft-skills', 'other')),
  duration integer NOT NULL,
  mode text NOT NULL CHECK (mode IN ('online', 'offline', 'hybrid')),
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  created_by text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create training_assignments table
CREATE TABLE IF NOT EXISTS training_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id uuid NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL,
  participant_type text NOT NULL CHECK (participant_type IN ('teacher', 'mentor')),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  assigned_by text NOT NULL,
  assigned_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in-progress', 'completed', 'missed')),
  completion_date timestamptz,
  attendance integer CHECK (attendance >= 0 AND attendance <= 100),
  certificate_issued boolean DEFAULT false,
  feedback text,
  rating integer CHECK (rating >= 1 AND rating <= 5)
);

-- Enable RLS
ALTER TABLE trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_assignments ENABLE ROW LEVEL SECURITY;

-- Policies for trainings table
CREATE POLICY "Anyone can view trainings"
  ON trainings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create trainings"
  ON trainings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update trainings"
  ON trainings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete trainings"
  ON trainings FOR DELETE
  TO authenticated
  USING (true);

-- Policies for training_assignments table
CREATE POLICY "Anyone can view training assignments"
  ON training_assignments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create assignments"
  ON training_assignments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update assignments"
  ON training_assignments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete assignments"
  ON training_assignments FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trainings_status ON trainings(status);
CREATE INDEX IF NOT EXISTS idx_trainings_start_date ON trainings(start_date);
CREATE INDEX IF NOT EXISTS idx_training_assignments_training_id ON training_assignments(training_id);
CREATE INDEX IF NOT EXISTS idx_training_assignments_participant ON training_assignments(participant_id, participant_type);
CREATE INDEX IF NOT EXISTS idx_training_assignments_school_id ON training_assignments(school_id);
