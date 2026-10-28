/**
 * Seed RAG Knowledge Corpus into Supabase pgvector
 *
 * Runs the ingestion pipeline:
 * 1. Checks Ollama nomic-embed-text health
 * 2. Ingests all 13 authoritative documents from INITIAL_KNOWLEDGE_CORPUS
 * 3. Tests retrieval via match_knowledge_chunks RPC
 */

import { checkEmbeddingHealth } from "../src/lib/omniforge/rag/embeddings";
import { INITIAL_KNOWLEDGE_CORPUS, seedInitialCorpusIfEmpty } from "../src/lib/omniforge/rag/corpus";
import { retrieveKnowledge } from "../src/lib/omniforge/rag/retrieval";

async function main() {
  console.log("==================================================");
  console.log("SEEDING OMNIFORGE RAG KNOWLEDGE CORPUS (13 DOCS)");
  console.log("==================================================\n");

  // Step 1: Health Check
  console.log("Step 1: Checking Ollama nomic-embed-text health...");
  const health = await checkEmbeddingHealth(10000);
  console.log("Ollama Health Result:", health);
  if (!health.available) {
    console.error("FATAL: Ollama embedding model nomic-embed-text is not available!");
    console.error("Please run: ollama pull nomic-embed-text");
    process.exit(1);
  }

  console.log(`Verified Embedding Model: ${health.model}, Dimension: ${health.dimension} (Latency: ${health.latencyMs}ms)\n`);

  // Step 2: Seed Corpus
  console.log(`Step 2: Ingesting ${INITIAL_KNOWLEDGE_CORPUS.length} knowledge documents...`);
  const seedResult = await seedInitialCorpusIfEmpty(true);
  console.log(`Seeding complete! Documents processed: ${seedResult.seeded}, Skipped: ${seedResult.skipped}\n`);

  // Step 3: Test Knowledge Retrieval
  console.log("Step 3: Testing retrieval query: 'What does a cinematographer do?'...");
  const searchResult = await retrieveKnowledge({
    query: "What does a cinematographer do?",
    topK: 3,
    similarityThreshold: 0.40,
  });

  console.log(`Retrieved ${searchResult.totalChunks} chunks in ${searchResult.embeddingMs + searchResult.retrievalMs}ms:`);
  for (const c of searchResult.chunks) {
    console.log(`- [${c.document_title} > ${c.section}] Similarity: ${(c.similarity * 100).toFixed(1)}%`);
    console.log(`  Preview: "${c.content.slice(0, 160).replace(/\n/g, " ")}..."\n`);
  }

  // Step 4: Test Technical Retrieval
  console.log("Step 4: Testing retrieval query: 'What is REST in full stack development?'...");
  const techResult = await retrieveKnowledge({
    query: "What is REST in full stack development?",
    topK: 3,
    similarityThreshold: 0.40,
  });

  console.log(`Retrieved ${techResult.totalChunks} chunks in ${techResult.embeddingMs + techResult.retrievalMs}ms:`);
  for (const c of techResult.chunks) {
    console.log(`- [${c.document_title} > ${c.section}] Similarity: ${(c.similarity * 100).toFixed(1)}%`);
    console.log(`  Preview: "${c.content.slice(0, 160).replace(/\n/g, " ")}..."\n`);
  }

  console.log("==================================================");
  console.log("RAG INGESTION & RETRIEVAL VERIFIED SUCCESSFULLY!");
  console.log("==================================================");
}

main().catch((err) => {
  console.error("FATAL Error seeding corpus:", err);
  process.exit(1);
});
