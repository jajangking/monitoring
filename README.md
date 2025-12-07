# Aplikasi Monitoring

Aplikasi ini dirancang untuk membantu Anda memantau dan mengelola keuangan harian, terutama untuk usaha kecil seperti pengemudi ojek, taksi, atau layanan transportasi lainnya. Aplikasi ini memungkinkan Anda untuk mencatat pesanan, pengeluaran bahan bakar, dan penggantian oli.

## Fitur

- Pencatatan pesanan harian
- Pencatatan pengeluaran bahan bakar
- Pencatatan penggantian oli
- Ringkasan keuangan bulanan dan harian
- Visualisasi data dalam bentuk kartu dan daftar
- Pengaturan tanggal dan rentang waktu untuk analisis data
- Fungsi atur ulang data
- Dukungan tema gelap & terang
- Sinkronisasi data dengan Supabase (dapat digunakan secara offline dengan AsyncStorage sebagai fallback)

## Instalasi

1. Pastikan Node.js dan Expo CLI telah terinstal di sistem Anda.
2. Clone atau download proyek ini ke komputer Anda.
3. Buka terminal dan arahkan ke direktori proyek.
4. Jalankan perintah berikut untuk menginstal dependensi:

   ```bash
   npm install
   ```

5. Untuk mengkonfigurasi API dan database, buat file `.env` di direktori utama dan tambahkan variabel lingkungan:
   ```
   # API Keys
   EXPO_PUBLIC_GROQ_API_KEY=your_groq_api_key_here

   # Supabase Configuration
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

   # Server Configuration
   GROQ_API_KEY=your_groq_api_key_here
   PORT=3000
   ```
   Lihat file ENV_SETUP.md untuk instruksi lengkap cara mendapatkan API keys.

6. (Opsional) Jika ingin menggunakan Supabase, buat tabel database di Supabase:
   - Jalankan perintah `node setup.mjs` untuk mendapatkan SQL yang perlu dijalankan
   - Salin dan tempel SQL tersebut ke editor SQL Supabase (Database → SQL Editor)
   - Klik "Run" untuk membuat tabel

7. Jalankan aplikasi:

   ```bash
   npx expo start
   ```

## Penggunaan

- Tab Dasbor: Menampilkan ringkasan keuangan harian dan bulanan
- Tab Pesanan: Untuk mencatat pesanan yang diterima
- Tab BBM: Untuk mencatat pengeluaran bahan bakar
- Tab Oli: Untuk mencatat pengeluaran penggantian oli
- Tab Pengaturan: Untuk mengatur aplikasi, termasuk fungsi atur ulang data

## Teknologi yang Digunakan

- React Native
- Expo
- TypeScript
- Supabase untuk penyimpanan data di cloud
- AsyncStorage untuk penyimpanan lokal sebagai fallback

## Struktur Proyek

```
monitoring/
├── App.tsx
├── components/
│   ├── Dashboard.tsx
│   ├── OrderTracker.tsx
│   ├── FuelExpenseTracker.tsx
│   └── OilChangeTracker.tsx
├── models/
├── utils/
├── SUPABASE_SETUP.md
├── supabase_migrations.sql
├── setup.mjs
└── README.md
```

## Kontribusi

Kontribusi sangat diterima dan dihargai. Silakan fork proyek ini, buat perubahan yang Anda perlukan, dan kirimkan pull request.