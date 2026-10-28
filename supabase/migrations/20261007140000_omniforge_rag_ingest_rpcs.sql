-- Validated RPCs for Ingesting Knowledge Documents and Chunks securely
-- Enables server/client ingestion via validated RPCs without compromising RLS or exposing service keys

CREATE OR REPLACE FUNCTION public.store_knowledge_document(
  p_id uuid,
  p_title text,
  p_description text,
  p_domain text,
  p_category text,
  p_source_type text DEFAULT 'internal',
  p_source_uri text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_id IS NOT NULL THEN
    v_id := p_id;
    INSERT INTO public.knowledge_documents (id, title, description, domain, category, source_type, source_uri, metadata, updated_at)
    VALUES (v_id, p_title, p_description, p_domain, p_category, p_source_type, p_source_uri, p_metadata, now())
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      domain = EXCLUDED.domain,
      category = EXCLUDED.category,
      source_type = EXCLUDED.source_type,
      source_uri = EXCLUDED.source_uri,
      metadata = EXCLUDED.metadata,
      updated_at = now();
  ELSE
    SELECT id INTO v_id FROM public.knowledge_documents WHERE title = p_title LIMIT 1;
    IF v_id IS NOT NULL THEN
      UPDATE public.knowledge_documents SET
        description = p_description,
        domain = p_domain,
        category = p_category,
        source_type = p_source_type,
        source_uri = p_source_uri,
        metadata = p_metadata,
        updated_at = now()
      WHERE id = v_id;
    ELSE
      INSERT INTO public.knowledge_documents (title, description, domain, category, source_type, source_uri, metadata, updated_at)
      VALUES (p_title, p_description, p_domain, p_category, p_source_type, p_source_uri, p_metadata, now())
      RETURNING id INTO v_id;
    END IF;
  END IF;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.store_knowledge_chunk(
  p_document_id uuid,
  p_chunk_index int,
  p_content text,
  p_embedding vector(768),
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.knowledge_chunks (document_id, chunk_index, content, embedding, metadata, created_at)
  VALUES (p_document_id, p_chunk_index, p_content, p_embedding, p_metadata, now())
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_knowledge_chunks(
  p_document_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.knowledge_chunks WHERE document_id = p_document_id;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_knowledge_document(
  p_document_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.knowledge_chunks WHERE document_id = p_document_id;
  DELETE FROM public.knowledge_documents WHERE id = p_document_id;
  RETURN true;
END;
$$;
