# AI Module Handoff

Module ini disiapkan sebagai boundary untuk AI/RAG engineering.

Backend engineer tetap menjaga:

- auth
- chat session persistence
- file upload metadata
- tickets
- reports
- admin APIs

AI engineer dapat melanjutkan di folder ini:

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

TODO utama:

- Implement semantic retrieval dengan Gemini embeddings + pgvector.
- Generate embedding saat knowledge document create/update.
- Backfill embedding untuk knowledge chunks lama.
- Tambahkan model config, timeout, retry, safety settings, dan observability.
- Evaluasi prompt grounding untuk lingkungan manufaktur Epson.
