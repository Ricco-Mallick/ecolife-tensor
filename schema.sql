-- EcoLife Tensor Database Schema & Initial Seed Script
-- Supabase PostgreSQL Source of Truth

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT 'Eco Warrior',
  avatar_url TEXT DEFAULT '',
  total_points INT DEFAULT 0,
  co2_saved_tons NUMERIC(10,4) DEFAULT 0,
  streak_days INT DEFAULT 0,
  daily_score INT DEFAULT 0,
  completed_challenges TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ECO ACTIONS TABLE
CREATE TABLE IF NOT EXISTS eco_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  co2_saved_kg NUMERIC(10,4) DEFAULT 0,
  points_earned INT DEFAULT 30,
  verification_method TEXT DEFAULT 'self_report',
  verified BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CHALLENGES TABLE
CREATE TABLE IF NOT EXISTS challenges (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  points INT NOT NULL,
  co2_target NUMERIC(10,4) NOT NULL,
  icon TEXT DEFAULT '🌱',
  verification_type TEXT DEFAULT 'self_report',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CHALLENGE COMPLETIONS TABLE
CREATE TABLE IF NOT EXISTS challenge_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  evidence JSONB DEFAULT '{}'::jsonb,
  verified BOOLEAN DEFAULT TRUE,
  points_awarded INT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_challenge UNIQUE(user_id, challenge_id)
);

-- 5. MAP SPOTS TABLE
CREATE TABLE IF NOT EXISTS map_spots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'park', 'ev', 'recycling', 'water'
  type TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  lat NUMERIC(10,7) NOT NULL,
  lng NUMERIC(10,7) NOT NULL,
  hours TEXT DEFAULT 'Open 24 Hours',
  items TEXT,
  icon TEXT DEFAULT '📍',
  verified BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. WASTE CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS waste_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  material TEXT NOT NULL,
  category TEXT NOT NULL, -- 'Plastic', 'Paper', 'Metal', 'Glass', 'E-Waste', 'Organic'
  recyclable BOOLEAN DEFAULT TRUE,
  disposal_method TEXT NOT NULL,
  co2_saved_per_item NUMERIC(10,4) DEFAULT 0.08,
  local_guidance TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}'
);

-- 7. WASTE SCANS TABLE
CREATE TABLE IF NOT EXISTS waste_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  detected_item TEXT NOT NULL,
  category TEXT NOT NULL,
  confidence NUMERIC(5,2) NOT NULL,
  disposal_method TEXT NOT NULL,
  co2_saved_kg NUMERIC(10,4) DEFAULT 0.08,
  model TEXT DEFAULT 'MobileNet-v2',
  verified BOOLEAN DEFAULT TRUE,
  scanned_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ACTIVITY SESSIONS (PEDOMETER) TABLE
CREATE TABLE IF NOT EXISTS activity_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'walk',
  steps INT NOT NULL DEFAULT 0,
  distance_km NUMERIC(10,4) NOT NULL DEFAULT 0,
  duration_seconds INT DEFAULT 0,
  co2_saved_kg NUMERIC(10,4) NOT NULL DEFAULT 0,
  points_earned INT NOT NULL DEFAULT 0,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. POINT TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  reason TEXT NOT NULL,
  reference_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------
-- SEED DATA
-- ----------------------------------------------------

-- Seed Challenges
INSERT INTO challenges (id, title, description, category, points, co2_target, icon, verification_type)
VALUES 
  ('walk', 'Walk 2 km', 'Walk or jog at least 2 km instead of driving', 'mobility', 50, 0.40, '🚶', 'pedometer'),
  ('bottle', 'Use Reusable Water Bottle', 'Avoid single-use plastic water bottles for the day', 'waste', 30, 0.20, '🥤', 'camera'),
  ('tree', 'Plant a Tree / Sapling', 'Plant a native tree or indoor sapling in your home or community', 'greenery', 200, 1.00, '🌳', 'camera'),
  ('waste', 'Segregate Household Waste', 'Separate wet organic waste from dry recyclables', 'recycling', 40, 0.30, '♻️', 'camera')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  points = EXCLUDED.points,
  co2_target = EXCLUDED.co2_target;

-- Seed Waste Categories Taxonomy
INSERT INTO waste_categories (id, name, material, category, recyclable, disposal_method, co2_saved_per_item, local_guidance, keywords)
VALUES
  ('plastic_bottle', 'PET Plastic Bottle', 'PET Polyethylene', 'Plastic', true, 'Rinse bottle, crush, and place in Yellow/Blue Plastic Recycling Bin.', 0.08, 'Mumbai BMC Blue Dry Waste Collection Bin.', ARRAY['water bottle', 'bottle', 'plastic', 'pop bottle', 'soda bottle']),
  ('paper_box', 'Cardboard & Paper Box', 'Cellulose Fiber', 'Paper', true, 'Flatten cardboard and drop off at Dry Waste Collection Hub.', 0.12, 'Keep dry before submitting to local Kabadiwala or recycling center.', ARRAY['carton', 'cardboard', 'paper', 'box', 'envelope']),
  ('metal_can', 'Aluminum / Steel Can', 'Aluminum / Tin', 'Metal', true, 'Rinse can to remove food particles and place in Dry Waste Bin.', 0.15, 'High recyclable value at local dry waste sorting stations.', ARRAY['can', 'tin', 'beer can', 'soda can', 'brass']),
  ('glass_container', 'Glass Bottle & Jar', 'Silica Glass', 'Glass', true, 'Clean thoroughly and place in designated Glass Recycling Station.', 0.10, 'Handle with care. Deposit at dry waste centers.', ARRAY['bottle', 'wine bottle', 'beer bottle', 'glass', 'jar']),
  ('e_waste', 'Electronics & Batteries', 'Lithium / Circuitry', 'E-Waste', true, 'Do NOT mix with normal waste. Deliver to authorized E-Waste drop center.', 0.50, 'Hand over to BMC authorized E-Waste collection kiosks.', ARRAY['battery', 'phone', 'laptop', 'charger', 'electronic'])
