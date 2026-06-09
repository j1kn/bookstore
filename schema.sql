-- ============================================================
-- LuminaBooks — Full Schema (run in Supabase SQL Editor)
-- ============================================================

-- 1. Create Profiles Table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
    avatar_url TEXT,
    -- Premium subscription fields (added for membership system)
    is_premium BOOLEAN DEFAULT false,
    subscription_type TEXT CHECK (subscription_type IN ('monthly', 'yearly')),
    subscription_start_date TIMESTAMPTZ,
    subscription_end_date TIMESTAMPTZ
);

-- If profiles table already exists, add the premium columns manually:
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_type TEXT CHECK (subscription_type IN ('monthly', 'yearly'));
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMPTZ;
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ;

-- Enable RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Create Subscriptions Table (audit log of all subscriptions)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    plan TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly')),
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    amount_paid NUMERIC NOT NULL
);

-- Enable RLS for Subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own subscriptions." ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own subscriptions." ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own subscriptions." ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all subscriptions." ON public.subscriptions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

-- 3. Create Books Table
CREATE TABLE IF NOT EXISTS public.books (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    price NUMERIC NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    cover_image TEXT,
    rating NUMERIC,
    stock INTEGER NOT NULL DEFAULT 0,
    is_bestseller BOOLEAN DEFAULT false,
    is_premium_only BOOLEAN DEFAULT false   -- NEW: marks premium-exclusive books
);

-- If books table already exists, add the column:
-- ALTER TABLE public.books ADD COLUMN IF NOT EXISTS is_premium_only BOOLEAN DEFAULT false;

-- Enable RLS for Books
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Books are viewable by everyone." ON public.books FOR SELECT USING (true);
CREATE POLICY "Admins can manage books." ON public.books FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "Authenticated users can update book stock." ON public.books FOR UPDATE TO authenticated USING (true);

-- 4. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    items JSONB NOT NULL,
    total NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own orders." ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own orders." ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users can insert orders." ON public.orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can view all orders." ON public.orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "Admins can update orders." ON public.orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

-- 5. Seed Mock Data for Books
INSERT INTO public.books (id, title, author, price, category, description, cover_image, rating, stock, is_bestseller, is_premium_only) VALUES
('1', 'The Midnight Library', 'Matt Haig', 24.99, 'Fiction', 'Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived.', 'https://picsum.photos/seed/library/400/600', 4.8, 12, true, false),
('2', 'Dune', 'Frank Herbert', 1560, 'Science Fiction', 'Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, heir to a noble family tasked with ruling an inhospitable world. This special premium edition includes an exclusive foreword and annotated chapters.', 'https://picsum.photos/seed/dune/400/600', 4.9, 5, true, true),
('3', 'Steve Jobs', 'Walter Isaacson', 2560, 'Biography', 'Based on more than forty interviews with Jobs conducted over two years — as well as interviews with more than a hundred family members, friends, adversaries, competitors, and colleagues. Premium members get exclusive bonus content.', 'https://picsum.photos/seed/jobs/400/600', 4.7, 8, false, true),
('4', 'Sapiens: A Brief History of Humankind', 'Yuval Noah Harari', 2240, 'History', 'Dr. Yuval Noah Harari spans the whole of human history. This premium collector edition includes exclusive author commentary and a curated reading guide.', 'https://picsum.photos/seed/sapiens/400/600', 4.9, 20, false, true),
('5', 'Thinking, Fast and Slow', 'Daniel Kahneman', 1680, 'Business', 'Daniel Kahneman, the renowned psychologist and winner of the Nobel Prize in Economics, takes us on a groundbreaking tour of the mind and explains the two systems that drive the way we think.', 'https://picsum.photos/seed/thinking/400/600', 4.6, 15, false, false),
('6', 'The Alchemist', 'Paulo Coelho', 1279, 'Philosophy', 'Combining magic, mysticism, wisdom and wonder into an inspiring tale of self-discovery, The Alchemist has become a modern classic.', 'https://picsum.photos/seed/alchemist/400/600', 4.8, 30, true, false)
ON CONFLICT (id) DO NOTHING;

-- 6. Auto-create profile trigger for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'name',
    new.email,
    'https://ui-avatars.com/api/?name=' || COALESCE(new.raw_user_meta_data->>'name', 'User') || '&background=6366f1&color=fff'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
