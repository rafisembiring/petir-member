# PETIR — Sistem Manajemen Anggota

<div align="center">
  <img src="public/assets/petir_logo.png" alt="PETIR Logo" width="120" />
  
  <h3>Persaudaraan Timur Raya</h3>
  <p><em>Persaudaraan Tanpa Batas</em></p>

  ![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
  ![Neon](https://img.shields.io/badge/Neon-PostgreSQL-green?style=flat-square)
  ![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=flat-square&logo=vercel)
</div>

---

## Tentang

Sistem manajemen anggota digital untuk **PETIR (Persaudaraan Timur Raya)**. Admin dapat menambah, mengedit, dan menghapus data anggota. Setiap anggota memiliki kartu tanda anggota digital yang dapat diakses dan diverifikasi melalui QR code.

## Fitur

- **Admin Panel** — tambah, edit, hapus data anggota
- **No. ID Otomatis** — format `PTR-000001`, `PTR-000002`, dst. ID yang dihapus dapat digunakan kembali
- **Kartu Digital** — halaman kartu anggota dengan foto, nama, No. ID, alamat, status, dan QR code
- **QR Code Verifikasi** — scan untuk membuka halaman kartu anggota secara langsung
- **Upload Foto** — foto anggota disimpan di Vercel Blob
- **Responsif** — tampilan horizontal di PC, vertikal di mobile

## Tech Stack

| Komponen | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router) |
| Database | Neon PostgreSQL |
| File Storage | Vercel Blob |
| Hosting | Vercel |

## Struktur Proyek

```
app/
├── page.tsx                  # Admin panel
├── member/[id]/page.tsx      # Halaman kartu anggota (publik)
└── api/
    ├── members/route.ts      # GET semua / POST anggota baru
    ├── members/[id]/route.ts # PUT update / DELETE anggota
    └── upload/route.ts       # Upload foto ke Vercel Blob
lib/
└── db.ts                     # Neon client + tipe Member
public/
└── assets/
    └── petir_logo.png
neon-schema.sql               # Jalankan sekali di Neon SQL Editor
```

## Setup & Instalasi

### 1. Clone repo

```bash
git clone https://github.com/rafisembiring/petir-member-system.git
cd petir-member-system
npm install
```

### 2. Buat database di Neon

1. Buka [console.neon.tech](https://console.neon.tech) dan buat project baru
2. Buka **SQL Editor** dan jalankan isi file `neon-schema.sql`
3. Salin **Connection string** dari halaman project

### 3. Buat Vercel Blob store

1. Buka [Vercel Dashboard](https://vercel.com) → **Storage** → **Create** → **Blob**
2. Setelah dibuat, salin `BLOB_READ_WRITE_TOKEN` dari tab `.env.local`

### 4. Konfigurasi environment

Buat file `.env.local` di root project:

```env
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxx
```

### 5. Jalankan lokal

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

### 6. Deploy ke Vercel

```bash
vercel deploy
```

Pastikan environment variable `DATABASE_URL` dan `BLOB_READ_WRITE_TOKEN` sudah ditambahkan di **Vercel Dashboard → Settings → Environment Variables**.

---

<div align="center">
  <sub>Papua · Maluku · Sulawesi · NTT · NTB</sub>
</div>
