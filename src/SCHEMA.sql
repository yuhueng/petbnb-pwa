-- ============================================
-- PET SITTING APPLICATION - COMPLETE SCHEMA
-- ============================================

-- ============================================
-- 1. PROFILES (Extends auth.users)
-- ============================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  bio TEXT,
  location TEXT,
  avatar_url TEXT,
  last_role TEXT CHECK (last_role IN ('owner', 'sitter')) DEFAULT 'owner',
  
  -- Account status
  is_verified BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_last_role ON profiles(last_role);
-- ============================================
  -- PROFILE AVATARS BUCKET
  -- ============================================

  -- Create bucket for profile avatar images
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('profile-avatars', 'profile-avatars', true)
  ON CONFLICT (id) DO NOTHING;

  -- Allow authenticated users to upload their profile avatars
  CREATE POLICY "Allow users to upload own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

  -- Allow public read access to profile avatars
  CREATE POLICY "Allow public read of avatars"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'profile-avatars');

  -- Allow users to update their own avatars
  CREATE POLICY "Allow users to update own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

  -- Allow users to delete their own avatars
  CREATE POLICY "Allow users to delete own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================
-- 2. PETS (Linked to profiles - owners only)
-- ============================================

CREATE TABLE pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Basic info
  name TEXT NOT NULL,
  species TEXT NOT NULL CHECK (species IN ('dog', 'cat', 'bird', 'rabbit', 'hamster', 'other')),
  breed TEXT,
  age INTEGER,
  weight DECIMAL(5,2),
  gender TEXT CHECK (gender IN ('male', 'female', 'unknown')),
  
  -- Medical information
  medical_conditions TEXT,
  allergies TEXT,
  medications TEXT,
  vet_name TEXT,
  vet_phone TEXT,
  
  -- Behavioral info
  temperament TEXT,
  special_needs TEXT,
  feeding_instructions TEXT,
  
  -- Media
  photo_url TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pets_owner ON pets(owner_id);
CREATE INDEX idx_pets_active ON pets(is_active);

-- ============================================
-- 3. LISTINGS (Linked to profiles - sitters only)
-- ============================================

CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sitter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Service details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  service_type TEXT[] NOT NULL, -- ['boarding', 'daycare', 'walking', 'grooming']
  
  -- Availability
  available_from DATE,
  available_to DATE,
  
  -- Capacity & preferences
  max_pets INTEGER DEFAULT 1,
  accepted_pet_types TEXT[] NOT NULL, -- ['dog', 'cat']
  accepted_pet_sizes TEXT[], -- ['small', 'medium', 'large']
  
  -- Pricing (in cents to avoid decimal issues)
  price_per_day INTEGER, -- in cents
  price_per_hour INTEGER, -- in cents
  
  -- Location
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Additional info
  amenities TEXT[], -- ['fenced_yard', 'air_conditioning', 'pool']
  house_rules TEXT,
  cancellation_policy TEXT,

  -- Images
  cover_image_url TEXT, -- Main card image
  image_urls TEXT[], -- Gallery images array

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_listings_sitter ON listings(sitter_id);
CREATE INDEX idx_listings_active ON listings(is_active);
CREATE INDEX idx_listings_location ON listings(city, state);

-- ============================================
-- 4. BOOKINGS (Links owners, sitters, listings)
-- ============================================

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  pet_owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pet_sitter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Pets involved in this booking
  pet_ids UUID[] NOT NULL, -- Array of pet IDs
  
  -- Booking details
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Status tracking
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  
  -- Pricing (NO payment processing fields as requested)
  total_price INTEGER, -- in cents, calculated at booking time
  
  -- Additional info
  special_requests TEXT,
  cancellation_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Ensure dates are logical
  CHECK (end_date >= start_date)
);

CREATE INDEX idx_bookings_listing ON bookings(listing_id);
CREATE INDEX idx_bookings_owner ON bookings(pet_owner_id);
CREATE INDEX idx_bookings_sitter ON bookings(pet_sitter_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_dates ON bookings(start_date, end_date);

-- ============================================
-- 5. CONVERSATIONS (Chat between owner & sitter)
-- ============================================

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pet_sitter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Performance optimization fields
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_preview TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique conversation between two users
  UNIQUE(pet_owner_id, pet_sitter_id)
);

CREATE INDEX idx_conversations_owner ON conversations(pet_owner_id);
CREATE INDEX idx_conversations_sitter ON conversations(pet_sitter_id);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);

-- ============================================
-- 6. MESSAGES (Real-time chat messages)
-- ============================================

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Message content
  content TEXT NOT NULL,
  attachment_url TEXT,

  -- Metadata for special message types (e.g., booking requests)
  metadata JSONB DEFAULT NULL,

  -- Read status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_unread ON messages(conversation_id, is_read) WHERE is_read = false;
