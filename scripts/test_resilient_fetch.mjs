import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function testResilientFetch() {
  console.log('--- Testing Resilient Fetch ---');

  // 1. Fetch listings
  const { data: listings, error: lErr } = await supabase
    .from('skill_swap_listings')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  console.log('Listings fetched:', { count: listings?.length, error: lErr?.message });

  if (listings && listings.length > 0) {
    const userIds = [...new Set(listings.map(l => l.user_id).filter(Boolean))];
    const listingIds = listings.map(l => l.id);

    console.log('Found userIds:', userIds, 'listingIds:', listingIds);

    // 2. Fetch profiles
    const { data: profiles, error: pErr } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .in('id', userIds);
    console.log('Profiles fetched:', { count: profiles?.length, error: pErr?.message });

    // 3. Fetch teach skills
    const { data: teachSkills, error: tsErr } = await supabase
      .from('skill_swap_listing_teach_skills')
      .select('*')
      .in('listing_id', listingIds);
    console.log('Teach skills fetched:', { count: teachSkills?.length, error: tsErr?.message });

    // 4. Fetch learn skills
    const { data: learnSkills, error: lsErr } = await supabase
      .from('skill_swap_listing_learn_skills')
      .select('*')
      .in('listing_id', listingIds);
    console.log('Learn skills fetched:', { count: learnSkills?.length, error: lsErr?.message });

    // 5. Fetch specialties
    const { data: specialties, error: spErr } = await supabase
      .from('skill_swap_specialties')
      .select('*')
      .in('listing_id', listingIds);
    console.log('Specialties fetched:', { count: specialties?.length, error: spErr?.message });
  }
}

testResilientFetch();
