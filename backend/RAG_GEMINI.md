# Integrasi RAG dengan Gemini

Dokumen ini menjelaskan cara mengaktifkan dan mengembangkan RAG Gemini untuk backend Epson AI Helpdesk.

## Ringkasan Arsitektur

Alur RAG di backend ini:

```txt
User message / defect image
  -> ChatService.sendMessage()
  -> src/modules/ai/RagService.searchRelevantChunks()
  -> KnowledgeChunk dari PostgreSQL
  -> src/modules/ai/RagService.generateAnswer()
  -> Gemini generateContent atau mock fallback
  -> Simpan ChatMessage USER dan AI
```

File utama:

```txt
src/modules/chat/chat.service.js
src/modules/chat/rag.service.js
src/modules/ai/ai.service.js
src/modules/ai/rag.service.js
src/modules/ai/retrieval.service.js
src/modules/ai/embedding.service.js
src/modules/ai/generation.service.js
src/modules/ai/prompt.service.js
src/modules/ai/providers/gemini.provider.js
src/modules/knowledge/knowledge.service.js
prisma/schema.prisma
```

Status saat ini:

- RAG sudah berjalan dengan semantic pgvector sebagai prioritas dan fallback keyword/full-text search.
- Gemini text/image answer sudah disiapkan di `src/modules/ai/providers/gemini.provider.js` dengan model configurable, timeout, retry terbatas, dan safety settings.
- Jika `GEMINI_API_KEY` kosong, backend otomatis pakai mock response.
- Embedding `KnowledgeChunk.embedding` nullable, tetapi otomatis diisi saat knowledge create/update jika `GEMINI_API_KEY` tersedia.
- Script backfill embedding tersedia di `prisma/backfill-embeddings.js`.
- `src/modules/chat/rag.service.js` hanya compatibility wrapper ke `src/modules/ai/rag.service.js`.

## AI Engineer Handoff

Boundary AI/RAG ada di folder:

```txt
src/modules/ai/
```

Isi folder:

```txt
ai.service.js
rag.service.js
retrieval.service.js
embedding.service.js
generation.service.js
prompt.service.js
providers/
  gemini.provider.js
README.md
```

Tanggung jawab module:

| File | Tanggung Jawab | Status |
|---|---|---|
| `ai.service.js` | Facade untuk call AI dari module lain | Aktif |
| `rag.service.js` | Orkestrasi retrieval + prompt + generation | Aktif |
| `retrieval.service.js` | Search knowledge chunks | Semantic pgvector + fallback keyword |
| `embedding.service.js` | Generate embedding query/document | Gemini embedContent aktif |
| `generation.service.js` | Generate answer dengan provider atau mock fallback | Aktif |
| `prompt.service.js` | Build prompt grounding | Aktif |
| `providers/gemini.provider.js` | Call Gemini generateContent/embedContent | Aktif dengan config, timeout, retry |

Yang masih bisa dikembangkan:

- Tambahkan evaluasi jawaban dan threshold confidence.
- Tambahkan observability internal yang lebih lengkap tanpa mencatat full prompt sensitif.
- Tambahkan rate limit per user untuk endpoint chat.
- Tambahkan evaluasi dataset pertanyaan-jawaban untuk mengukur retrieval quality.

## Sumber Resmi

- Gemini generateContent API: https://ai.google.dev/api/generate-content
- Gemini API overview dan authentication: https://ai.google.dev/api
- Gemini embeddings API: https://ai.google.dev/api/embeddings
- Gemini safety guidance: https://ai.google.dev/gemini-api/docs/safety-guidance

## Mode 1: Aktifkan Gemini untuk Generate Answer

Mode ini paling cepat karena kode backend sudah mendukungnya.

### 1. Buat API Key

Buat API key dari Google AI Studio:

```txt
https://aistudio.google.com/app/apikey
```

### 2. Isi `.env`

Tambahkan key di `backend/.env`:

```env
GEMINI_API_KEY=isi_api_key_google_ai_studio
```

Jangan isi API key di frontend, Postman collection public, README public, atau commit git.

### 3. Restart Backend

```bash
npm run dev
```

### 4. Test via Postman

Login user:

```txt
POST {{base_url}}/api/auth/login
```

Body:

```json
{
  "email": "operator.assembly@epson.local",
  "password": "Password123!"
}
```

Send chat:

```txt
POST {{base_url}}/api/chat/message
Authorization: Bearer {{user_token}}
```

Body:

```json
{
  "message": "Printer output has banding lines after maintenance. What should I check first?"
}
```

Jika Gemini aktif, response akan berisi:

```json
{
  "success": true,
  "data": {
    "provider": "gemini"
  }
}
```

Jika masih mock:

