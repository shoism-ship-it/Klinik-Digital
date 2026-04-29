<?php require_once __DIR__ . '/_api.php';

$db = getPDO();

switch ($action) {
    case 'list':
        $q = $_GET['q'] ?? '';
        $pasien_id = (int)($_GET['pasien_id'] ?? 0);
        $sql = 'SELECT rm.*, p.nama AS nama_pasien, d.nama AS nama_dokter
                FROM rekam_medis rm
                JOIN pasien p ON rm.pasien_id = p.id
                JOIN dokter d ON rm.dokter_id = d.id';
        $params = [];
        $where  = [];
        if ($pasien_id) {
            $where[]  = 'rm.pasien_id = ?';
            $params[] = $pasien_id;
        }
        if ($q !== '') {
            $where[]  = '(p.nama LIKE ? OR d.nama LIKE ? OR rm.diagnosa LIKE ?)';
            $params   = array_merge($params, ["%$q%", "%$q%", "%$q%"]);
        }
        if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
        $sql .= ' ORDER BY rm.tanggal DESC, rm.id DESC';
        $st = $db->prepare($sql);
        $st->execute($params);
        $data = array_map(function ($r) {
            $r['kode'] = kode('RM', $r['id']);
            return $r;
        }, $st->fetchAll());
        ok($data);

    case 'get':
        $id = (int)($_GET['id'] ?? 0);
        $st = $db->prepare('SELECT rm.*, p.nama AS nama_pasien, d.nama AS nama_dokter
                             FROM rekam_medis rm
                             JOIN pasien p ON rm.pasien_id = p.id
                             JOIN dokter d ON rm.dokter_id = d.id
                             WHERE rm.id = ?');
        $st->execute([$id]);
        $row = $st->fetch();
        if (!$row) err('Rekam medis tidak ditemukan', 404);
        $row['kode'] = kode('RM', $row['id']);
        ok($row);

    case 'create':
        $pasien_id = (int)b('pasien_id', 0);
        $dokter_id = (int)b('dokter_id', 0);
        $tanggal   = b('tanggal', '');
        if (!$pasien_id || !$dokter_id || !$tanggal) err('Pasien, dokter, dan tanggal wajib diisi');
        $st = $db->prepare('INSERT INTO rekam_medis (pasien_id, dokter_id, tanggal, keluhan, diagnosa, tindakan, tekanan_darah, berat_badan)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        $st->execute([
            $pasien_id, $dokter_id, $tanggal,
            b('keluhan', ''), b('diagnosa', ''), b('tindakan', ''),
            b('tekanan_darah', ''), b('berat_badan') ?: null,
        ]);
        $id = (int)$db->lastInsertId();
        ok(['id' => $id, 'kode' => kode('RM', $id)], 'Rekam medis berhasil ditambahkan');

    case 'update':
        $id        = (int)b('id', 0);
        $pasien_id = (int)b('pasien_id', 0);
        $dokter_id = (int)b('dokter_id', 0);
        $tanggal   = b('tanggal', '');
        if (!$id || !$pasien_id || !$dokter_id || !$tanggal) err('Data tidak lengkap');
        $st = $db->prepare('UPDATE rekam_medis SET pasien_id=?, dokter_id=?, tanggal=?, keluhan=?, diagnosa=?, tindakan=?, tekanan_darah=?, berat_badan=?
                             WHERE id=?');
        $st->execute([
            $pasien_id, $dokter_id, $tanggal,
            b('keluhan', ''), b('diagnosa', ''), b('tindakan', ''),
            b('tekanan_darah', ''), b('berat_badan') ?: null,
            $id,
        ]);
        ok(null, 'Rekam medis berhasil diperbarui');

    case 'delete':
        $id = (int)b('id', 0);
        if (!$id) err('ID tidak valid');
        $db->prepare('DELETE FROM rekam_medis WHERE id = ?')->execute([$id]);
        ok(null, 'Rekam medis berhasil dihapus');

    default:
        err('Action tidak dikenal');
}
