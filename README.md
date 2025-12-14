# 0downai – Web Application

0downai adalah aplikasi web modern berbasis **Next.js** yang dirancang sebagai **full-stack application** dengan fokus pada performa, pengalaman pengguna (UX), dan kemudahan pengembangan. Aplikasi ini terintegrasi dengan **Supabase** untuk autentikasi dan pengelolaan data.

---

## 🚀 Tech Stack

| Kategori       | Teknologi              | Peran                                    |
| -------------- | ---------------------- | ---------------------------------------- |
| Framework      | Next.js (v16)          | Routing, SSR, dan optimasi aplikasi      |
| UI Library     | React (v19)            | Pembuatan antarmuka berbasis komponen    |
| Language       | TypeScript             | Static typing & kualitas kode            |
| Styling        | Tailwind CSS           | Styling utility-first                    |
| UI Components  | Radix UI / Shadcn UI   | Komponen UI & aksesibilitas              |
| Backend & Auth | Supabase               | Database PostgreSQL & autentikasi        |
| Animasi        | Framer Motion          | Animasi & interaksi UI                   |
| HTTP Client    | Axios                  | Komunikasi API                           |
| Konten         | React Markdown + Shiki | Rendering markdown & syntax highlighting |

---

## 📦 Prasyarat

Pastikan Anda telah menginstal:

* **Node.js** (versi terbaru direkomendasikan)
* Salah satu package manager:

  * npm
  * yarn
  * pnpm
  * **bun (disarankan)**

---

## ⚙️ Instalasi

Clone repositori lalu install dependensi:

```bash
# menggunakan npm
npm install

# atau menggunakan bun
bun install
```

---

## 🔐 Konfigurasi Supabase

Aplikasi ini membutuhkan Supabase sebagai backend.

### Langkah Setup Supabase

1. Buat akun di **Supabase**
2. Buat proyek baru
3. Salin **Project URL** dan **Anon Public Key**

### Environment Variables

Buat file `.env.local` di root proyek:

```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_KEY="your-anon-key"
```

### Konfigurasi Client Supabase

Supabase diinisialisasi menggunakan `@supabase/ssr` agar kompatibel dengan Next.js App Router.

```ts
// lib/supabase.ts
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!
  )
}
```

---

## ▶️ Menjalankan Aplikasi

Jalankan server development:

```bash
npm run dev
# atau
bun dev
```

Aplikasi akan berjalan di:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🗂️ Struktur & Fitur Utama

```
app/
 ├─ page.tsx              # Landing page
 ├─ login/page.tsx        # Halaman login
 ├─ signup/page.tsx       # Halaman registrasi
 ├─ dashboard/page.tsx    # Dashboard user

components/
 ├─ dashboard/
 │   ├─ copilot-chat.tsx  # Chatbot / Copilot berbasis markdown
 │   ├─ alerts-section.tsx# Notifikasi & alert
 ├─ ui/                   # Komponen UI (button, input, card, dll)
 ├─ animations/           # Animasi (ScrollReveal, dll)

lib/
 ├─ axios.ts              # Axios instance untuk API
 └─ supabase.ts           # Supabase client
```

### Fitur Utama

* Autentikasi pengguna (login & signup)
* Dashboard pengguna
* Chatbot / Copilot dengan rendering Markdown
* Notifikasi dan alert sistem
* Animasi interaktif dengan Framer Motion

---

## ☁️ Deployment

Cara termudah untuk melakukan deployment adalah menggunakan **Vercel**.

### Langkah Singkat

1. Push proyek ke GitHub
2. Import repository ke Vercel
3. Atur **Environment Variables** (Supabase URL & Key)
4. Deploy 🚀

Vercel memberikan integrasi terbaik karena dibuat langsung oleh tim Next.js.

---

## 📌 Catatan

Dokumentasi ini ditujukan agar developer lain dapat dengan mudah memahami struktur proyek dan membangun aplikasi serupa menggunakan stack modern seperti yang digunakan pada 0downai.

---

✨ Happy Coding!