```json
{
  "success": true,
  "data": {
    "provider": "mock"
  }
}
```

Penyebab umum masih mock:

- `GEMINI_API_KEY` kosong.
- Backend belum direstart setelah `.env` diubah.
- API key invalid, disabled, atau quota habis.
- Request Gemini gagal dan service fallback ke mock agar chat tetap usable.

## Mode 2: RAG Semantic dengan Gemini Embeddings + pgvector

Mode ini membuat retrieval lebih akurat. Bukan hanya keyword, tetapi similarity search berbasis embedding.

Target alur:

```txt
KnowledgeDocument create/update
  -> split content jadi KnowledgeChunk
  -> generate embedding dengan Gemini embedding model
  -> simpan ke KnowledgeChunk.embedding

User message
  -> generate query embedding
  -> pgvector similarity search
  -> top chunks masuk ke prompt Gemini
  -> answer grounded by retrieved chunks
```

## Environment Tambahan yang Disarankan

Tambahkan optional env:

```env
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

Catatan:

- Gemini docs memberi contoh `gemini-2.0-flash` untuk generation.
- Gemini embeddings mendukung `outputDimensionality`; dimensi umum yang praktis untuk pgvector adalah `768`, `1536`, atau `3072`.
- Gunakan satu dimensi yang konsisten untuk semua chunk dan query.

## Update Schema pgvector

Schema saat ini:

```prisma
embedding Unsupported("vector")?
```

Untuk semantic search production, lebih baik kunci dimensinya di SQL migration:

```sql
ALTER TABLE "KnowledgeChunk"
ALTER COLUMN "embedding" TYPE vector(768);
```

Index yang disarankan:

```sql
CREATE INDEX IF NOT EXISTS knowledge_chunk_embedding_hnsw_idx
ON "KnowledgeChunk"
USING hnsw ("embedding" vector_cosine_ops);
```

Jika pakai dimensi selain `768`, sesuaikan semua call embedding dan tipe vector.

## Gemini Embedding Service

Service sudah tersedia di:

```txt
src/modules/ai/embedding.service.js
```

Implementasi REST ada di `src/modules/ai/providers/gemini.provider.js` dan dipanggil dari `EmbeddingService.embedText()`. Struktur request mengikuti pola:

```js
import { env } from "../../config/env.js";

const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";
const EMBEDDING_DIM = Number(process.env.GEMINI_EMBEDDING_DIM || 768);

await EmbeddingService.embedText(chunkText, {
  taskType: "RETRIEVAL_DOCUMENT",
  title: documentTitle,
});
```

Task type:

- Pakai `RETRIEVAL_DOCUMENT` untuk chunk knowledge base.
- Pakai `RETRIEVAL_QUERY` untuk pertanyaan user.

## Simpan Embedding ke KnowledgeChunk

Di `KnowledgeService.create()` dan `KnowledgeService.update()`, setelah chunk dibuat:

```js
const embedding = await GeminiEmbeddingService.embedText(
  chunkText,
  "RETRIEVAL_DOCUMENT",
  documentTitle,
);

const vector = `[${embedding.join(",")}]`;

await prisma.$executeRaw`
  UPDATE "KnowledgeChunk"
  SET embedding = ${vector}::vector
  WHERE id = ${chunkId}
`;
```

Untuk seed existing data, gunakan script backfill:

```txt
prisma/backfill-embeddings.js
```

Command:

```bash
npm run rag:backfill
```

Alur backfill:

```txt
find KnowledgeChunk where embedding is null
for each chunk:
  generate embedding with RETRIEVAL_DOCUMENT
  update embedding column
```

## Search Relevant Chunks dengan pgvector

Ganti atau prioritaskan logic di `src/modules/ai/retrieval.service.js`:

```js
const queryEmbedding = await GeminiEmbeddingService.embedText(
  query,
  "RETRIEVAL_QUERY",
);

const vector = `[${queryEmbedding.join(",")}]`;

const rows = await prisma.$queryRaw`
  SELECT
    kc.id,
    kc."documentId",
    kc."chunkText",
    kc.metadata,
    kd.title AS "documentTitle",
    kd.source,
    1 - (kc.embedding <=> ${vector}::vector) AS score
  FROM "KnowledgeChunk" kc
  JOIN "KnowledgeDocument" kd ON kd.id = kc."documentId"
  WHERE kc.embedding IS NOT NULL
  ORDER BY kc.embedding <=> ${vector}::vector
  LIMIT ${limit}
`;
```

Tetap pertahankan fallback keyword search jika:

- `GEMINI_API_KEY` kosong.
- Embedding query gagal.
- Belum ada chunk yang punya embedding.
- pgvector query error.

## Prompt Grounding untuk Gemini

Prompt sebaiknya memaksa model menjawab berdasarkan context:

```txt
You are Epson AI Helpdesk Assistant for internal manufacturing troubleshooting.
Answer only from the provided knowledge base context when possible.
If the context is insufficient, say what information is missing.
Give concise, safe, step-by-step troubleshooting guidance.
Do not expose API keys, internal secrets, or database details.

