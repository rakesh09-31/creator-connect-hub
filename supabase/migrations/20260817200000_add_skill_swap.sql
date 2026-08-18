-- 1. Create skill_swap_listings table
CREATE TABLE IF NOT EXISTS public.skill_swap_listings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    description text,
    learning_mode text,
    availability text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Trigger to update updated_at on skill_swap_listings
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER tr_skill_swap_listings_updated_at
    BEFORE UPDATE ON public.skill_swap_listings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.skill_swap_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active skill swap listings"
    ON public.skill_swap_listings FOR SELECT
    TO authenticated
    USING (is_active = true OR auth.uid() = user_id);

CREATE POLICY "Users can create their own skill swap listings"
    ON public.skill_swap_listings FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skill swap listings"
    ON public.skill_swap_listings FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own skill swap listings"
    ON public.skill_swap_listings FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);


-- 2. Create skill_swap_listing_teach_skills table
CREATE TABLE IF NOT EXISTS public.skill_swap_listing_teach_skills (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    listing_id uuid REFERENCES public.skill_swap_listings(id) ON DELETE CASCADE NOT NULL,
    skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
    skill_level text,
    verification_status text DEFAULT 'self_declared',
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(listing_id, skill_id)
);

ALTER TABLE public.skill_swap_listing_teach_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view teach skills"
    ON public.skill_swap_listing_teach_skills FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can manage teach skills for their listings"
    ON public.skill_swap_listing_teach_skills FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.skill_swap_listings WHERE id = listing_id AND user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.skill_swap_listings WHERE id = listing_id AND user_id = auth.uid()));


-- 3. Create skill_swap_listing_learn_skills table
CREATE TABLE IF NOT EXISTS public.skill_swap_listing_learn_skills (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    listing_id uuid REFERENCES public.skill_swap_listings(id) ON DELETE CASCADE NOT NULL,
    skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
    desired_level text,
    requirement text,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(listing_id, skill_id)
);

ALTER TABLE public.skill_swap_listing_learn_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view learn skills"
    ON public.skill_swap_listing_learn_skills FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can manage learn skills for their listings"
    ON public.skill_swap_listing_learn_skills FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.skill_swap_listings WHERE id = listing_id AND user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.skill_swap_listings WHERE id = listing_id AND user_id = auth.uid()));


-- 4. Create skill_swap_requests table
CREATE TABLE IF NOT EXISTS public.skill_swap_requests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    sender_listing_id uuid REFERENCES public.skill_swap_listings(id) ON DELETE CASCADE NOT NULL,
    receiver_listing_id uuid REFERENCES public.skill_swap_listings(id) ON DELETE CASCADE NOT NULL,
    message text,
    match_score integer,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    responded_at timestamp with time zone
);

CREATE TRIGGER tr_skill_swap_requests_updated_at
    BEFORE UPDATE ON public.skill_swap_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.skill_swap_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sender can view their sent requests"
    ON public.skill_swap_requests FOR SELECT
    TO authenticated
    USING (auth.uid() = sender_id);

CREATE POLICY "Receiver can view their received requests"
    ON public.skill_swap_requests FOR SELECT
    TO authenticated
    USING (auth.uid() = receiver_id);

CREATE POLICY "Sender can create requests"
    ON public.skill_swap_requests FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = sender_id AND sender_id != receiver_id);

CREATE POLICY "Sender can cancel pending requests"
    ON public.skill_swap_requests FOR UPDATE
    TO authenticated
    USING (auth.uid() = sender_id AND status = 'pending')
    WITH CHECK (auth.uid() = sender_id AND status IN ('cancelled'));

CREATE POLICY "Receiver can accept or reject pending requests"
    ON public.skill_swap_requests FOR UPDATE
    TO authenticated
    USING (auth.uid() = receiver_id AND status = 'pending')
    WITH CHECK (auth.uid() = receiver_id AND status IN ('accepted', 'rejected'));
