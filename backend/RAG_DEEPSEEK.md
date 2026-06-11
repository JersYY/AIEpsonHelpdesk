# Integrasi RAG DeepSeek

Dokumen ini menjelaskan konfigurasi AI/RAG Epson Helpdesk setelah chatbot dipusatkan ke DeepSeek.

## Mode Utama

```env
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_MODE=hemat
RAG_MODE=keyword
```

`RAG_MODE=keyword` adalah default hemat. Sistem mencari dokumen knowledge base memakai full-text/keyword search, lalu context yang relevan dikirim ke provider otomatis.

Provider dipilih otomatis:

- Pertanyaan teks/RAG: DeepSeek.
- Pertanyaan dengan lampiran gambar: Gemini Vision.

## Mode Hemat Dan Normal

Admin dapat mengubah mode lewat:

```http
GET /api/admin/ai-settings
PATCH /api/admin/ai-settings
```

Body:

```json
{ "mode": "normal" }
```

- `hemat`: jawaban lebih padat, token lebih kecil, retry lebih sedikit.
- `normal`: jawaban lebih lengkap untuk kasus teknis yang butuh konteks tambahan.

## Fallback

Jika API key provider otomatis kosong, request timeout, atau provider gagal, backend memakai mock response agar chat tetap berjalan.

## Lampiran Gambar

Upload gambar tetap disimpan sebagai lampiran chat/ticket. Jika ada lampiran gambar, backend otomatis memakai Gemini Vision; tanpa gambar backend memakai DeepSeek.

## Semantic RAG Opsional

DeepSeek chat API tidak menyediakan embedding resmi untuk semantic vector search. Jika semantic RAG dibutuhkan nanti, aktifkan provider embedding terpisah dan ubah:

```env
RAG_MODE=semantic
```

Pada mode full DeepSeek sekarang, backfill embedding tidak diperlukan.
