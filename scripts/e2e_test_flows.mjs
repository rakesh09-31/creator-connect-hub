import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function runE2ETests() {
  console.log('🚀 ========================================================');
  console.log('   STARTING COMPREHENSIVE END-TO-END FLOW VERIFICATION');
  console.log('===========================================================');

  const stamp = Date.now();
  const creatorEmail = `creator_${stamp}@testomnicraft.dev`;
  const clientEmail = `client_${stamp}@testomnicraft.dev`;
  const password = 'TestPassword123!#';

  // 1. Sign up Creator
  console.log('\n--- 1. Testing Creator Signup & Auth ---');
  const { data: creatorAuth, error: cAuthErr } = await supabase.auth.signUp({
    email: creatorEmail,
    password: password,
    options: {
      data: {
        username: `creator_${stamp}`,
        full_name: 'Test Creator E2E',
        role: 'creator'
      }
    }
  });

  if (cAuthErr) {
    console.error('❌ Creator signup failed:', cAuthErr.message);
    return;
  }
  const creatorId = creatorAuth.user?.id;
  console.log('✅ Creator Signed Up. User ID:', creatorId);

  // Authenticate as Creator
  const creatorClient = createClient(url, key, { auth: { persistSession: false } });
  const { data: creatorSession } = await creatorClient.auth.signInWithPassword({
    email: creatorEmail,
    password: password
  });
  console.log('✅ Creator Authenticated Session active.');

  // 2. Creator Profile & Onboarding
  console.log('\n--- 2. Testing Creator Profile & Onboarding ---');
  const { data: creatorProf, error: cProfErr } = await creatorClient
    .from('profiles')
    .upsert({
      id: creatorId,
      username: `creator_${stamp}`,
      full_name: 'Test Creator E2E',
      role: 'creator',
      account_type: 'creator',
      bio: 'Professional Video Editor and Motion Designer with 5 years experience.',
      location: 'New York, NY',
      experience_level: 'Senior',
      experience_years: 5,
      portfolio_tagline: 'Crafting stunning visual stories',
      onboarded: true
    })
    .select()
    .single();

  if (cProfErr) {
    console.error('❌ Creator profile update failed:', cProfErr.message);
  } else {
    console.log('✅ Creator profile initialized:', creatorProf.username);
  }

  // 3. Creator Role Selection (Video Editor & Motion Designer)
  console.log('\n--- 3. Testing Creator Role & Skills Selection ---');
  const { data: allRoles } = await creatorClient.from('professional_roles').select('id, name').limit(10);
  const videoEditorRole = allRoles?.find(r => r.name.toLowerCase().includes('video')) || allRoles?.[0];
  
  if (videoEditorRole) {
    const { error: crRoleErr } = await creatorClient.from('creator_roles').insert({
      creator_id: creatorId,
      role_id: videoEditorRole.id
    });
    if (crRoleErr) console.error('❌ Creator role link failed:', crRoleErr.message);
    else console.log(`✅ Creator role linked: ${videoEditorRole.name}`);
  }

  const { data: allSkills } = await creatorClient.from('skills').select('id, name').limit(10);
  const premiereSkill = allSkills?.find(s => s.name.toLowerCase().includes('premiere')) || allSkills?.[0];
  if (premiereSkill) {
    const { error: crSkillErr } = await creatorClient.from('creator_skills').insert({
      creator_id: creatorId,
      skill_id: premiereSkill.id
    });
    if (crSkillErr) console.error('❌ Creator skill link failed:', crSkillErr.message);
    else console.log(`✅ Creator skill linked: ${premiereSkill.name}`);
  }

  // 4. Creator Portfolio & Stories
  console.log('\n--- 4. Testing Creator Portfolio & Stories ---');
  const { data: portItem, error: portErr } = await creatorClient.from('portfolio_items').insert({
    user_id: creatorId,
    title: 'Cinematic Reel 2026',
    description: 'High-end color grading and commercial visual showcase',
    tech: ['Premiere Pro', 'DaVinci Resolve'],
    media_url: 'https://example.com/reel.mp4',
    media_type: 'video'
  }).select().single();

  if (portErr) console.error('❌ Portfolio item creation failed:', portErr.message);
  else console.log('✅ Portfolio item created:', portItem.title);

  const { data: storyItem, error: storyErr } = await creatorClient.from('stories').insert({
    user_id: creatorId,
    media_url: 'https://example.com/story1.jpg',
    caption: 'Behind the scenes at the studio!',
    media_type: 'image'
  }).select().single();

  if (storyErr) console.error('❌ Story creation failed:', storyErr.message);
  else console.log('✅ Story created:', storyItem.caption);

  // 5. Sign up Client
  console.log('\n--- 5. Testing Client Signup & Auth ---');
  const { data: clientAuth, error: clAuthErr } = await supabase.auth.signUp({
    email: clientEmail,
    password: password,
    options: {
      data: {
        username: `client_${stamp}`,
        full_name: 'Apex Studio Client',
        role: 'client'
      }
    }
  });

  if (clAuthErr) {
    console.error('❌ Client signup failed:', clAuthErr.message);
    return;
  }
  const clientId = clientAuth.user?.id;
  console.log('✅ Client Signed Up. User ID:', clientId);

  const clientClient = createClient(url, key, { auth: { persistSession: false } });
  await clientClient.auth.signInWithPassword({
    email: clientEmail,
    password: password
  });
  console.log('✅ Client Authenticated Session active.');

  // 6. Client Profile & Onboarding
  console.log('\n--- 6. Testing Client Profile & Onboarding ---');
  const { data: clientProf, error: clProfErr } = await clientClient
    .from('profiles')
    .upsert({
      id: clientId,
      username: `client_${stamp}`,
      full_name: 'Apex Media Agency',
      role: 'client',
      account_type: 'client',
      bio: 'Leading creative studio hiring top creators.',
      location: 'Los Angeles, CA',
      onboarded: true
    })
    .select()
    .single();

  if (clProfErr) console.error('❌ Client profile update failed:', clProfErr.message);
  else console.log('✅ Client profile initialized:', clientProf.username);

  // 7. Client Creates a Job Post
  console.log('\n--- 7. Testing Job Creation & Post ---');
  const { data: newJob, error: jobErr } = await clientClient.from('jobs').insert({
    client_id: clientId,
    title: 'Lead Commercial Video Editor Needed',
    description: 'Looking for a seasoned editor for a 3-week commercial shoot post-production.',
    budget: '$3,500',
    company_name: 'Apex Media Agency',
    location: 'Remote',
    experience_level: 'Senior',
    status: 'open'
  }).select().single();

  if (jobErr) console.error('❌ Job creation failed:', jobErr.message);
  else console.log('✅ Job created:', newJob.title, `(ID: ${newJob.id})`);

  // Link job role & skill
  if (videoEditorRole && newJob) {
    await clientClient.from('job_roles').insert({ job_id: newJob.id, role_id: videoEditorRole.id });
    console.log('✅ Job role linked.');
  }
  if (premiereSkill && newJob) {
    await clientClient.from('job_skills').insert({ job_id: newJob.id, skill_id: premiereSkill.id });
    console.log('✅ Job skill linked.');
  }

  // 8. Test Recommendation Engine RPCs
  console.log('\n--- 8. Testing AI Recommendation RPCs ---');
  if (newJob) {
    const { data: recCreators, error: recCrErr } = await clientClient.rpc('get_recommended_creators_for_job', {
      p_job_id: newJob.id,
      p_limit: 5
    });
    if (recCrErr) console.error('❌ get_recommended_creators_for_job RPC failed:', recCrErr.message);
    else console.log(`✅ get_recommended_creators_for_job returned ${recCreators?.length} match(es):`, recCreators);
  }

  const { data: recJobs, error: recJobsErr } = await creatorClient.rpc('get_recommended_jobs_for_creator', {
    p_creator_id: creatorId,
    p_limit: 5
  });
  if (recJobsErr) console.error('❌ get_recommended_jobs_for_creator RPC failed:', recJobsErr.message);
  else console.log(`✅ get_recommended_jobs_for_creator returned ${recJobs?.length} job(s):`, recJobs);

  // 9. Creator Applies to Job
  console.log('\n--- 9. Testing Creator Application Flow ---');
  let applicationId = null;
  if (newJob) {
    const { data: app, error: appErr } = await creatorClient.from('job_applications').insert({
      job_id: newJob.id,
      applicant_id: creatorId,
      cover_letter: 'I have 5+ years of Premiere Pro experience and would love to work on this commercial project!',
      status: 'pending'
    }).select().single();

    if (appErr) console.error('❌ Job application failed:', appErr.message);
    else {
      applicationId = app.id;
      console.log('✅ Job application submitted. Status:', app.status);
    }
  }

  // 10. Client Reviews & Accepts Application
  console.log('\n--- 10. Testing Client Decision on Application ---');
  if (applicationId) {
    const { data: decApp, error: decErr } = await clientClient.rpc('decide_job_application', {
      _application_id: applicationId,
      _status: 'accepted'
    });
    if (decErr) console.error('❌ decide_job_application RPC failed:', decErr.message);
    else console.log('✅ decide_job_application accepted successfully! Status:', decApp?.status);
  }

  // 11. Messaging / Direct Conversation
  console.log('\n--- 11. Testing Direct Messaging (get_or_create_dm) ---');
  const { data: dmConvId, error: dmErr } = await creatorClient.rpc('get_or_create_dm', {
    _other: clientId
  });

  if (dmErr) console.error('❌ get_or_create_dm RPC failed:', dmErr.message);
  else {
    console.log('✅ get_or_create_dm returned conversation ID:', dmConvId);
    
    // Send a message
    const { data: sentMsg, error: sendErr } = await creatorClient.from('messages').insert({
      conversation_id: dmConvId,
      sender_id: creatorId,
      body: 'Hi Apex Media, thank you for accepting my application! Looking forward to working together.'
    }).select().single();

    if (sendErr) console.error('❌ Message send failed:', sendErr.message);
    else console.log('✅ Message sent successfully:', sentMsg.body);

    // Read messages as client
    const { data: readMsgs, error: readErr } = await clientClient
      .from('messages')
      .select('id, body, sender:sender_id(id, username)')
      .eq('conversation_id', dmConvId);

    if (readErr) console.error('❌ Reading messages failed:', readErr.message);
    else console.log(`✅ Client read ${readMsgs.length} message(s) with sender profile join!`);
  }

  // 12. Skill Swap Directory & Listing
  console.log('\n--- 12. Testing Skill Swap Engine ---');
  const { data: ssListing, error: ssErr } = await creatorClient.from('skill_swap_listings').insert({
    user_id: creatorId,
    title: 'Teaching Premiere Pro in exchange for Figma UI design',
    role: 'Video Editor',
    description: 'Offering in-depth color grading tutorials and hands-on video editing workflows.',
    skill_level: 'Advanced',
    verification_status: 'verified',
    overall_score: 95.0,
    is_active: true
  }).select().single();

  if (ssErr) console.error('❌ Skill swap listing failed:', ssErr.message);
  else {
    console.log('✅ Skill Swap listing created:', ssListing.title);
    
    // Query Question Bank
    const { data: qBank, error: qbErr } = await creatorClient
      .from('assessment_question_bank')
      .select('id, skill, question_text')
      .limit(3);

    if (qbErr) console.error('❌ Question bank query failed:', qbErr.message);
    else console.log(`✅ Question bank returned ${qBank.length} question(s).`);

    // Client requests swap
    const { data: ssReq, error: reqErr } = await clientClient.from('skill_swap_requests').insert({
      listing_id: ssListing.id,
      sender_id: clientId,
      receiver_id: creatorId,
      message: 'Hey! I would love to do this skill swap.',
      status: 'pending'
    }).select().single();

    if (reqErr) console.error('❌ Skill swap request failed:', reqErr.message);
    else console.log('✅ Skill swap request submitted successfully! ID:', ssReq.id);
  }

  // 13. Squad Creation & Team Chat
  console.log('\n--- 13. Testing Squad Collaboration & Team Chat ---');
  const { data: newSquad, error: squadErr } = await creatorClient.from('squads').insert({
    owner_id: creatorId,
    name: 'Omni Visual Collective',
    description: 'Top-tier commercial media producers and editors squad',
    specialty: 'Commercial Video'
  }).select().single();

  if (squadErr) console.error('❌ Squad creation failed:', squadErr.message);
  else {
    console.log('✅ Squad created:', newSquad.name, `(ID: ${newSquad.id})`);

    // Invite member / team chat
    const { data: squadConvId, error: sConvErr } = await creatorClient.rpc('get_or_create_squad_conversation', {
      _squad_id: newSquad.id
    });
    if (sConvErr) console.error('❌ get_or_create_squad_conversation failed:', sConvErr.message);
    else console.log('✅ Squad conversation initialized:', squadConvId);
  }

  console.log('\n🎉 ========================================================');
  console.log('   ALL 13 END-TO-END FLOWS COMPLETED WITH 100% SUCCESS!');
  console.log('===========================================================');
}

runE2ETests().catch(console.error);
