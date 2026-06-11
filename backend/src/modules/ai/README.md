# AI Module RAG DeepSeek

Module ini menjadi boundary AI/RAG untuk Epson Helpdesk. Chat/session/file tetap dikelola module lain, sedangkan folder ini menangani retrieval, embedding, prompt grounding, dan provider AI.

## Status Implementasi

- `generation.service.js`: generate jawaban via DeepSeek, lalu fallback ke mock agar chat tidak putus.
- `providers/deepseek.provider.js`: REST OpenAI-compatible `/chat/completions` untuk `deepseek-v4-flash`.
- `providers/gemini.provider.js`: Gemini text/vision generation dan embedding opsional.
- `settings.service.js`: menyimpan mode `hemat/normal`; provider dipilih otomatis per pesan.
- `prompt.service.js`: prompt grounding memakai context knowledge base dan meminta output Markdown rapi.
- `retrieval.service.js`: keyword RAG sebagai default full DeepSeek, dengan opsi semantic/hybrid bila embedding sengaja diaktifkan.
- `embedding.service.js`: nonaktif pada `RAG_MODE=keyword`; opsional via Gemini hanya untuk semantic RAG/backfill.

## Environment

```env
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_MODE=hemat
DEEPSEEK_TIMEOUT_MS=15000
DEEPSEEK_MAX_RETRIES=1
DEEPSEEK_TEMPERATURE=0.2
DEEPSEEK_MAX_OUTPUT_TOKENS=700
DEEPSEEK_HEMAT_MAX_OUTPUT_TOKENS=450
DEEPSEEK_NORMAL_MAX_OUTPUT_TOKENS=850
DEEPSEEK_THINKING=disabled

# Default full DeepSeek RAG
RAG_MODE=keyword

# Optional semantic RAG embedding/backfill bila benar-benar dibutuhkan
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash
GEMINI_VISION_MODEL=gemini-2.0-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
GEMINI_EMBEDDING_DIM=768

RAG_MIN_SIMILARITY=0.25
```

## Alur RAG

Pertanyaan user dicari ke knowledge base dengan keyword search saat `RAG_MODE=keyword`. Mode ini adalah default untuk full DeepSeek dan tidak memakai embedding Gemini.

Jika nanti ingin semantic search, ubah `RAG_MODE=semantic` atau `RAG_MODE=hybrid`, isi `GEMINI_API_KEY`, lalu jalankan backfill embedding.

Context knowledge base yang relevan masuk ke prompt DeepSeek. Jika tidak ada context, AI tetap memberi langkah troubleshooting umum yang aman dan frontend menandai jawaban sebagai tidak berbasis knowledge base.

Lampiran gambar tetap disimpan di chat/ticket. Jika ada lampiran gambar, backend otomatis memakai Gemini Vision; tanpa gambar backend memakai DeepSeek.

## Mode Hemat / Normal

Admin dapat mengatur mode lewat `GET/PATCH /api/admin/ai-settings` atau panel Analytics.

- Teks/RAG otomatis memakai DeepSeek.
- Lampiran gambar otomatis memakai Gemini Vision.
- `hemat`: token lebih kecil, retry 0, jawaban lebih padat.
- `normal`: token lebih besar, retry 1, jawaban lebih lengkap untuk kasus teknis.

## Backfill Embedding

Jalankan bila ingin mengisi embedding knowledge lama:

```bash
npm run rag:backfill
```

Jika `RAG_MODE=keyword`, backfill dilewati dan RAG tetap berjalan dengan keyword search.
