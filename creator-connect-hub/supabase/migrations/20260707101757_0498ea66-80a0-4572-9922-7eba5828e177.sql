-- Notifications system
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  actor_id UUID,
  type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX notifications_user_created_idx ON public.notifications (user_id, created_at DESC);
CREATE INDEX notifications_user_unread_idx ON public.notifications (user_id) WHERE read = false;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete their own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Helper: insert notification (SECURITY DEFINER so triggers can write regardless of who acts)
CREATE OR REPLACE FUNCTION public.create_notification(
  _user_id UUID, _actor_id UUID, _type TEXT,
  _entity_type TEXT, _entity_id UUID, _data JSONB
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF _user_id IS NULL OR _user_id = _actor_id THEN RETURN; END IF;
  INSERT INTO public.notifications (user_id, actor_id, type, entity_type, entity_id, data)
  VALUES (_user_id, _actor_id, _type, _entity_type, _entity_id, COALESCE(_data, '{}'::jsonb));
END; $$;

-- Trigger: new follower
CREATE OR REPLACE FUNCTION public.notify_new_follow()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.create_notification(NEW.following_id, NEW.follower_id, 'follow', 'user', NEW.follower_id, '{}'::jsonb);
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_follow AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_follow();

-- Trigger: post like
CREATE OR REPLACE FUNCTION public.notify_post_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_author UUID;
BEGIN
  SELECT author_id INTO v_author FROM public.posts WHERE id = NEW.post_id;
  PERFORM public.create_notification(v_author, NEW.user_id, 'like', 'post', NEW.post_id, '{}'::jsonb);
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_like AFTER INSERT ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_post_like();

-- Trigger: post comment
CREATE OR REPLACE FUNCTION public.notify_post_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_author UUID;
BEGIN
  SELECT author_id INTO v_author FROM public.posts WHERE id = NEW.post_id;
  PERFORM public.create_notification(v_author, NEW.user_id, 'comment', 'post', NEW.post_id,
    jsonb_build_object('preview', LEFT(NEW.body, 140)));
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_comment AFTER INSERT ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_post_comment();

-- Trigger: hire request (creator gets notified on new; client gets notified on status change)
CREATE OR REPLACE FUNCTION public.notify_hire_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.create_notification(NEW.creator_id, NEW.client_id, 'hire_request', 'creator_request', NEW.id,
      jsonb_build_object('subject', NEW.subject));
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.create_notification(NEW.client_id, NEW.creator_id,
      CASE WHEN NEW.status = 'accepted' THEN 'hire_accepted'
           WHEN NEW.status = 'rejected' THEN 'hire_rejected'
           ELSE 'hire_updated' END,
      'creator_request', NEW.id, jsonb_build_object('subject', NEW.subject, 'status', NEW.status));
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_hire_ins AFTER INSERT ON public.creator_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_hire_request();
CREATE TRIGGER trg_notify_hire_upd AFTER UPDATE ON public.creator_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_hire_request();