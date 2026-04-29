<?php require_once __DIR__ . '/_api.php';

$db = getPDO();

$stats = [];

if ($currentRole === 'admin') {
    $stats['total_pasien']     = (int)$db->query('SELECT COUNT(*) FROM pasien')->fetchColumn();
    $stats['total_dokter']     = (int)$db->query('SELECT COUNT(*) FROM dokter')->fetchColumn();
    $stats['total_transaksi']  = (int)$db->query('SELECT COALESCE(SUM(total),0) FROM transaksi WHERE MONTH(tanggal)=MONTH(NOW())')->fetchColumn();
    $stats['total_rekam']      = (int)$db->query('SELECT COUNT(*) FROM rekam_medis WHERE MONTH(tanggal)=MONTH(NOW())')->fetchColumn();
    $stats['stok_menipis']     = (int)$db->query('SELECT COUNT(*) FROM obat WHERE stok < 20')->fetchColumn();
    $stats['booking_menunggu'] = (int)$db->query('SELECT COUNT(*) FROM booking WHERE status="Menunggu"')->fetchColumn();

    // Kunjungan 7 hari terakhir
    $st = $db->query('SELECT DATE(tanggal) AS tgl, COUNT(*) AS jumlah
                      FROM rekam_medis
                      WHERE tanggal >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
                      GROUP BY DATE(tanggal)
                      ORDER BY tgl');
    $stats['kunjungan_chart'] = $st->fetchAll();

} elseif ($currentRole === 'dokter') {
    // Cari dokter_id dari nama
    $st = $db->prepare('SELECT id FROM dokter WHERE nama = ?');
    $st->execute([$currentName]);
    $dokterId = $st->fetchColumn() ?: 0;

    $stats['pasien_hari_ini'] = 0;
    $stats['total_pasien_bulan'] = 0;
    $stats['jadwal_aktif'] = 0;
    if ($dokterId) {
        $st = $db->prepare('SELECT COUNT(*) FROM rekam_medis WHERE dokter_id=? AND tanggal=CURDATE()');
        $st->execute([$dokterId]);
        $stats['pasien_hari_ini'] = (int)$st->fetchColumn();

        $st = $db->prepare('SELECT COUNT(*) FROM rekam_medis WHERE dokter_id=? AND MONTH(tanggal)=MONTH(NOW())');
        $st->execute([$dokterId]);
        $stats['total_pasien_bulan'] = (int)$st->fetchColumn();

        $st = $db->prepare('SELECT COUNT(*) FROM jadwal WHERE dokter_id=? AND status="Aktif"');
        $st->execute([$dokterId]);
        $stats['jadwal_aktif'] = (int)$st->fetchColumn();
    }

} else {
    // Pasien
    $pasienId = 0;
    if ($currentUserId) {
        $st = $db->prepare('SELECT id FROM pasien WHERE user_id = ?');
        $st->execute([$currentUserId]);
        $pasienId = (int)$st->fetchColumn();
    }
    $stats['total_kunjungan']  = 0;
    $stats['total_resep']      = 0;
    $stats['booking_aktif']    = 0;
    if ($pasienId) {
        $st = $db->prepare('SELECT COUNT(*) FROM rekam_medis WHERE pasien_id=?');
        $st->execute([$pasienId]);
        $stats['total_kunjungan'] = (int)$st->fetchColumn();

        $st = $db->prepare('SELECT COUNT(*) FROM resep WHERE pasien_id=?');
        $st->execute([$pasienId]);
        $stats['total_resep'] = (int)$st->fetchColumn();

        $st = $db->prepare('SELECT COUNT(*) FROM booking WHERE pasien_id=? AND status="Menunggu"');
        $st->execute([$pasienId]);
        $stats['booking_aktif'] = (int)$st->fetchColumn();
    }
}

ok($stats);
