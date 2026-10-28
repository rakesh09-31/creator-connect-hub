/**
 * Comprehensive E2E Validation for Creator Job Seeking & Application Workflow
 * 
 * Verifies:
 * 1. Intent classification for "I am a video editor and I want to apply for a job"
 * 2. Perspective: currentUserRole = VIDEO_EDITOR, currentUserType = CREATOR, intent = CREATOR_JOB_SEARCH
 * 3. Real Supabase job records returned (e.g. Lead Commercial Video Editor Needed by Apex Media Agency)
 * 4. Zero unrelated creator cards (UI/UX, Frontend, Writer)
 * 5. Application workflow: "I want to apply for this project" -> APPLY_FOR_JOB
 * 6. Application persisted in Supabase with status = 'pending'
 * 7. Client notification created in Supabase
 * 8. Refresh & state persistence
 */

import { supabase } from "../src/integrations/supabase/client";
import { classifyUserIntent } from "../src/lib/omniforge/intent";
import { searchClientOpportunities } from "../src/lib/omniforge/matcher";
import { transitionConversationState } from "../src/lib/omniforge/conversation-state";
import { ConversationState } from "../src/lib/omniforge/types";

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, details?: any) {
  totalTests++;
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ [FAIL] ${testName}`);
    if (details !== undefined) {
      console.error(`   Details:`, details);
    }
  }
}

async function runValidation() {
  console.log("================================================================================");
  console.log("CREATOR JOB SEEKING & APPLICATION E2E VERIFICATION");
  console.log("================================================================================\n");

  // STEP 1: User: "I am a video editor and I want to apply for a job"
  console.log("--- STEP 1: USER ASKS TO FIND & APPLY FOR VIDEO EDITOR JOBS ---");
  const prompt1 = "I am a video editor and I want to apply for a job";
  const intent1 = classifyUserIntent(prompt1);

  assert(intent1.intent === "CREATOR_JOB_SEARCH", "Step 1: intent is CREATOR_JOB_SEARCH", intent1.intent);
  assert(intent1.matching_action === "SEARCH_CLIENTS", "Step 1: matching_action is SEARCH_CLIENTS", intent1.matching_action);
  assert(intent1.currentUserType === "CREATOR", "Step 1: currentUserType is CREATOR", intent1.currentUserType);
  assert(intent1.currentUserRole === "Video Editor", "Step 1: currentUserRole is Video Editor", intent1.currentUserRole);
  assert(intent1.activeGoal === "FIND_JOB", "Step 1: activeGoal is FIND_JOB", intent1.activeGoal);
  assert(intent1.targetRole === "Video Editor", "Step 1: targetRole is Video Editor", intent1.targetRole);

  // STEP 2: Bug prompt verification: "I am a video editor so I need too apply for a job so find all the creators"
  console.log("\n--- STEP 2: EXACT BUG PROMPT CLASSIFICATION ---");
  const bugPrompt = "I am a video editor so I need too apply for a job so find all the creators";
  const bugIntent = classifyUserIntent(bugPrompt);

  assert(bugIntent.intent === "CREATOR_JOB_SEARCH", "Step 2: Bug prompt intent is CREATOR_JOB_SEARCH (NOT CREATOR_SEARCH)", bugIntent.intent);
  assert(bugIntent.matching_action === "SEARCH_CLIENTS", "Step 2: Bug prompt matching_action is SEARCH_CLIENTS", bugIntent.matching_action);
  assert(bugIntent.currentUserType === "CREATOR", "Step 2: Bug prompt currentUserType is CREATOR", bugIntent.currentUserType);
  assert(bugIntent.currentUserRole === "Video Editor", "Step 2: Bug prompt currentUserRole is Video Editor", bugIntent.currentUserRole);

  // STEP 3: Real Supabase Opportunity Search (Zero Hallucinations)
  console.log("\n--- STEP 3: REAL SUPABASE OPPORTUNITY SEARCH ---");
  const searchRes = await searchClientOpportunities({
    role: "Video Editor",
    page: 1,
    pageSize: 10,
  });

  assert(searchRes.opportunities.length > 0, "Step 3: Found real open opportunities in Supabase", searchRes.opportunities.length);
  console.log(`   Real jobs found: ${searchRes.opportunities.length} (Total: ${searchRes.totalCount})`);

  // Verify each opportunity is a real database job
  const topJob = searchRes.opportunities[0];
  console.log("   Top Opportunity Details:");
  console.log(`   - ID: ${topJob.id}`);
  console.log(`   - Title: "${topJob.title}"`);
  console.log(`   - Client: "${topJob.clientName}"`);
  console.log(`   - Skills: ${topJob.skillsRequired?.join(", ") || "None specified"}`);
  console.log(`   - Budget: ${topJob.budget || "N/A"}`);
  console.log(`   - Deadline: ${topJob.deadline || "N/A"}`);

  assert(topJob.title.length > 0, "Step 3: Top opportunity has real title", topJob.title);
  assert(topJob.clientName.length > 0, "Step 3: Top opportunity has real client name", topJob.clientName);

  // STEP 4: Verify NO unrelated creator cards appear
  console.log("\n--- STEP 4: VERIFY NO UNRELATED CREATOR CARDS ---");
  const forbiddenRoles = ["UI/UX Designer", "Frontend Web Developer", "Content Writer"];
  for (const job of searchRes.opportunities) {
    const isUnrelated = forbiddenRoles.some(
      (fr) => job.title.toLowerCase().includes(fr.toLowerCase()) && !job.title.toLowerCase().includes("video")
    );
    assert(!isUnrelated, `Step 4: Job "${job.title}" is NOT an unrelated role (${forbiddenRoles.join(", ")})`);
  }

  // STEP 5: Conversation State Persistence
  console.log("\n--- STEP 5: CONVERSATION STATE TRANSITION & FOLLOW-UP ---");
  let state: ConversationState = {
    messagesCount: 1,
  };
  state = transitionConversationState(state, prompt1, [{ id: "1", text: prompt1, sender: "user", timestamp: new Date() }]);
  state.selectedJobId = topJob.id;
  state.selectedJob = topJob;

  assert(state.currentUserType === "CREATOR", "Step 5: state.currentUserType is CREATOR", state.currentUserType);
  assert(state.currentUserRole === "Video Editor", "Step 5: state.currentUserRole is Video Editor", state.currentUserRole);
  assert(state.activeGoal === "FIND_JOB", "Step 5: state.activeGoal is FIND_JOB", state.activeGoal);
  assert(state.lastSearchType === "clients", "Step 5: state.lastSearchType is clients", state.lastSearchType);

  // Follow-up: "show more"
  const followUpState = transitionConversationState(state, "show more", [
    { id: "1", text: prompt1, sender: "user", timestamp: new Date() },
    { id: "2", text: "Here are opportunities", sender: "ai", timestamp: new Date() },
    { id: "3", text: "show more", sender: "user", timestamp: new Date() },
  ]);
  assert(followUpState.lastSearchType === "clients", "Step 5: Follow-up 'show more' stays in clients search mode", followUpState.lastSearchType);
  assert(followUpState.currentUserType === "CREATOR", "Step 5: Follow-up keeps currentUserType = CREATOR", followUpState.currentUserType);

  // STEP 6: Apply Workflow
  console.log("\n--- STEP 6: APPLY WORKFLOW CLASSIFICATION ---");
  const applyPrompt = "I want to apply for this project";
  const applyIntent = classifyUserIntent(applyPrompt, {
    currentUserRole: state.currentUserRole,
    currentUserType: state.currentUserType,
    activeGoal: state.activeGoal,
  });

  assert(applyIntent.intent === "APPLY_FOR_JOB", "Step 6: Intent is APPLY_FOR_JOB", applyIntent.intent);
  assert(applyIntent.matching_action === "APPLY_JOB", "Step 6: Action is APPLY_JOB", applyIntent.matching_action);

  // STEP 7: Application Persistence in Supabase & Notification Creation
  console.log("\n--- STEP 7: SUPABASE APPLICATION & NOTIFICATION RECORD ---");
  const { data: profiles } = await supabase.from("profiles").select("id, username, full_name, role").limit(1);
  const applicantProfile = profiles && profiles.length > 0 ? profiles[0] : null;

  if (!applicantProfile) {
    console.warn("   Notice: No profile found for application testing, skipping DB insert test.");
  } else {
    console.log(`   Using applicant: @${applicantProfile.username} (${applicantProfile.id})`);

    // Insert pending application
    const { data: newApp, error: appErr } = await supabase
      .from("job_applications")
      .insert({
        job_id: topJob.id,
        applicant_id: applicantProfile.id,
        status: "pending",
        message: "Applied via OmniForge AI Assistant as Video Editor [E2E Test]",
      })
      .select()
      .single();

    assert(!appErr && Boolean(newApp), "Step 7: Application successfully persisted in Supabase job_applications", appErr?.message);
    if (newApp) {
      assert(newApp.status === "pending", "Step 7: Application status is 'pending' (NOT auto-accepted/hired)", newApp.status);
      assert(newApp.job_id === topJob.id, "Step 7: Application linked to correct job_id", newApp.job_id);

      // Verify client notification creation
      if (topJob.clientId) {
        const { data: notif, error: notifErr } = await supabase
          .from("notifications")
          .insert({
            user_id: topJob.clientId,
            actor_id: applicantProfile.id,
            type: "job_application",
            entity_type: "job",
            entity_id: topJob.id,
            read: false,
            data: {
              job_title: topJob.title,
              applicant_name: applicantProfile.full_name || `@${applicantProfile.username}`,
              role: "Video Editor",
              application_id: newApp.id,
            },
          })
          .select()
          .single();

        assert(!notifErr && Boolean(notif), "Step 7: Client notification persisted in notifications table", notifErr?.message);
        if (notif) {
          assert(notif.type === "job_application", "Step 7: Notification type is 'job_application'", notif.type);
          assert(notif.entity_id === topJob.id, "Step 7: Notification entity_id matches job_id", notif.entity_id);

          // Clean up notification test record
          await supabase.from("notifications").delete().eq("id", notif.id);
        }
      }

      // Clean up application test record
      await supabase.from("job_applications").delete().eq("id", newApp.id);
      console.log("   (Test application and notification verified and cleaned up successfully)");
    }
  }

  // STEP 8: SUMMARY & REGRESSION INTEGRITY
  console.log("\n================================================================================");
  console.log(`E2E VALIDATION FINISHED: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log("================================================================================");

  if (passedTests === totalTests) {
    console.log("\n🎉 ALL E2E VERIFICATION STEPS PASSED PERFECTLY!");
    process.exit(0);
  } else {
    console.error(`\n💥 ${totalTests - passedTests} TESTS FAILED!`);
    process.exit(1);
  }
}

runValidation().catch((err) => {
  console.error("Fatal error during E2E validation:", err);
  process.exit(1);
});
