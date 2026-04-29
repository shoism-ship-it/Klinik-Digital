-- Klinik Digital Polibatam — Schema + Seed Data
-- Run: mysql -u root -p < config/install.sql

CREATE DATABASE IF NOT EXISTS klinik_polibatam CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE klinik_polibatam;

-- ─────────────────────────────────────────────
--  TABLES
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    email      VARCHAR(120) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    role       ENUM('admin','dokter','pasien') NOT NULL DEFAULT 'pasien',
    nama       VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pasien (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT NULL,
    nama       VARCHAR(100) NOT NULL,
    nim        VARCHAR(30),
    prodi      VARCHAR(80),
    tgl_lahir  DATE,
    gender     ENUM('L','P') DEFAULT 'L',
    hp         VARCHAR(20),
    role       VARCHAR(30) DEFAULT 'Mahasiswa',
    status     VARCHAR(20) DEFAULT 'Aktif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS dokter (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    nama       VARCHAR(100) NOT NULL,
    spesialis  VARCHAR(80),
    hari       VARCHAR(100),
    jam        VARCHAR(50),
    hp         VARCHAR(20),
    status     VARCHAR(20) DEFAULT 'Aktif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS obat (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    nama       VARCHAR(100) NOT NULL,
    kategori   VARCHAR(50),
    stok       INT DEFAULT 0,
    satuan     VARCHAR(20) DEFAULT 'Tablet',
    harga      INT DEFAULT 0,
    kadaluarsa DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rekam_medis (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    pasien_id   INT NOT NULL,
    dokter_id   INT NOT NULL,
    tanggal     DATE NOT NULL,
    keluhan     TEXT,
    diagnosa    TEXT,
    tindakan    TEXT,
    tekanan_darah VARCHAR(20),
    berat_badan DECIMAL(5,1),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pasien_id) REFERENCES pasien(id) ON DELETE CASCADE,
    FOREIGN KEY (dokter_id) REFERENCES dokter(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS resep (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    rekam_medis_id INT NOT NULL,
    pasien_id     INT NOT NULL,
    dokter_id     INT NOT NULL,
    tanggal       DATE NOT NULL,
    catatan       TEXT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rekam_medis_id) REFERENCES rekam_medis(id) ON DELETE CASCADE,
    FOREIGN KEY (pasien_id)      REFERENCES pasien(id)      ON DELETE CASCADE,
    FOREIGN KEY (dokter_id)      REFERENCES dokter(id)      ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS resep_detail (
    id       INT AUTO_INCREMENT PRIMARY KEY,
    resep_id INT NOT NULL,
    obat_id  INT NOT NULL,
    jumlah   INT NOT NULL DEFAULT 1,
    aturan   VARCHAR(80),
    FOREIGN KEY (resep_id) REFERENCES resep(id) ON DELETE CASCADE,
    FOREIGN KEY (obat_id)  REFERENCES obat(id)  ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transaksi (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    pasien_id   INT NOT NULL,
    tanggal     DATE NOT NULL,
    layanan     VARCHAR(100),
    metode      VARCHAR(30),
    total       INT DEFAULT 0,
    status      VARCHAR(20) DEFAULT 'Selesai',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pasien_id) REFERENCES pasien(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS jadwal (
    id        INT AUTO_INCREMENT PRIMARY KEY,
    dokter_id INT NOT NULL,
    hari      VARCHAR(15) NOT NULL,
    jam_mulai TIME NOT NULL,
    jam_selesai TIME NOT NULL,
    kuota     INT DEFAULT 10,
    status    VARCHAR(20) DEFAULT 'Aktif',
    FOREIGN KEY (dokter_id) REFERENCES dokter(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS booking (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    pasien_id   INT NOT NULL,
    dokter_id   INT NOT NULL,
    jadwal_id   INT,
    tanggal     DATE NOT NULL,
    keluhan     TEXT,
    status      VARCHAR(20) DEFAULT 'Menunggu',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pasien_id) REFERENCES pasien(id) ON DELETE CASCADE,
    FOREIGN KEY (dokter_id) REFERENCES dokter(id) ON DELETE CASCADE,
    FOREIGN KEY (jadwal_id) REFERENCES jadwal(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────
--  SEED DATA
-- ─────────────────────────────────────────────

-- Users
INSERT INTO users (email, password, role, nama) VALUES
('admin@polibatam.ac.id',  'admin123',  'admin',  'Salwa Admin'),
('dokter@polibatam.ac.id', 'dokter123', 'dokter', 'dr. Sarah Amalia'),
('pasien@polibatam.ac.id', 'pasien123', 'pasien', 'Andi Pratama');

-- Pasien
INSERT INTO pasien (user_id, nama, nim, prodi, tgl_lahir, gender, hp, role, status) VALUES
(3, 'Andi Pratama',     'NIM4311901001', 'Teknik Informatika', '2002-01-12', 'L', '08123456789', 'Mahasiswa', 'Aktif'),
(NULL, 'Siti Rahma',    'NIM4311901002', 'Sistem Informasi',   '2001-05-22', 'P', '08234567890', 'Mahasiswa', 'Aktif'),
(NULL, 'Budi Santoso',  'NIP198501012010', 'Teknik Elektro',   '1985-01-01', 'L', '08345678901', 'Dosen',    'Aktif'),
(NULL, 'Dewi Lestari',  'NIM4311901004', 'Manajemen Bisnis',   '2003-09-15', 'P', '08456789012', 'Mahasiswa', 'Aktif'),
(NULL, 'Rizky Firmansyah','NIM4311901005','Teknik Informatika','2002-11-30', 'L', '08567890123', 'Mahasiswa', 'Aktif');

-- Dokter
INSERT INTO dokter (nama, spesialis, hari, jam, hp, status) VALUES
('dr. Sarah Amalia',    'Umum',      'Senin, Rabu, Jumat',   '08:00 - 12:00', '08111111111', 'Aktif'),
('dr. Hendra Kusuma',   'Gigi',      'Selasa, Kamis',        '13:00 - 17:00', '08222222222', 'Aktif'),
('dr. Putri Maharani',  'Mata',      'Senin, Kamis',         '09:00 - 13:00', '08333333333', 'Aktif');

-- Obat
INSERT INTO obat (nama, kategori, stok, satuan, harga, kadaluarsa) VALUES
('Paracetamol 500mg',  'Analgesik',   150, 'Tablet',  2000,  '2025-12-31'),
('Amoxicillin 500mg',  'Antibiotik',   80, 'Kapsul',  5000,  '2025-06-30'),
('Vitamin C 500mg',    'Vitamin',     200, 'Tablet',  1500,  '2026-03-31'),
('Antasida Doen',      'Antasida',     60, 'Tablet',  1000,  '2025-09-30'),
('CTM',                'Antihistamin', 30, 'Tablet',  500,   '2025-08-31'),
('Ibuprofen 400mg',    'Analgesik',   100, 'Tablet',  3000,  '2026-01-31');

-- Rekam Medis
INSERT INTO rekam_medis (pasien_id, dokter_id, tanggal, keluhan, diagnosa, tindakan, tekanan_darah, berat_badan) VALUES
(1, 1, '2024-10-15', 'Demam dan sakit kepala',         'Febris', 'Pemberian antipiretik dan istirahat cukup', '120/80', 68.5),
(2, 2, '2024-10-18', 'Sakit gigi kiri bawah',          'Karies Gigi', 'Pembersihan dan penambalan gigi', '110/70', 55.0),
(3, 1, '2024-10-20', 'Batuk pilek sudah 3 hari',       'ISPA ringan', 'Pemberian antibitiotik dan vitamin', '130/85', 75.0);

-- Resep
INSERT INTO resep (rekam_medis_id, pasien_id, dokter_id, tanggal, catatan) VALUES
(1, 1, 1, '2024-10-15', 'Diminum sesudah makan'),
(2, 2, 2, '2024-10-18', 'Gunakan obat kumur juga');

INSERT INTO resep_detail (resep_id, obat_id, jumlah, aturan) VALUES
(1, 1, 10, '3x1'),
(1, 3, 10, '1x1'),
(2, 4, 6,  '3x1');

-- Transaksi
INSERT INTO transaksi (pasien_id, tanggal, layanan, metode, total, status) VALUES
(1, '2024-10-15', 'Konsultasi Umum',    'BPJS',   0,      'Selesai'),
(2, '2024-10-18', 'Periksa Gigi',       'Tunai',  150000, 'Selesai'),
(3, '2024-10-20', 'Konsultasi Umum',    'Mandiri', 50000, 'Selesai'),
(4, '2024-10-21', 'Pengambilan Obat',   'Tunai',  35000,  'Selesai');

-- Jadwal
INSERT INTO jadwal (dokter_id, hari, jam_mulai, jam_selesai, kuota, status) VALUES
(1, 'Senin',   '08:00', '12:00', 10, 'Aktif'),
(1, 'Rabu',    '08:00', '12:00', 10, 'Aktif'),
(1, 'Jumat',   '08:00', '12:00', 10, 'Aktif'),
(2, 'Selasa',  '13:00', '17:00', 8,  'Aktif'),
(2, 'Kamis',   '13:00', '17:00', 8,  'Aktif'),
(3, 'Senin',   '09:00', '13:00', 10, 'Aktif'),
(3, 'Kamis',   '09:00', '13:00', 10, 'Aktif');