CREATE INDEX idx_messages_metadata ON messages USING GIN (metadata);

-- ============================================
-- 7. REVIEWS (Linked to profiles - for sitters only)
-- ============================================

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  
  -- Reviewer and reviewee
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sitter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- Only sitters get reviewed
  
  -- Review content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  
  -- Response from sitter
  response TEXT,
  response_at TIMESTAMPTZ,
  
  -- Metadata
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one review per booking per reviewer
  UNIQUE(booking_id, reviewer_id)
);

CREATE INDEX idx_reviews_booking ON reviews(booking_id);
CREATE INDEX idx_reviews_sitter ON reviews(sitter_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_visible ON reviews(is_visible);

-- ============================================
-- 8. CERTIFICATIONS (Linked to profiles - sitters only)
-- ============================================

CREATE TABLE certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sitter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Certification details
  certification_type TEXT NOT NULL, -- 'pet_first_aid', 'dog_training', 'grooming'
  certification_name TEXT NOT NULL,
  issuing_organization TEXT,
  
  -- Verification
  certificate_number TEXT,
  document_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  
  -- Dates
  issued_date DATE,
  expiry_date DATE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_certifications_sitter ON certifications(sitter_id);
CREATE INDEX idx_certifications_verified ON certifications(is_verified);
CREATE INDEX idx_certifications_expiry ON certifications(expiry_date);

-- ============================================
-- 9. WISHLISTS (Linked to profiles - owners save favorite listings)
-- ============================================

CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one wishlist entry per owner per listing
  UNIQUE(owner_id, listing_id)
);

CREATE INDEX idx_wishlists_owner ON wishlists(owner_id);
CREATE INDEX idx_wishlists_listing ON wishlists(listing_id);
CREATE INDEX idx_wishlists_created ON wishlists(created_at DESC);

-- ============================================
-- TRIGGERS - Auto-update timestamps
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pets_updated_at 
  BEFORE UPDATE ON pets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listings_updated_at 
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at 
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at 
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at 
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certifications_updated_at 
  BEFORE UPDATE ON certifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TRIGGER - Update conversation on new message
-- ============================================

CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET 
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.content, 100)
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_after_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_on_message();

-- ============================================
-- ROW LEVEL SECURITY (RLS) - Enable
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- PROFILES: Public read, own update
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Allow users to insert their own profile during registration
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- PETS: Owners manage their own pets
CREATE POLICY "Users can view their own pets"
  ON pets FOR SELECT 
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own pets"
  ON pets FOR INSERT 
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own pets"
  ON pets FOR UPDATE 
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own pets"
  ON pets FOR DELETE 
  USING (auth.uid() = owner_id);

-- LISTINGS: Public read, sitters manage own
CREATE POLICY "Active listings viewable by everyone"
  ON listings FOR SELECT 
  USING (is_active = true OR auth.uid() = sitter_id);

CREATE POLICY "Sitters can create listings"
  ON listings FOR INSERT 
  WITH CHECK (auth.uid() = sitter_id);

CREATE POLICY "Sitters can update own listings"
  ON listings FOR UPDATE 
  USING (auth.uid() = sitter_id);

CREATE POLICY "Sitters can delete own listings"
  ON listings FOR DELETE 
  USING (auth.uid() = sitter_id);

-- BOOKINGS: Involved parties only
CREATE POLICY "Users can view their bookings"
  ON bookings FOR SELECT 
  USING (auth.uid() = pet_owner_id OR auth.uid() = pet_sitter_id);

CREATE POLICY "Pet owners can create bookings"
  ON bookings FOR INSERT 
  WITH CHECK (auth.uid() = pet_owner_id);

CREATE POLICY "Involved parties can update bookings"
  ON bookings FOR UPDATE 
  USING (auth.uid() = pet_owner_id OR auth.uid() = pet_sitter_id);

-- CONVERSATIONS: Participants only
CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT 
  USING (auth.uid() = pet_owner_id OR auth.uid() = pet_sitter_id);

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT 
  WITH CHECK (auth.uid() = pet_owner_id OR auth.uid() = pet_sitter_id);

