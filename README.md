# HTML Vault Pro

PWA editor & penyimpan file HTML yang berjalan sepenuhnya **offline**.
Semua file, folder, dan log disimpan di **IndexedDB** perangkat — tidak ada server, tidak ada akun.

---

## Fitur

- 📁 Vault file HTML dengan folder bersarang, pencarian, sorting, favorit
- 📝 Editor dengan nomor baris, auto-indent, auto-close tag, word-wrap, auto-save
- 👁️ Preview langsung di iframe (sandboxed) + device simulator (390px / 768px / 100%)
- 🖥️ Console & error runtime yang ditangkap dari preview
- 🎨 8 tema warna (light, dark, midnight, cream, forest, ocean, sunset, dracula)
- 🗑️ Trash dengan restore, backup/restore JSON, ekspor file
- 📦 Import `.html` via tombol atau drag & drop
- 📱 Installable (PWA) + bekerja offline penuh

---

## Struktur file

```
.
├── index.html      # Aplikasi (single-file)
├── manifest.json   # Web App Manifest
├── sw.js           # Service Worker
├── icon-192.png    # Ikon aplikasi 192×192
├── icon-512.png    # Ikon aplikasi 512×512
├── vercel.json     # Konfigurasi deploy Vercel
└── README.md
```

> **Catatan:** nama file service worker **wajib** `sw.js` (bukan `sw.json`),
> karena browser mensyaratkan MIME `application/javascript`.

---

## Menjalankan secara lokal

Service Worker **tidak berjalan** di `file://`. Jalankan lewat HTTP:

```bash
# Python
python3 -m http.server 8080

# atau Node
npx serve .
```

Lalu buka `http://localhost:8080`.

---

## Deploy ke Vercel

```bash
npm i -g vercel
vercel
```

Atau drag-and-drop folder ke dashboard Vercel. `vercel.json` sudah mengatur:

- `sw.js` → `Cache-Control: max-age=0, must-revalidate` (agar update cepat terdeteksi)
- `manifest.json` → MIME `application/manifest+json`
- `index.html` → tidak di-cache lama
- Ikon PNG → cache immutable 1 tahun
- Header keamanan dasar (`nosniff`, `Referrer-Policy`, `X-Frame-Options`)

### Deploy di subfolder / GitHub Pages

Semua path di `manifest.json` dan `sw.js` memakai **path relatif** (`./`),
jadi tetap bekerja bila di-host di `https://user.github.io/nama-repo/`.

---

## Ikon

Sudah tersedia:
- `icon-192.png` — 192×192
- `icon-512.png` — 512×512

Keduanya dipakai oleh `manifest.json` dan di-precache oleh `sw.js`.

### Opsional: ikon *maskable* untuk Android

Android memotong ikon menjadi bentuk bulat/squircle. Kalau `icon-512.png`
desainnya penuh sampai tepi (tidak ada padding), sebaiknya buat versi
maskable dengan safe-zone 80%:

```bash
# butuh ImageMagick
magick icon-512.png -resize 410x410 \
       -background "#2f6f5e" -gravity center -extent 512x512 \
       icon-maskable-512.png
```

Lalu di `manifest.json`, ganti entry `maskable` menjadi:

```json
{
  "src": "./icon-maskable-512.png",
  "sizes": "512x512",
  "type": "image/png",
  "purpose": "maskable"
}
```

---

## Update versi

Saat mengubah `index.html` / aset, naikkan versi di `sw.js`:

```js
const VERSION = "1.0.1";
```

Ini membuat cache lama dihapus otomatis di event `activate`.
Pengguna akan melihat toast *"Versi baru tersedia"* dan tinggal menutup–membuka app.

---

## Data & privasi

- Tidak ada request jaringan selain memuat app shell
- Data 100% lokal di IndexedDB (`htmlvault`)
- **Hapus data browser = data hilang.** Gunakan **Setting → Backup** secara berkala

---

## Troubleshooting

| Masalah | Solusi |
|---|---|
| SW tidak terdaftar | Pastikan diakses via `https://` atau `localhost`, bukan `file://` |
| Perubahan tidak muncul | DevTools → Application → Service Workers → **Update**, atau hard reload |
| Install prompt tidak muncul | Butuh HTTPS + `manifest.json` valid + ikon ≥192px |
| Penyimpanan penuh | Setting → Storage, kosongkan Trash, atau ekspor lalu hapus file besar |
| iOS tidak dukung install prompt | Safari → Share → **Add to Home Screen** |