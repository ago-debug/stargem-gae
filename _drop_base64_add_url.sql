-- UP MIGRATION
-- Drop the heavy Base64 columns
ALTER TABLE members DROP COLUMN attachment_metadata;
ALTER TABLE members DROP COLUMN photo_url;

-- Add the new lightweight URL columns
ALTER TABLE members ADD COLUMN attachments_url JSON;
ALTER TABLE team_employees ADD COLUMN avatar_url VARCHAR(500);

-- DOWN MIGRATION (ROLLBACK)
-- ALTER TABLE members DROP COLUMN attachments_url;
-- ALTER TABLE team_employees DROP COLUMN avatar_url;
-- ALTER TABLE members ADD COLUMN attachment_metadata JSON;
-- ALTER TABLE members ADD COLUMN photo_url TEXT;