-- MESSAGES: Conversation participants only
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND (conversations.pet_owner_id = auth.uid() OR conversations.pet_sitter_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON messages FOR INSERT 
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND (conversations.pet_owner_id = auth.uid() OR conversations.pet_sitter_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own messages"
  ON messages FOR UPDATE
  USING (auth.uid() = sender_id);

-- REVIEWS: Public read, reviewers create/update own
CREATE POLICY "Visible reviews viewable by everyone"
  ON reviews FOR SELECT 
  USING (is_visible = true);

CREATE POLICY "Users can create reviews for their bookings"
  ON reviews FOR INSERT 
  WITH CHECK (
    auth.uid() = reviewer_id AND
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = reviews.booking_id 
      AND bookings.status = 'completed'
      AND (bookings.pet_owner_id = auth.uid() OR bookings.pet_sitter_id = auth.uid())
    )
  );

CREATE POLICY "Reviewers can update own reviews"
  ON reviews FOR UPDATE 
  USING (auth.uid() = reviewer_id);

CREATE POLICY "Sitters can respond to their reviews"
  ON reviews FOR UPDATE 
  USING (auth.uid() = sitter_id);

-- CERTIFICATIONS: Public read, sitters manage own
CREATE POLICY "Certifications viewable by everyone"
  ON certifications FOR SELECT 
  USING (true);

CREATE POLICY "Sitters can add certifications"
  ON certifications FOR INSERT 
  WITH CHECK (auth.uid() = sitter_id);

CREATE POLICY "Sitters can update own certifications"
  ON certifications FOR UPDATE 
  USING (auth.uid() = sitter_id);

CREATE POLICY "Sitters can delete own certifications"
  ON certifications FOR DELETE
  USING (auth.uid() = sitter_id);

-- WISHLISTS: Owners manage their own wishlists
CREATE POLICY "Users can view their own wishlist"
  ON wishlists FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can add to their wishlist"
  ON wishlists FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can remove from their wishlist"
  ON wishlists FOR DELETE
  USING (auth.uid() = owner_id);


-- ============================================
-- STORAGE BUCKETS & POLICIES
-- ============================================

-- ============================================
-- MESSAGE ATTACHMENTS BUCKET
-- ============================================

-- Create bucket for message attachments (images, documents)
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-attachments', 'message-attachments', true);

-- Allow authenticated users to upload message attachments
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'message-attachments');

-- Allow public read access to message attachments
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'message-attachments');

-- Allow users to update their own message attachments
CREATE POLICY "Allow authenticated updates for message attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'message-attachments' AND owner = auth.uid());

-- Allow users to delete their own message attachments
CREATE POLICY "Allow user deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'message-attachments' AND owner = auth.uid());

-- ============================================
-- LISTING IMAGES BUCKET
-- ============================================

-- Create bucket for listing images (cover image and gallery)
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-images', 'listing-images', true);

-- Allow authenticated users to upload listing images
CREATE POLICY "Allow sitters to upload listing images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'listing-images');

-- Allow public read access to listing images
CREATE POLICY "Allow public read of listing images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'listing-images');

-- Allow users to update their own listing images
CREATE POLICY "Allow users to update own listing images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'listing-images' AND owner = auth.uid());

-- Allow users to delete their own listing images
CREATE POLICY "Allow users to delete own listing images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'listing-images' AND owner = auth.uid());

-- ============================================
-- PROFILE AVATARS BUCKET
-- ============================================

-- Create bucket for profile avatar images
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-avatars', 'profile-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their profile avatars
CREATE POLICY "Allow users to upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to profile avatars
CREATE POLICY "Allow public read of avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-avatars');

-- Allow users to update their own avatars
CREATE POLICY "Allow users to update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own avatars
CREATE POLICY "Allow users to delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- PET ACTIVITIES - Activity Timeline Tracking
-- ============================================
-- This table stores all activities (walk, feed, play) performed by sitters
-- Visible to both sitters and owners for timeline display

CREATE TABLE pet_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys (matches existing schema style)
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  pet_sitter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pet_owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Activity Details
  activity_type TEXT NOT NULL CHECK (activity_type IN ('walk', 'feed', 'play')),
  activity_title TEXT NOT NULL, -- e.g., "Walk", "Feed", "Play"
  activity_description TEXT, -- e.g., "Great walk today!", "Ate 2 cups of kibble"

  -- Activity Specifics (flexible JSON storage for type-specific data)
  activity_detail JSONB DEFAULT NULL,
  -- Examples:
  -- For walk: {"distance": "2 miles", "duration": "30 minutes", "location": "Central Park"}
  -- For feed: {"amount": "2 cups", "food_type": "Dry kibble", "notes": "Ate everything!"}
  -- For play: {"activity": "Fetch", "duration": "20 minutes", "toys": ["ball", "frisbee"]}

  -- Image/Media URLs (stored as array for multiple images)
  image_urls TEXT[], -- Array of image URLs from Supabase storage

  -- Timestamps
  activity_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- When activity happened
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Metadata
  is_visible BOOLEAN DEFAULT true, -- Can be hidden by owner/sitter
  notes TEXT -- Additional notes from sitter
);

