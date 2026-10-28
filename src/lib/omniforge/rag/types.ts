/**
 * OmniForge RAG (Retrieval-Augmented Generation) Type Definitions
 *
 * Grounded Knowledge Architecture for Ollama (Qwen3:4B + nomic-embed-text) + Supabase pgvector.
 */

export type KnowledgeDomain =
  | "FILMMAKING"
  | "SOFTWARE_ENGINEERING"
  | "AI_ML"
  | "WEB_DEVELOPMENT"
  | "DESIGN"
  | "CONTENT_CREATION"
  | "PROJECT_MANAGEMENT"
  | "CAREER_DEVELOPMENT"
  | "CREATOR_ECONOMY"
  | "OMNICRAFT"
  | (string & {});

export interface KnowledgeDocument {
  id: string;
  title: string;
  description: string;
  domain: KnowledgeDomain;
  category: string;
  source_type: "internal" | "documentation" | "standard" | "reference";
  source_uri?: string;
  metadata: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface KnowledgeChunkMetadata {
  domain: KnowledgeDomain;
  category: string;
  document_id: string;
  document_title: string;
  section?: string;
  chunk_index: number;
  source?: string;
  [key: string]: any;
}

export interface KnowledgeChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  embedding?: number[];
  metadata: KnowledgeChunkMetadata;
  created_at?: string;
}

export interface KnowledgeRetrievalQuery {
  query: string;
  domain?: KnowledgeDomain;
  category?: string;
  topK?: number;
  similarityThreshold?: number;
}

export interface RetrievedChunkResult {
  id: string;
  document_id: string;
  document_title: string;
  domain: string;
  category: string;
  section: string;
  content: string;
  similarity: number;
  metadata: Record<string, any>;
}

export interface RetrievedKnowledgeResult {
  chunks: RetrievedChunkResult[];
  formattedContext: string;
  sources: Array<{
    id: string;
    title: string;
    domain: string;
    category: string;
    section?: string;
    similarity: number;
  }>;
  totalChunks: number;
  embeddingMs: number;
  retrievalMs: number;
}

export type ResponseSource =
  | "FAST_PATH"
  | "SUPABASE"
  | "RAG"
  | "OLLAMA"
  | "SUPABASE_RAG"
  | "SUPABASE_OLLAMA"
  | "RAG_OLLAMA"
  | "HYBRID";

export interface OmniForgeTelemetry {
  intent_detection_ms: number;
  database_ms?: number;
  embedding_ms?: number;
  retrieval_ms?: number;
  ollama_ms?: number;
  response_composition_ms?: number;
  total_ms: number;
  execution_mode: "FAST_PATH" | "SUPABASE" | "RAG" | "AI" | "TOOL" | "HYBRID";
  database_used: boolean;
  rag_used: boolean;
  llm_used: boolean;
  responseSource: ResponseSource;
}
