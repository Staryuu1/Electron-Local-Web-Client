# Electron Local Web Client

**Electron-Local-Web-Client** adalah aplikasi desktop berbasis [Electron.js](https://www.electronjs.org/) yang secara otomatis mendeteksi dan membuka Web Server yang berjalan di jaringan lokal (LAN). Aplikasi ini cocok digunakan sebagai client ringan untuk sistem POS, dashboard internal, atau aplikasi web lainnya yang di-host secara lokal.

---

## 🎯 Fitur Utama

- 🔍 Otomatis memindai IP lokal dan port Web Server (8000, 8080, 3000, 5000)
- 🎯 Mendukung input port kustom (1-65535)
- 📡 Menampilkan animasi loading saat scanning
- 🎨 Antarmuka modern dengan mode gelap
- 🔄 Tombol "Scan Ulang" untuk memperbarui daftar server
- 📋 Menampilkan daftar server yang ditemukan dengan status online
- 🎉 SweetAlert untuk notifikasi saat Web Server ditemukan
- 📂 Menampilkan halaman "Not Found" jika Web Server tidak terdeteksi
- 💻 Build untuk Windows, Linux, dan MacOS (via GitHub Actions)
- ⚙️ Pengaturan untuk kustomisasi pemindaian
---

## 📦 Cara Install & Jalankan

### 🔹 Opsi 1: Download dari Release (Rekomendasi)

1. Kunjungi halaman [Releases](https://github.com/Staryuu1/Electron-Local-Web-Client/releases).
2. Pilih versi terbaru.
3. Unduh file sesuai sistem operasi kamu:
   - `.exe` untuk **Windows**
   - `.deb` atau `.AppImage` untuk **Linux**
   - `.dmg` untuk **macOS**
4. Jalankan aplikasi tanpa instalasi tambahan.

---

## 🤝 Kontribusi

Kami sangat terbuka terhadap kontribusi!

Jika kamu ingin menambahkan fitur, memperbaiki bug, atau meningkatkan performa aplikasi ini, silakan ikuti langkah berikut:

1. **Fork** repository ini.
2. **Clone** hasil fork kamu:
   ```bash
   git clone https://github.com/username-kamu/Electron-Local-Web-Client.git
