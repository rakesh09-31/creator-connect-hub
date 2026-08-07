GRANT SELECT, INSERT, DELETE ON public.stories TO authenticated;
GRANT ALL ON public.stories TO service_role;
GRANT SELECT, INSERT ON public.story_views TO authenticated;
GRANT ALL ON public.story_views TO service_role;

DROP POLICY IF EXISTS apps_update_own ON public.job_applications;
CREATE POLICY apps_update_own
ON public.job_applications
FOR UPDATE
TO authenticated
USING (
  status = 'pending'
  AND (
    auth.uid() = applicant_id
    OR EXISTS (
      SELECT 1 FROM public.squads s
      WHERE s.id = job_applications.squad_id
        AND s.owner_id = auth.uid()
    )
  )
)
WITH CHECK (
  status = 'withdrawn'
  AND (
    auth.uid() = applicant_id
    OR EXISTS (
      SELECT 1 FROM public.squads s
      WHERE s.id = job_applications.squad_id
        AND s.owner_id = auth.uid()
    )
  )
);

REVOKE ALL ON FUNCTION public.decide_job_application(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.decide_job_application(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.decide_job_application(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decide_job_application(uuid, text) TO service_role;