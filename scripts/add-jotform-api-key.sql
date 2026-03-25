-- Add jotform_api_key column to organizations table
-- Run this in the Supabase SQL editor
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS jotform_api_key text;

-- Optional: Add a comment for documentation
COMMENT ON COLUMN organizations.jotform_api_key IS 'JotForm API key for form cloning and management';
