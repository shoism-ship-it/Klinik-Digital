<?php require_once __DIR__ . '/_api.php';

$db = getPDO();


switch ($action) {
    case 'list':
        $q = $_GET['q'] ?? '';
        $sql = 'SELECT t.*, p.nama AS nama_pasien
                FROM transaksi t
                JOIN pasien p ON t.pasien_id = p.id';
        $params = [];
        if ($q !== '') {
            $sql   .= ' WHERE p.nama LIKE ? OR t.layanan LIKE ? OR t.status LIKE ?';
            $params = ["%$q%", "%$q%", "%$q%"];
        }
        $sql .= ' ORDER BY t.tanggal DESC, t.id DESC';
        $st = $db->prepare($sql);
        $st->execute($params);
        $data = array_map(function ($r) {
            $r['kode'] = kode('T', $r['id']);
            return $r;
        }, $st->fetchAll());
        ok($data);

    case 'create':
        $pasien_id = (int)b('pasien_id', 0);
        $tanggal   = b('tanggal', date('Y-m-d'));
        if (!$pasien_id) err('Pasien wajib dipilih');
        $st = $db->prepare('INSERT INTO transaksi (pasien_id, tanggal, layanan, metode, total, status) VALUES (?, ?, ?, ?, ?, ?)');
        $st->execute([
            $pasien_id, $tanggal,
            b('layanan', ''), b('metode', 'Tunai'),
            (int)b('total', 0), b('status', 'Selesai'),
        ]);
        $id = (int)$db->lastInsertId();
        ok(['id' => $id, 'kode' => kode('T', $id)], 'Transaksi berhasil dicatat');

    case 'update':
        $id        = (int)b('id', 0);
        $pasien_id = (int)b('pasien_id', 0);
        if (!$id || !$pasien_id) err('Data tidak lengkap');
        $st = $db->prepare('UPDATE transaksi SET pasien_id=?, tanggal=?, layanan=?, metode=?, total=?, status=? WHERE id=?');
        $st->execute([
            $pasien_id, b('tanggal', date('Y-m-d')),
            b('layanan', ''), b('metode', 'Tunai'),
            (int)b('total', 0), b('status', 'Selesai'), $id,
        ]);
        ok(null, 'Transaksi berhasil diperbarui');

    case 'delete':
        $id = (int)b('id', 0);
        if (!$id) err('ID tidak valid');
        $db->prepare('DELETE FROM transaksi WHERE id = ?')->execute([$id]);
        ok(null, 'Transaksi berhasil dihapus');

    default:
        err('Action tidak dikenal');
}