ON CONFLICT (id) DO NOTHING;

-- Seed Mumbai Map Spots
INSERT INTO map_spots (name, category, type, description, address, lat, lng, hours, items, icon, verified)
VALUES
  ('Sanjay Gandhi National Park (SGNP)', 'park', 'PARK & NATIONAL PARK', 'Protected green forest zone with cycling trails', 'Borivali East, Mumbai, Maharashtra 400066', 19.2312, 72.8656, '07:30 AM - 06:30 PM', 'Dense Forest, Cycling Trails, Native Flora', '🌲', true),
  ('Shivaji Park Promenade & Grounds', 'park', 'URBAN PARK & GROUND', 'Historic open green ground and tree canopy', 'Dadar West, Mumbai, Maharashtra 400028', 19.0269, 72.8378, 'Open 24 Hours', 'Walking Tracks, Tree Canopy', '🌲', true),
  ('Hanging Gardens & Kamala Nehru Park', 'park', 'BOTANICAL GARDENS', 'Topiary botanical gardens on Malabar Hill', 'Ridge Road, Malabar Hill, Mumbai 400006', 18.9566, 72.8052, '05:00 AM - 09:00 PM', 'Topiary Gardens, Arabian Sea Views', '🌲', true),
  ('Horniman Circle Heritage Garden', 'park', 'HERITAGE PARK', 'Historic circular green garden', 'Fort, South Mumbai, Maharashtra 400001', 18.9322, 72.8354, '06:00 AM - 08:30 PM', 'Historic Garden, Native Flora', '🌲', true),
  ('Tata Power EZ Charge Supercharger', 'ev', 'EV FAST CHARGING', '24/7 Fast EV Charging Station', 'BKC G-Block, Bandra Kurla Complex, Mumbai 400051', 19.0657, 72.8687, '24 Hours Open', 'CCS2 Fast Charging, Type-2 AC', '⚡', true),
  ('Ather Grid Fast Charger', 'ev', 'EV 2-WHEELER CHARGER', 'Fast electric 2-wheeler charger', 'Linking Road, Bandra West, Mumbai 400050', 19.0596, 72.8295, '08:00 AM - 11:00 PM', 'Fast Charging for 2W', '⚡', true),
  ('BMC Dry Waste Sorting Hub (Bandra)', 'recycling', 'DRY WASTE RECYCLING HUB', 'Municipal dry waste segregation center', 'SVT Road, Bandra West, Mumbai 400050', 19.0544, 72.8402, '09:00 AM - 06:00 PM', 'Plastics, Paper, Metals, E-Waste', '♻️', true),
  ('EcoRecycle E-Waste Drop Center', 'recycling', 'AUTHORIZED E-WASTE CENTER', 'Certified electronic waste recycling hub', 'Andheri Kurla Road, Marol, Mumbai 400059', 19.1136, 72.8697, '10:00 AM - 07:00 PM', 'Computers, Phones, Batteries', '♻️', true),
  ('AquaPure Refill Hub (Gateway of India)', 'water', 'HERITAGE REFILL KIOSK', 'Zero plastic mineral water refill kiosk', 'Apollo Bunder, Colaba, South Mumbai 400001', 18.9220, 72.8347, '06:00 AM - 10:00 PM', 'Filtered Cold Water Kiosk', '💧', true)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE eco_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

-- Profiles: Public read, User write self
CREATE POLICY "Public Profiles Read" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users Update Own Profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users Insert Own Profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Challenges & Waste Categories: Public read
CREATE POLICY "Public Read Challenges" ON challenges FOR SELECT USING (true);
CREATE POLICY "Public Read Waste Categories" ON waste_categories FOR SELECT USING (true);

-- Map Spots: Public read, Authenticated insert
CREATE POLICY "Public Read Map Spots" ON map_spots FOR SELECT USING (true);
CREATE POLICY "Authenticated Insert Map Spots" ON map_spots FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- User Data: User read/write own rows
CREATE POLICY "User Own Actions Select" ON eco_actions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User Own Actions Insert" ON eco_actions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User Own Completions Select" ON challenge_completions FOR SELECT USING (true); -- allow reading feed
CREATE POLICY "User Own Completions Insert" ON challenge_completions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User Own Scans Select" ON waste_scans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User Own Scans Insert" ON waste_scans FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User Own Sessions Select" ON activity_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User Own Sessions Insert" ON activity_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User Own Points Select" ON point_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User Own Points Insert" ON point_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
