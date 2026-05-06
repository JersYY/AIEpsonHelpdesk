# AI Module RAG Gemini

Module ini menjadi boundary AI/RAG untuk Epson AI Helpdesk. Chat/session/file tetap dikelola module lain, sedangkan folder ini menangani retrieval, embedding, prompt grounding, dan provider Gemini.

Backend engineer tetap menjaga:

- auth
- chat session persistence
- file upload metadata
- tickets
- reports
- admin APIs

File utama:

```txt
src/modules/ai/
  ai.service.js
  rag.service.js
  retrieval.service.js
  embedding.service.js
  generation.service.js
  prompt.service.js
  providers/
    gemini.provider.js
```

## Status Implementasi

- `embedding.service.js`: generate Gemini embedding untuk query dan dokumen, validasi dimensi, simpan ke pgvector.
- `retrieval.service.js`: semantic search pgvector sebagai prioritas, fallback ke full-text/keyword/recent chunks.
- `generation.service.js`: generate jawaban Gemini dengan fallback mock agar chat tidak putus.
- `prompt.service.js`: prompt grounding memakai context knowledge base, source, score, dan retrieval mode.
- `providers/gemini.provider.js`: REST Gemini generateContent dan embedContent dengan timeout, retry, safety settings, dan model dari env.

## Environment

```env
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
GEMINI_EMBEDDING_DIM=768
GEMINI_TIMEOUT_MS=15000
GEMINI_MAX_RETRIES=1
GEMINI_TEMPERATURE=0.2
GEMINI_MAX_OUTPUT_TOKENS=700
GEMINI_SAFETY_THRESHOLD=BLOCK_MEDIUM_AND_ABOVE
RAG_MIN_SIMILARITY=0.25
```

## Alur Self-Learning RAG

Saat admin membuat atau mengubah `KnowledgeDocument`, backend membuat chunk dan mencoba mengisi embedding setiap chunk. Setelah itu pertanyaan user dibuat embedding query, dicocokkan dengan pgvector, lalu context paling relevan dipakai untuk prompt Gemini.

Jika `GEMINI_API_KEY` kosong, request Gemini gagal, pgvector belum siap, atau belum ada embedding, service otomatis fallback ke keyword search dan mock answer.

## Backfill

Jalankan untuk mengisi embedding knowledge lama:

```bash
npm run rag:backfill
```

Opsi:

```bash
npm run rag:backfill -- --batch-size=10 --max-chunks=200
```
