import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const pdfPath = path.join(__dirname, '../../Document_Pengerjaan_FeloAssistant_11_Agustus_2026.pdf');
const doc = new PDFDocument({ margin: 40, size: 'A4' });

const stream = fs.createWriteStream(pdfPath);
doc.pipe(stream);

// --- COLOR PALETTE ---
const primaryColor = '#0f172a';
const accentBlue = '#2563eb';
const accentGreen = '#15803d';
const accentPurple = '#7e22ce';
const textDark = '#0f172a';
const textMuted = '#334155';
const cardBg = '#f8fafc';
const borderColor = '#cbd5e1';

// --- HEADER BANNER ---
doc.rect(40, 35, 515, 75).fill(primaryColor);
doc.fillColor('#ffffff').fontSize(17).font('Helvetica-Bold').text('LAPORAN MATERI & DOKUMENTASI LENGKAP PROJECT', 55, 48);
doc.fillColor('#94a3b8').fontSize(9.5).font('Helvetica').text('Sistem Manajemen Produktivitas Personal - FeloAssistant Workspace (MERN Stack + AI)', 55, 74);

// Metadata Box
doc.rect(40, 118, 515, 42).fill(cardBg).stroke(borderColor);
doc.fillColor(textDark).fontSize(8.5).font('Helvetica-Bold')
   .text('Penyusun Materi:', 50, 126)
   .text('Tanggal Update:', 210, 126)
   .text('Database Target Cloud:', 360, 126);

doc.fillColor(textMuted).font('Helvetica')
   .text('Evan Fadilah', 50, 140)
   .text('Selasa, 11 Agustus 2026', 210, 140)
   .text('MongoDB Atlas (feloassistant)', 360, 140);

let y = 172;

// --- BAB 1: PENDAHULUAN ---
doc.fillColor(accentBlue).fontSize(11).font('Helvetica-Bold').text('BAB I: PENDAHULUAN & ARSITEKTUR KESELURUHAN', 40, y);
y += 15;
doc.fillColor(textMuted).fontSize(8.5).font('Helvetica')
   .text('FeloAssistant Workspace diciptakan sebagai aplikasi manajemen produktivitas personal terpadu yang menggabungkan 4 Pilar Utama (Tugas, Kebiasaan, Jadwal Jam, dan Keuangan) serta didukung oleh Asisten Pintar AI (Google Gemini 2.0 Flash) dalam satu platform web modern berbasis MERN Stack (MongoDB, Express.js, React.js, Node.js). Aplikasi ini dirancang untuk membantu pengguna mengontrol rutinitas harian dengan indikator persentase produktivitas real-time, percakapan interaktif AI, dan data terisolasi per akun.', 40, y, { width: 515, align: 'justify' });
y += 45;

// --- BAB 2: MATERI & FITUR YANG SUDAH SELESAI (100% COMPLETED) ---
doc.fillColor(accentGreen).fontSize(11).font('Helvetica-Bold').text('BAB II: MATERI & FITUR YANG SUDAH SELESAI (100% COMPLETED)', 40, y);
y += 15;

const featuresDone = [
  {
    num: '2.1',
    name: 'Pilar 1: Tugas (Todo Tasks)',
    desc: 'Fitur pengelolaan tugas harian dan tenggat waktu. Pengguna dapat menginput nama tugas, mata pelajaran/kuliah, dan tanggal deadline. Dilengkapi filter status (Semua, Belum, Selesai), mesin pencarian real-time, penanda otomatis (⚠️ TERLAMBAT) jika melewati deadline, serta fitur Aksi Lengkap: Tambah, Edit Modal, Hapus (SweetAlert2), dan Checklist Selesai.'
  },
  {
    num: '2.2',
    name: 'Pilar 2: Kebiasaan (Habit Tracker)',
    desc: 'Fitur pembentuk rutinitas positif harian maupun mingguan. Dilengkapi sistem kalkulasi otomatis "🔥 Streak Count" (hitung hari beruntun konsisten), checkbox check-in harian, serta fitur Aksi Lengkap: Tambah, Edit Modal, dan Hapus (SweetAlert2).'
  },
  {
    num: '2.3',
    name: 'Pilar 3: Jadwal Jam (Timeblock Calendar)',
    desc: 'Fitur alokasi blok waktu terstruktur untuk membagi jam fokus harian (jam mulai dan jam selesai) beserta kategori kegiatan (misal: Akademik, Coding, Kerja). Dilengkapi checkbox penyelesaian, serta fitur Aksi Lengkap: Tambah, Edit Modal, dan Hapus (SweetAlert2).'
  },
  {
    num: '2.4',
    name: 'Pilar 4: Keuangan (Expense Tracker)',
    desc: 'Fitur pencatatan riwayat transaksi keuangan personal. Pengguna dapat menginput nominal uang (Rp), kategori pengeluaran, dan catatan tambahan. Dilengkapi kalkulator penjumlahan otomatis total rupiah pengeluaran, serta fitur Aksi Lengkap: Tambah, Edit Modal, dan Hapus (SweetAlert2).'
  },
  {
    num: '2.5',
    name: 'Indikator Target Hari Ini (%)',
    desc: 'Fitur pengukur tingkat disiplin dan produktivitas harian pengguna secara real-time. Menghitung persentase penyelesaian kegiatan (Jumlah Selesai / Total Kegiatan) di 3 Pilar Aktivitas (Tugas, Habit, Timeblock) dan ditampilkan dalam bentuk Progress Bar dinamis.'
  },
  {
    num: '2.6',
    name: 'Felo AI Assistant Widget (Google Gemini 2.0 Flash + Dual-Engine)',
    desc: 'Fitur Asisten Pintar AI interaktif di pojok kanan bawah Dashboard. AI dapat membaca data 4 Pilar dari MongoDB secara real-time, memberikan rekap analisis produktivitas, serta dapat mengeksekusi aksi otomatis (Function Calling) seperti mencatat tugas baru, membuat habit baru, mencatat pengeluaran uang, dan menjadwalkan timeblock secara otomatis dari percakapan obrolan.'
  },
  {
    num: '2.7',
    name: 'Backend Express & Database Cloud MongoDB Atlas',
    desc: 'Arsitektur backend MERN tersambung langsung ke database resmi "feloassistant" di MongoDB Atlas Cloud. Memiliki 5 collection (users, todos, habits, timeblocks, expenses), enkripsi password Bcrypt, otentikasi JWT Token, terisolasi 100% per userId (data tidak tertukar), dan database telah di-reset bersih (0 data dummy).'
  },
  {
    num: '2.8',
    name: 'Pengingat & Notifikasi Browser Pop-up (Web Notification API)',
    desc: 'Fitur sistem pengingat otomatis menggunakan HTML5 Web Notification API bawaan browser. Mengirimkan spanduk pop-up & suara di layar HP/Laptop secara real-time untuk 4 Pilar Produktivitas (Peringatan deadline tugas harian, check-in kebiasaan, jadwal timeblock, dan pengingat harian pencatatan keuangan) tanpa perlu aplikasi tambahan atau nomor HP.'
  }
];

