-- Add gender column
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS gender VARCHAR(10);

-- Add pet-specific columns
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS is_trained BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_neutered BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS custom_breed VARCHAR(100);

-- Update existing data
UPDATE listings 
SET gender = 'male' 
WHERE gender IS NULL;

-- Add index
CREATE INDEX IF NOT EXISTS idx_listings_gender ON listings(gender);