User message:
{{message}}

Knowledge context:
{{retrieved_chunks}}
```

Tambahkan metadata chunk ke prompt jika dibutuhkan:

```txt
[1] Print Quality Banding Troubleshooting
Source: Internal SOP PQ-001
Content: ...
```

## Image Defect dengan Gemini

Backend saat ini mendukung upload image dan mengirim image ke Gemini lewat `inline_data`:

```json
{
  "inline_data": {
    "mime_type": "image/jpeg",
    "data": "base64..."
  }
}
```

Flow demo:

```txt
POST /api/files/upload
POST /api/chat/message with imageId
```

Gemini akan menerima:

- prompt troubleshooting
- retrieved knowledge chunks
- image defect sebagai input visual

## Safety dan Security

Wajib:

- Simpan `GEMINI_API_KEY` hanya di backend `.env`.
- Jangan return `GEMINI_API_KEY` ke response API.
- Jangan commit `.env`.
- Tambahkan billing alert dan quota limit di Google Cloud/AI Studio.
- Log error Gemini secukupnya; jangan log full prompt jika berisi data produksi sensitif.
- Tetap gunakan auth JWT untuk semua chat/file endpoints.
- Hindari mengirim data produksi rahasia ke model tanpa approval internal.

Recommended:

- Tambahkan timeout request Gemini.
- Tambahkan retry terbatas untuk error transient.
- Tambahkan rate limit per user.
- Simpan model provider dan error reason di log internal jika diperlukan.
- Gunakan safety settings sesuai kebijakan internal.

## Testing Checklist

### Test 1: Mock Mode

`.env`:

```env
GEMINI_API_KEY=
```

Expected:

```json
{
  "provider": "mock"
}
```

### Test 2: Gemini Generation Mode

`.env`:

```env
GEMINI_API_KEY=valid_key
```

Expected:

```json
{
  "provider": "gemini"
}
```

### Test 3: Keyword RAG

Ask:

```txt
Printer output has banding lines
```

Expected:

- `contexts` berisi chunk knowledge terkait print quality.
- AI answer menyebut nozzle check, ink supply, platen cleanliness, atau alignment.

### Test 4: Image Analysis

Upload image defect, lalu send chat dengan `imageId`.

Expected:

- AI response tetap tersimpan.
- `ChatMessage.imageId` terhubung ke `UploadedFile`.
- Jika Gemini gagal, fallback mock tetap membuat chat tidak putus.

### Test 5: Semantic RAG

Setelah embedding aktif:

Ask:

```txt
Cyan missing dots after maintenance
```

Expected:

- pgvector mengembalikan chunk print quality walaupun keyword persis tidak sama.
- `score` similarity muncul di hasil raw query.

## Roadmap Implementasi

Urutan implementasi yang disarankan:

1. Aktifkan `GEMINI_API_KEY` untuk generation.
2. Jadikan model generation configurable dengan `GEMINI_MODEL`.
3. Tambahkan `GeminiEmbeddingService`.
4. Ubah kolom vector ke dimensi tetap, misalnya `vector(768)`.
5. Tambahkan HNSW index pgvector.
6. Generate embedding saat create/update knowledge.
7. Buat script backfill embedding untuk data lama.
8. Ubah `searchRelevantChunks()` agar semantic search menjadi prioritas.
9. Pertahankan fallback keyword search.
10. Tambahkan rate limit, timeout, dan observability.

## Troubleshooting

### Response masih mock

Cek:

- `GEMINI_API_KEY` sudah terisi.
- Backend sudah restart.
- API key masih aktif.
- Tidak ada quota/billing issue.
- Endpoint Gemini tidak diblokir jaringan.

### Gemini request failed

Cek response dari Gemini dengan logging internal sementara:

```js
const errorBody = await response.text();
console.error(errorBody);
```

Hapus atau sanitasi logging ini setelah debugging.

### Embedding query error

Cek:

- Extension pgvector aktif.
- Kolom embedding sudah punya dimensi yang sama dengan output Gemini.
- Vector literal format benar: `[0.1,0.2,0.3]`.
- Tidak mencampur embedding 768 dan 1536 dalam kolom yang sama.

### Similarity search lambat

Cek:

- HNSW index sudah dibuat.
- Jumlah chunk tidak terlalu besar per dokumen.
- `LIMIT` retrieval kecil, misalnya 3 sampai 5.
- Query embedding tidak dibuat ulang berkali-kali untuk request yang sama.
