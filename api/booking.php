<?php require_once __DIR__ . '/_api.php';

$db = getPDO();

switch ($action) {
    case 'list':
        // Pasien only sees their own; admin/dokter see all
        $sql = 'SELECT b.*, p.nama AS nama_pasien, d.nama AS nama_dokter
                FROM booking b
                JOIN pasien p ON b.pasien_id = p.id
                JOIN dokter d ON b.dokter_id = d.id';
        $params = [];
        if ($currentRole === 'pasien' && $currentUserId) {
            $st = $db->prepare('SELECT id FROM pasien WHERE user_id = ?');
            $st->execute([$currentUserId]);
            $pid = $st->fetchColumn();
            if ($pid) {
                $sql   .= ' WHERE b.pasien_id = ?';
                $params = [$pid];
            }
        }
        $sql .= ' ORDER BY b.tanggal DESC, b.id DESC';
        $st = $db->prepare($sql);
        $st->execute($params);
        $data = array_map(function ($r) {
            $r['kode'] = kode('B', $r['id']);
            return $r;
        }, $st->fetchAll());
        ok($data);

    case 'create':
        $pasien_id = (int)b('pasien_id', 0);
        $dokter_id = (int)b('dokter_id', 0);
        $tanggal   = b('tanggal', '');
        if (!$pasien_id || !$dokter_id || !$tanggal) err('Pasien, dokter, dan tanggal wajib diisi');
        $st = $db->prepare('INSERT INTO booking (pasien_id, dokter_id, jadwal_id, tanggal, keluhan, status)
                             VALUES (?, ?, ?, ?, ?, ?)');
        $st->execute([
            $pasien_id, $dokter_id,
            b('jadwal_id') ? (int)b('jadwal_id') : null,
            $tanggal, b('keluhan', ''), b('status', 'Menunggu'),
        ]);
        $id = (int)$db->lastInsertId();
        ok(['id' => $id, 'kode' => kode('B', $id)], 'Booking berhasil dibuat');

    case 'update_status':
        $id     = (int)b('id', 0);
        $status = b('status', '');
        if (!$id || !$status) err('Data tidak lengkap');
        $db->prepare('UPDATE booking SET status = ? WHERE id = ?')->execute([$status, $id]);
        ok(null, 'Status booking diperbarui');

    case 'delete':
        $id = (int)b('id', 0);
        if (!$id) err('ID tidak valid');
        $db->prepare('DELETE FROM booking WHERE id = ?')->execute([$id]);
        ok(null, 'Booking berhasil dihapus');

    default:
        err('Action tidak dikenal');
}
