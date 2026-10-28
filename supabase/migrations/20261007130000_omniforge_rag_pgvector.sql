-- OmniForge RAG Vector Knowledge Store Migration
-- Embeddings powered by nomic-embed-text (dimension: 768)

CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Knowledge Documents Table
CREATE TABLE IF NOT EXISTS public.knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  domain TEXT NOT NULL,
  category TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'internal',
  source_uri TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Knowledge Chunks Table with vector(768)
CREATE TABLE IF NOT EXISTS public.knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(768) NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS knowledge_documents_domain_idx 
  ON public.knowledge_documents(domain);

CREATE INDEX IF NOT EXISTS knowledge_documents_category_idx 
  ON public.knowledge_documents(category);

CREATE INDEX IF NOT EXISTS knowledge_chunks_document_id_idx 
  ON public.knowledge_chunks(document_id);

CREATE INDEX IF NOT EXISTS knowledge_chunks_chunk_index_idx 
  ON public.knowledge_chunks(document_id, chunk_index);

-- HNSW Vector Index for Cosine Distance
CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_hnsw_idx 
  ON public.knowledge_chunks USING hnsw (embedding vector_cosine_ops);

-- 4. Row Level Security
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to knowledge documents" ON public.knowledge_documents;
CREATE POLICY "Allow public read access to knowledge documents"
  ON public.knowledge_documents FOR SELECT
  USING (id IS NOT NULL);

DROP POLICY IF EXISTS "Allow public read access to knowledge chunks" ON public.knowledge_chunks;
CREATE POLICY "Allow public read access to knowledge chunks"
  ON public.knowledge_chunks FOR SELECT
  USING (id IS NOT NULL);

DROP POLICY IF EXISTS "Allow authenticated users to insert knowledge documents" ON public.knowledge_documents;
CREATE POLICY "Allow authenticated users to insert knowledge documents"
  ON public.knowledge_documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow authenticated users to insert knowledge chunks" ON public.knowledge_chunks;
CREATE POLICY "Allow authenticated users to insert knowledge chunks"
  ON public.knowledge_chunks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow authenticated users to update knowledge documents" ON public.knowledge_documents;
CREATE POLICY "Allow authenticated users to update knowledge documents"
  ON public.knowledge_documents FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow authenticated users to delete knowledge documents" ON public.knowledge_documents;
CREATE POLICY "Allow authenticated users to delete knowledge documents"
  ON public.knowledge_documents FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- 5. RPC Similarity Search Function
CREATE OR REPLACE FUNCTION public.match_knowledge_chunks(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.3,
  match_count int DEFAULT 5,
  filter_domain text DEFAULT NULL,
  filter_category text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  chunk_index int,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.document_id,
    kc.chunk_index,
    kc.content,
    kc.metadata,
    (1 - (kc.embedding <=> query_embedding))::float as similarity
  FROM public.knowledge_chunks kc
  JOIN public.knowledge_documents kd ON kc.document_id = kd.id
  WHERE
    (filter_domain IS NULL OR kd.domain = filter_domain OR (kc.metadata->>'domain') = filter_domain)
    AND (filter_category IS NULL OR kd.category = filter_category OR (kc.metadata->>'category') = filter_category)
    AND (1 - (kc.embedding <=> query_embedding)) >= match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
