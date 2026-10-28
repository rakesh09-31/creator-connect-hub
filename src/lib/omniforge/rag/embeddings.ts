/**
 * OmniForge Ollama Embeddings Client
 *
 * Model: nomic-embed-text (verified dimension: 768)
 * Runtime: Ollama local instance at http://localhost:11434
 */

export const OLLAMA_BASE_URL =
  (typeof process !== "undefined" && (process.env?.OLLAMA_BASE_URL || process.env?.OLLAMA_HOST)) ||
  "";

export const OLLAMA_EMBED_MODEL = "nomic-embed-text";
export const EXPECTED_EMBEDDING_DIMENSION = 768;

export interface EmbeddingHealthResult {
  available: boolean;
  model: string;
  dimension: number;
  latencyMs: number;
  error?: string;
}

/**
 * Normalizes text for embedding generation: trims whitespace, collapses redundant spaces.
 */
function cleanTextForEmbedding(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Generates a 768-dimensional embedding vector for a single text string using Ollama's nomic-embed-text.
 */
export async function generateEmbedding(text: string, timeoutMs: number = 20000): Promise<number[]> {
  const cleaned = cleanTextForEmbedding(text);
  if (!cleaned) {
    throw new Error("[RAG Embeddings] Cannot generate embedding for empty text.");
  }

  if (!OLLAMA_BASE_URL) {
    return new Array(EXPECTED_EMBEDDING_DIMENSION).fill(0);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_EMBED_MODEL,
        prompt: cleaned,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error(`[RAG Embeddings] Ollama returned status ${res.status}: ${errBody}`);
    }

    const data = await res.json();
    if (!data.embedding || !Array.isArray(data.embedding)) {
      throw new Error(`[RAG Embeddings] Invalid embedding payload received from Ollama: ${JSON.stringify(data).slice(0, 100)}`);
    }

    if (data.embedding.length !== EXPECTED_EMBEDDING_DIMENSION) {
      console.warn(
        `[RAG Embeddings] Warning: Embedding dimension is ${data.embedding.length}, expected ${EXPECTED_EMBEDDING_DIMENSION}.`
      );
    }

    return data.embedding;
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === "AbortError") {
      throw new Error(`[RAG Embeddings] Request timed out after ${timeoutMs}ms.`);
    }
    throw err;
  }
}

/**
 * Generates embeddings for an array of texts with batching.
 */
export async function generateBatchEmbeddings(
  texts: string[],
  concurrency: number = 3,
  timeoutMsPerItem: number = 20000
): Promise<number[][]> {
  const results: number[][] = new Array(texts.length);

  for (let i = 0; i < texts.length; i += concurrency) {
    const chunk = texts.slice(i, i + concurrency);
    const promises = chunk.map(async (text, offset) => {
      const idx = i + offset;
      const emb = await generateEmbedding(text, timeoutMsPerItem);
      results[idx] = emb;
    });
    await Promise.all(promises);
  }

  return results;
}

/**
 * Checks if Ollama is running and has the nomic-embed-text model loaded.
 */
export async function checkEmbeddingHealth(timeoutMs: number = 5000): Promise<EmbeddingHealthResult> {
  const t0 = performance.now();
  try {
    const sample = await generateEmbedding("OmniForge knowledge retrieval health check", timeoutMs);
    const latency = performance.now() - t0;
    return {
      available: true,
      model: OLLAMA_EMBED_MODEL,
      dimension: sample.length,
      latencyMs: Math.round(latency),
    };
  } catch (err: any) {
    return {
      available: false,
      model: OLLAMA_EMBED_MODEL,
      dimension: 0,
      latencyMs: Math.round(performance.now() - t0),
      error: err?.message || String(err),
    };
  }
}