-- ============================================
-- INDEXES - For better query performance
-- ============================================

CREATE INDEX idx_pet_activities_booking ON pet_activities(booking_id);
CREATE INDEX idx_pet_activities_sitter ON pet_activities(pet_sitter_id);
CREATE INDEX idx_pet_activities_owner ON pet_activities(pet_owner_id);
CREATE INDEX idx_pet_activities_timestamp ON pet_activities(activity_timestamp DESC);
CREATE INDEX idx_pet_activities_type ON pet_activities(activity_type);

-- Composite index for common queries (get activities by booking and date)
CREATE INDEX idx_pet_activities_booking_timestamp ON pet_activities(booking_id, activity_timestamp DESC);

-- ============================================
-- TRIGGER - Auto-update timestamps
-- ============================================

-- Use existing update_updated_at_column() function
CREATE TRIGGER update_pet_activities_updated_at
  BEFORE UPDATE ON pet_activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) - Enable
-- ============================================

ALTER TABLE pet_activities ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Sitters can view their own activities
CREATE POLICY "Sitters can view their activities"
  ON pet_activities FOR SELECT
  TO authenticated
  USING (auth.uid() = pet_sitter_id);

-- Pet owners can view activities for their bookings
CREATE POLICY "Owners can view activities for their pets"
  ON pet_activities FOR SELECT
  TO authenticated
  USING (auth.uid() = pet_owner_id);

-- Sitters can create activities for their own bookings
CREATE POLICY "Sitters can create activities for their bookings"
  ON pet_activities FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = pet_sitter_id AND
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = pet_activities.booking_id
      AND bookings.pet_sitter_id = auth.uid()
      AND bookings.status IN ('confirmed', 'in_progress')
    )
  );

-- Sitters can update their own activities (within 24 hours)
CREATE POLICY "Sitters can update their activities within 24 hours"
  ON pet_activities FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = pet_sitter_id AND
    created_at > NOW() - INTERVAL '24 hours'
  )
  WITH CHECK (auth.uid() = pet_sitter_id);

-- Sitters can delete their own activities (within 24 hours)
CREATE POLICY "Sitters can delete their activities within 24 hours"
  ON pet_activities FOR DELETE
  TO authenticated
  USING (
    auth.uid() = pet_sitter_id AND
    created_at > NOW() - INTERVAL '24 hours'
  );

-- ============================================
-- STORAGE BUCKET - Pet Activity Images
-- ============================================

-- Create bucket for pet activity images
INSERT INTO storage.buckets (id, name, public)
VALUES ('pet-activity-images', 'pet-activity-images', true)
ON CONFLICT (id) DO NOTHING; -- Prevent error if bucket already exists

-- Allow authenticated users to upload pet activity images
CREATE POLICY "Allow sitters to upload activity images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'pet-activity-images');

-- Allow public read access to pet activity images
CREATE POLICY "Allow public read of activity images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'pet-activity-images');

-- Allow users to update their own activity images
CREATE POLICY "Allow users to update own activity images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'pet-activity-images' AND owner = auth.uid());

-- Allow users to delete their own activity images
CREATE POLICY "Allow users to delete own activity images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'pet-activity-images' AND owner = auth.uid());

-- ============================================
-- COMMENTS - Documentation
-- ============================================

COMMENT ON TABLE pet_activities IS 'Stores pet care activities (walk, feed, play) performed by sitters during bookings. Visible to both sitters and owners for timeline tracking.';
COMMENT ON COLUMN pet_activities.activity_type IS 'Type of activity: walk, feed, or play';
COMMENT ON COLUMN pet_activities.activity_detail IS 'JSONB object containing type-specific details about the activity';
COMMENT ON COLUMN pet_activities.image_urls IS 'Array of image URLs uploaded during activity logging (stored in pet-activity-images bucket)';
COMMENT ON COLUMN pet_activities.activity_timestamp IS 'When the activity was performed (can be different from created_at if backfilled)';
COMMENT ON COLUMN pet_activities.created_at IS 'When the record was created in the database';

-- ============================================
-- STORAGE: Certification Images Bucket
-- ============================================

-- Create certification images bucket (public access for images)
INSERT INTO storage.buckets (id, name, public)
VALUES ('certification-images', 'certification-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload certification images
CREATE POLICY "Allow authenticated users to upload certification images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'certification-images');

-- Allow public read access to certification images
CREATE POLICY "Allow public read of certification images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'certification-images');

-- Allow users to update their own certification images
CREATE POLICY "Allow users to update own certification images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'certification-images' AND owner = auth.uid());

-- Allow users to delete their own certification images
CREATE POLICY "Allow users to delete own certification images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'certification-images' AND owner = auth.uid());