featuresDone.forEach(f => {
  if (y > 720) {
    doc.addPage();
    y = 40;
  }
  doc.rect(40, y, 515, 42).fill('#f0fdf4').stroke('#bbf7d0');
  doc.fillColor(textDark).fontSize(9).font('Helvetica-Bold').text(`${f.num} ${f.name}`, 48, y + 5);
  doc.fillColor(textMuted).fontSize(7.8).font('Helvetica').text(f.desc, 48, y + 17, { width: 498, align: 'justify' });
  y += 46;
});

y += 10;

if (y > 700) {
  doc.addPage();
  y = 40;
}

// --- BAB 3: MATERI & FITUR YANG BELUM DIKERJAKAN (PENDING NEXT STEP) ---
doc.fillColor(accentPurple).fontSize(11).font('Helvetica-Bold').text('BAB III: MATERI & FITUR YANG BELUM DIKERJAKAN (PENDING NEXT STEP)', 40, y);
y += 15;

const featuresPending = [
  {
    num: '3.1',
    name: 'Pengingat & Notifikasi Otomatis via WhatsApp (WA Notification)',
    desc: 'Sistem pengiriman notifikasi pengingat otomatis langsung ke nomor WhatsApp pengguna. Meliputi ringkasan agenda harian pada jam 07:00 pagi, peringatan tugas yang mendekati tenggat waktu (deadline), serta kemampuan mencatat pengeluaran uang secara cepat melalui balasan chat WhatsApp.'
  }
];

featuresPending.forEach(fp => {
  if (y > 720) {
    doc.addPage();
    y = 40;
  }
  doc.rect(40, y, 515, 44).fill('#faf5ff').stroke('#e9d5ff');
  doc.fillColor(accentPurple).fontSize(9).font('Helvetica-Bold').text(`${fp.num} ${fp.name}`, 48, y + 5);
  doc.fillColor(textMuted).fontSize(7.8).font('Helvetica').text(fp.desc, 48, y + 17, { width: 498, align: 'justify' });
  y += 48;
});

y += 15;

if (y > 700) {
  doc.addPage();
  y = 40;
}

// --- BAB 4: KESIMPULAN ---
doc.fillColor(accentBlue).fontSize(11).font('Helvetica-Bold').text('BAB IV: KESIMPULAN', 40, y);
y += 15;
doc.fillColor(textMuted).fontSize(8.5).font('Helvetica')
   .text('Seluruh infrastruktur utama FeloAssistant Workspace (4 Pilar Produktivitas, Skor Target Hari Ini, Fitur CRUD Popup SweetAlert2, Otentikasi Akun, Database MongoDB Cloud, dan Felo AI Assistant Widget) telah selesai 100% dibangun dan berfungsi dengan sangat lancar tanpa error. Pengembangan berikutnya akan difokuskan pada pengintegrasian Notifikasi WhatsApp otomatis.', 40, y, { width: 515, align: 'justify' });

y += 45;

if (y > 720) {
  doc.addPage();
  y = 40;
}

// --- FOOTER SIGNATURE ---
doc.rect(40, y, 515, 35).fill(primaryColor);
doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica-Bold').text('Dokumentasi Lengkap FeloAssistant Project - Update 11 Agustus 2026', 55, y + 12);
doc.fillColor('#94a3b8').fontSize(8.5).font('Helvetica').text('Disusun oleh Evan Fadilah', 390, y + 12);

doc.end();

stream.on('finish', () => {
  console.log('✅ PDF Laporan Dokumentasi Terbaru (11 Agustus 2026) Berhasil Dibuat!');
});
