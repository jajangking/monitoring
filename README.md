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

## Instalasi

1. Pastikan Node.js dan Expo CLI telah terinstal di sistem Anda.
2. Clone atau download proyek ini ke komputer Anda.
3. Buka terminal dan arahkan ke direktori proyek.
4. Jalankan perintah berikut untuk menginstal dependensi:

   ```bash
   npm install
   ```

5. Jalankan aplikasi:

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
- AsyncStorage untuk penyimpanan lokal

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
└── README.md
```

## Kontribusi

Kontribusi sangat diterima dan dihargai. Silakan fork proyek ini, buat perubahan yang Anda perlukan, dan kirimkan pull request.