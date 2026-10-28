/**
 * OmniForge RAG Ingestion Pipeline
 *
 * DOCUMENT
 *    ↓
 * TEXT EXTRACTION & CLEANING
 *    ↓
 * SEMANTIC CHUNKING
 *    ↓
 * OLLAMA EMBEDDING (nomic-embed-text, 768 dim)
 *    ↓
 * SUPABASE PGVECTOR (knowledge_documents & knowledge_chunks)
 */

import { supabase } from "@/integrations/supabase/client";
import { generateEmbedding, generateBatchEmbeddings } from "./embeddings";
import { KnowledgeDomain, KnowledgeChunk, KnowledgeChunkMetadata } from "./types";

export interface DocumentInput {
  id?: string;
  title: string;
  description?: string;
  domain: KnowledgeDomain;
  category: string;
  source_type?: "internal" | "documentation" | "standard" | "reference";
  source_uri?: string;
  metadata?: Record<string, any>;
  content: string;
}

export interface ChunkOptions {
  maxChunkChars?: number;
  overlapChars?: number;
}

/**
 * Normalizes and extracts clean text from raw document input.
 */
export function cleanDocumentText(content: string): string {
  if (!content) return "";
  return content
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, "  ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Splits document text semantically by markdown sections (##, ###) and paragraphs.
 * Ensures chunks stay within size limits while preserving context and section headers.
 */
export function chunkDocument(
  doc: {
    id: string;
    title: string;
    domain: KnowledgeDomain;
    category: string;
    source?: string;
    content: string;
  },
  options: ChunkOptions = {}
): Array<Omit<KnowledgeChunk, "embedding" | "created_at">> {
  const maxChars = options.maxChunkChars || 700;
  const overlap = options.overlapChars || 100;
  const cleaned = cleanDocumentText(doc.content);

  if (!cleaned) return [];

  const chunks: Array<Omit<KnowledgeChunk, "embedding" | "created_at">> = [];

  // Split by markdown sections first (e.g. ## or ###)
  const sectionRegex = /(?:^|\n)(#{1,4}\s+[^\n]+)/g;
  const sectionSplits: Array<{ title: string; body: string }> = [];

  let lastIndex = 0;
  let currentHeader = doc.title;
  let match: RegExpExecArray | null;

  while ((match = sectionRegex.exec(cleaned)) !== null) {
    const matchStart = match.index;
    if (matchStart > lastIndex) {
      const sectionBody = cleaned.slice(lastIndex, matchStart).trim();
      if (sectionBody) {
        sectionSplits.push({ title: currentHeader, body: sectionBody });
      }
    }
    currentHeader = match[1].replace(/^#{1,4}\s+/, "").trim();
    lastIndex = sectionRegex.lastIndex;
  }

  // Trailing section
  if (lastIndex < cleaned.length) {
    const trailingBody = cleaned.slice(lastIndex).trim();
    if (trailingBody) {
      sectionSplits.push({ title: currentHeader, body: trailingBody });
    }
  }

  // If no markdown sections found, treat whole text as a single section
  if (sectionSplits.length === 0) {
    sectionSplits.push({ title: doc.title, body: cleaned });
  }

  let globalChunkIndex = 0;

  for (const section of sectionSplits) {
    const paragraphs = section.body
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);

    let currentChunkText = `### ${section.title}\n\n`;

    for (const paragraph of paragraphs) {
      if ((currentChunkText + paragraph).length <= maxChars) {
        currentChunkText += (currentChunkText.endsWith("\n\n") ? "" : "\n\n") + paragraph;
      } else {
        // If current chunk has substantial content, push it
        if (currentChunkText.trim().length > 30) {
          chunks.push({
            id: `${doc.id}_chk_${globalChunkIndex}`,
            document_id: doc.id,
            chunk_index: globalChunkIndex++,
            content: currentChunkText.trim(),
            metadata: {
              domain: doc.domain,
              category: doc.category,
              document_id: doc.id,
              document_title: doc.title,
              section: section.title,
              chunk_index: globalChunkIndex - 1,
              source: doc.source || "internal",
            },
          });
        }

        // If paragraph itself is excessively large, split by sentences
        if (paragraph.length > maxChars) {
          const sentences = paragraph.split(/(?<=[.!?])\s+/);
          let sentenceChunk = `### ${section.title}\n\n`;

          for (const s of sentences) {
            if ((sentenceChunk + s).length <= maxChars) {
              sentenceChunk += " " + s;
            } else {
              if (sentenceChunk.trim().length > 30) {
                chunks.push({
                  id: `${doc.id}_chk_${globalChunkIndex}`,
                  document_id: doc.id,
                  chunk_index: globalChunkIndex++,
                  content: sentenceChunk.trim(),
                  metadata: {
                    domain: doc.domain,
                    category: doc.category,
                    document_id: doc.id,
                    document_title: doc.title,
                    section: section.title,
                    chunk_index: globalChunkIndex - 1,
                    source: doc.source || "internal",
                  },
                });
              }
              const carry = sentenceChunk.slice(-overlap).trim();
              sentenceChunk = `### ${section.title}\n\n${carry} ${s}`;
            }
          }

          if (sentenceChunk.trim().length > 30) {
            currentChunkText = sentenceChunk.trim();
          } else {
            currentChunkText = `### ${section.title}\n\n`;
          }
        } else {
          // Normal paragraph overflow, carry over overlap
          const overlapTail = currentChunkText.slice(-overlap).trim();
          currentChunkText = `### ${section.title}\n\n${overlapTail ? overlapTail + "\n\n" : ""}${paragraph}`;
        }
      }
    }

    // Flush remaining content for this section
    if (currentChunkText.trim().length > 30) {
      chunks.push({
        id: `${doc.id}_chk_${globalChunkIndex}`,
        document_id: doc.id,
        chunk_index: globalChunkIndex++,
        content: currentChunkText.trim(),
        metadata: {
          domain: doc.domain,
          category: doc.category,
          document_id: doc.id,
          document_title: doc.title,
          section: section.title,
          chunk_index: globalChunkIndex - 1,
          source: doc.source || "internal",
        },
      });
    }
  }

  return chunks;
}

/**
 * Stores embedding chunks in the Supabase pgvector store using the validated store_knowledge_chunk RPC.
 */
export async function storeChunks(
  chunks: Array<{
    document_id: string;
    chunk_index: number;
    content: string;
    embedding: number[];
    metadata: KnowledgeChunkMetadata;
  }>,
  concurrency: number = 4
): Promise<number> {
  if (chunks.length === 0) return 0;

  for (let i = 0; i < chunks.length; i += concurrency) {
    const batch = chunks.slice(i, i + concurrency);
    const promises = batch.map(async (c) => {
      const { error } = await (supabase as any).rpc("store_knowledge_chunk", {
        p_document_id: c.document_id,
        p_chunk_index: c.chunk_index,
        p_content: c.content,
        p_embedding: c.embedding,
        p_metadata: c.metadata,
      });

      if (error) {
        throw new Error(`[RAG Ingestion] store_knowledge_chunk RPC error: ${error.message}`);
      }
    });

    await Promise.all(promises);
  }

  return chunks.length;
}

/**
 * Ingests a complete knowledge document into Supabase pgvector:
 * 1. Upserts document in `knowledge_documents` via store_knowledge_document RPC
 * 2. Cleans text & extracts semantic chunks
 * 3. Generates 768-dim embeddings via Ollama nomic-embed-text
 * 4. Inserts chunks via store_knowledge_chunk RPC
 */
export async function ingestDocument(doc: DocumentInput): Promise<{ documentId: string; chunkCount: number }> {
  const cleanContent = cleanDocumentText(doc.content);

  if (!cleanContent) {
    throw new Error("[RAG Ingestion] Document content cannot be empty.");
  }

  const isUuid = Boolean(doc.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(doc.id));

  // 1. Upsert document in knowledge_documents via validated RPC
  const { data: finalDocId, error: docError } = await (supabase as any).rpc("store_knowledge_document", {
    p_id: isUuid ? doc.id : null,
    p_title: doc.title,
    p_description: doc.description || doc.title,
    p_domain: doc.domain,
    p_category: doc.category,
    p_source_type: doc.source_type || "internal",
    p_source_uri: doc.source_uri || null,
    p_metadata: doc.metadata || {},
  });

  if (docError || !finalDocId) {
    throw new Error(`[RAG Ingestion] Failed to store knowledge document: ${docError?.message || "No ID returned"}`);
  }

  // 2. Delete any old chunks for this document
  await (supabase as any).rpc("delete_knowledge_chunks", {
    p_document_id: finalDocId,
  });

  // 3. Chunk document
  const rawChunks = chunkDocument({
    id: finalDocId,
    title: doc.title,
    domain: doc.domain,
    category: doc.category,
    source: doc.source_type || "internal",
    content: cleanContent,
  });

  if (rawChunks.length === 0) {
    return { documentId: finalDocId, chunkCount: 0 };
  }

  // 4. Generate embeddings via Ollama
  const texts = rawChunks.map((c) => c.content);
  const embeddings = await generateBatchEmbeddings(texts, 3);

  // 5. Store chunks with embeddings via RPC
  const chunksToStore = rawChunks.map((c, idx) => ({
    document_id: finalDocId,
    chunk_index: c.chunk_index,
    content: c.content,
    embedding: embeddings[idx],
    metadata: c.metadata,
  }));

  const insertedCount = await storeChunks(chunksToStore);

  return { documentId: finalDocId, chunkCount: insertedCount };
}

/**
 * Deletes a document and all its associated chunks from pgvector via delete_knowledge_document RPC.
 */
export async function deleteDocument(documentId: string): Promise<boolean> {
  const { error } = await (supabase as any).rpc("delete_knowledge_document", {
    p_document_id: documentId,
  });

  if (error) {
    throw new Error(`[RAG Ingestion] Failed to delete document: ${error.message}`);
  }

  return true;
}

/**
 * Reindexes an existing document with updated or re-extracted content.
 */
export async function reindexDocument(documentId: string, updatedContent?: string): Promise<number> {
  const { data: doc, error: fetchErr } = await (supabase as any)
    .from("knowledge_documents")
    .select("*")
    .eq("id", documentId)
    .single();

  if (fetchErr || !doc) {
    throw new Error(`[RAG Ingestion] Document ${documentId} not found for reindexing.`);
  }

  const contentToUse = updatedContent || doc.description || doc.title;
  const result = await ingestDocument({
    id: doc.id,
    title: doc.title,
    description: doc.description,
    domain: doc.domain,
    category: doc.category,
    source_type: doc.source_type,
    source_uri: doc.source_uri,
    metadata: doc.metadata,
    content: contentToUse,
  });

  return result.chunkCount;
}

// Re-export generateEmbedding for external consumers
export { generateEmbedding };
