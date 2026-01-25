-- Venues table (Gyms, Coaching Centers, Libraries)
CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_user_id UUID REFERENCES business_users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('gym', 'coaching', 'library')),
  description TEXT,
  image TEXT,
  rating DECIMAL(3, 2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
  reviews_count INTEGER DEFAULT 0,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  price_label VARCHAR(50),
  location_lat DECIMAL(10, 8) NOT NULL,
  location_lng DECIMAL(11, 8) NOT NULL,
  location_address TEXT NOT NULL,
  location_city VARCHAR(100) NOT NULL,
  amenities TEXT[] DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'filling', 'full')),
  occupancy INTEGER DEFAULT 0,
  capacity INTEGER NOT NULL DEFAULT 100,
  verified BOOLEAN DEFAULT FALSE,
  open_now BOOLEAN DEFAULT TRUE,
  
  -- Type-specific attributes (stored as JSONB for flexibility)
  attributes JSONB DEFAULT '{}',
  
  -- Operating hours (stored as JSONB)
  operating_hours JSONB DEFAULT '{}',
  
  -- Publishing
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  venue_type VARCHAR(20) NOT NULL CHECK (venue_type IN ('gym', 'coaching', 'library')),
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  duration INTEGER NOT NULL DEFAULT 60, -- minutes
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  total_price DECIMAL(10, 2) DEFAULT 0,
  attendees INTEGER DEFAULT 1,
  special_requests TEXT,
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
  payment_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  cancelled_at TIMESTAMP,
  cancelled_reason TEXT
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  helpful_count INTEGER DEFAULT 0,
  business_reply TEXT,
  business_reply_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  UNIQUE(user_id, venue_id) -- One review per user per venue
);

-- Favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, venue_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL, -- Can be user or business_user
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('normal', 'business')),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  related_entity JSONB DEFAULT '{}',
  action_url TEXT,
  action_label VARCHAR(100),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  read BOOLEAN DEFAULT FALSE,
  delivery_channels TEXT[] DEFAULT '{}',
  delivery_status JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  payment_method VARCHAR(50) NOT NULL,
  payment_status VARCHAR(20) NOT NULL CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_gateway VARCHAR(50),
  transaction_id VARCHAR(100),
  gateway_response JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  refunded_at TIMESTAMP
);

-- Memberships table (for business members)
CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  business_user_id UUID NOT NULL REFERENCES business_users(id) ON DELETE CASCADE,
  membership_type VARCHAR(50) NOT NULL, -- daily, weekly, monthly, annual
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  auto_renew BOOLEAN DEFAULT FALSE,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Business Members table (members assigned to businesses)
CREATE TABLE IF NOT EXISTS business_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_user_id UUID NOT NULL REFERENCES business_users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  membership_id UUID REFERENCES memberships(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  UNIQUE(business_user_id, user_id)
);

-- Schedules table (venue availability schedule)
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_slot TIME NOT NULL,
  duration INTEGER DEFAULT 60, -- minutes
  total_slots INTEGER NOT NULL DEFAULT 15,
  booked_slots INTEGER DEFAULT 0,
  available_slots INTEGER GENERATED ALWAYS AS (total_slots - booked_slots) STORED,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(venue_id, date, time_slot)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_venues_business_user_id ON venues(business_user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_venues_category ON venues(category) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_venues_city ON venues(location_city) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_venues_location ON venues USING GIST (point(location_lng, location_lat)) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_venues_status ON venues(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_venues_verified ON venues(verified) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_venues_published ON venues(is_published) WHERE deleted_at IS NULL AND is_published = TRUE;

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_venue_id ON bookings(venue_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_venue_date_time ON bookings(venue_id, booking_date, booking_time);

CREATE INDEX IF NOT EXISTS idx_reviews_venue_id ON reviews(venue_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_venue_id ON favorites(venue_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id, user_type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);

CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_venue_id ON memberships(venue_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);

CREATE INDEX IF NOT EXISTS idx_business_members_business_id ON business_members(business_user_id);
CREATE INDEX IF NOT EXISTS idx_business_members_user_id ON business_members(user_id);

CREATE INDEX IF NOT EXISTS idx_schedules_venue_id ON schedules(venue_id);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(date);
CREATE INDEX IF NOT EXISTS idx_schedules_venue_date ON schedules(venue_id, date);

-- Triggers for updated_at
CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update venue rating when review is added/updated
CREATE OR REPLACE FUNCTION update_venue_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE venues
  SET 
    rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM reviews
      WHERE venue_id = NEW.venue_id AND deleted_at IS NULL
    ),
    reviews_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE venue_id = NEW.venue_id AND deleted_at IS NULL
    )
  WHERE id = NEW.venue_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_venue_rating_on_review
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_venue_rating();

-- Function to update schedule availability
CREATE OR REPLACE FUNCTION update_schedule_availability()
RETURNS TRIGGER AS $$
BEGIN
  -- Update schedule when booking is created/updated/cancelled
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
    UPDATE schedules
    SET booked_slots = booked_slots + 1
    WHERE venue_id = NEW.venue_id
      AND date = NEW.booking_date
      AND time_slot = NEW.booking_time;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
      UPDATE schedules
      SET booked_slots = booked_slots + 1
      WHERE venue_id = NEW.venue_id
        AND date = NEW.booking_date
        AND time_slot = NEW.booking_time;
    ELSIF OLD.status = 'confirmed' AND NEW.status != 'confirmed' THEN
      UPDATE schedules
      SET booked_slots = GREATEST(0, booked_slots - 1)
      WHERE venue_id = NEW.venue_id
        AND date = NEW.booking_date
        AND time_slot = NEW.booking_time;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_schedule_on_booking
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_schedule_availability();
