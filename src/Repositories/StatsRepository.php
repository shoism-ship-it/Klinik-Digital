<?php

namespace Klinik\Repositories;

class StatsRepository extends BaseRepository
{
    public function admin(): array
    {
        return [
            'total_pasien' => (int)$this->fetchColumn('SELECT COUNT(*) FROM pasien'),
            'total_dokter' => (int)$this->fetchColumn('SELECT COUNT(*) FROM dokter'),
            'total_transaksi' => (int)$this->fetchColumn('SELECT COALESCE(SUM(total),0) FROM transaksi WHERE MONTH(tanggal)=MONTH(NOW())'),
            'total_rekam' => (int)$this->fetchColumn('SELECT COUNT(*) FROM rekam_medis WHERE MONTH(tanggal)=MONTH(NOW())'),
            'stok_menipis' => (int)$this->fetchColumn('SELECT COUNT(*) FROM obat WHERE stok < 20'),
            'booking_menunggu' => (int)$this->fetchColumn('SELECT COUNT(*) FROM booking WHERE status="Menunggu"'),
            'transaksi_menunggu' => (int)$this->fetchColumn('SELECT COUNT(*) FROM transaksi WHERE status="Menunggu"'),
            'kunjungan_bulanan' => $this->fetchAll(
                'SELECT MONTH(tanggal) AS bulan, COUNT(*) AS jumlah
                 FROM rekam_medis
                 WHERE YEAR(tanggal)=YEAR(CURDATE())
                 GROUP BY MONTH(tanggal)
                 ORDER BY bulan'
            ),
            'kunjungan_chart' => $this->fetchAll(
                'SELECT DATE(tanggal) AS tgl, COUNT(*) AS jumlah
                 FROM rekam_medis
                 WHERE tanggal >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
                 GROUP BY DATE(tanggal)
                 ORDER BY tgl'
            ),
        ];
    }

    public function dokter(int $dokterId): array
    {
        $stats = [
            'pasien_hari_ini' => 0,
            'total_pasien_bulan' => 0,
            'jadwal_aktif' => 0,
            'antrian_hari_ini' => 0,
        ];

        if ($dokterId) {
            $stats['pasien_hari_ini'] = (int)$this->fetchColumn('SELECT COUNT(*) FROM rekam_medis WHERE dokter_id=? AND tanggal=CURDATE()', [$dokterId]);
            $stats['total_pasien_bulan'] = (int)$this->fetchColumn('SELECT COUNT(*) FROM rekam_medis WHERE dokter_id=? AND MONTH(tanggal)=MONTH(NOW())', [$dokterId]);
            $stats['jadwal_aktif'] = (int)$this->fetchColumn('SELECT COUNT(*) FROM jadwal WHERE dokter_id=? AND status="Aktif"', [$dokterId]);
            $stats['antrian_hari_ini'] = (int)$this->fetchColumn('SELECT COUNT(*) FROM booking WHERE dokter_id=? AND tanggal=CURDATE() AND status IN ("Menunggu","Dikonfirmasi")', [$dokterId]);
        }

        return $stats;
    }

    public function pasien(int $pasienId): array
    {
        $stats = [
            'total_kunjungan' => 0,
            'total_resep' => 0,
            'booking_aktif' => 0,
            'transaksi_menunggu' => 0,
        ];

        if ($pasienId) {
            $stats['total_kunjungan'] = (int)$this->fetchColumn('SELECT COUNT(*) FROM rekam_medis WHERE pasien_id=?', [$pasienId]);
            $stats['total_resep'] = (int)$this->fetchColumn('SELECT COUNT(*) FROM resep WHERE pasien_id=?', [$pasienId]);
            $stats['booking_aktif'] = (int)$this->fetchColumn('SELECT COUNT(*) FROM booking WHERE pasien_id=? AND status="Menunggu"', [$pasienId]);
            $stats['transaksi_menunggu'] = (int)$this->fetchColumn('SELECT COUNT(*) FROM transaksi WHERE pasien_id=? AND status="Menunggu"', [$pasienId]);
        }

        return $stats;
    }

    public function laporan(int $year): array
    {
        return [
            'year' => $year,
            'kunjungan_per_bulan' => $this->fetchAll(
                'SELECT MONTH(tanggal) AS bulan, COUNT(*) AS jumlah
                 FROM rekam_medis
                 WHERE YEAR(tanggal)=?
                 GROUP BY MONTH(tanggal)
                 ORDER BY bulan',
                [$year]
            ),
            'diagnosa' => $this->fetchAll(
                'SELECT COALESCE(NULLIF(diagnosa, ""), "Lainnya") AS diagnosa, COUNT(*) AS jumlah
                 FROM rekam_medis
                 WHERE YEAR(tanggal)=?
                 GROUP BY COALESCE(NULLIF(diagnosa, ""), "Lainnya")
                 ORDER BY jumlah DESC
                 LIMIT 5',
                [$year]
            ),
        ];
    }
}
