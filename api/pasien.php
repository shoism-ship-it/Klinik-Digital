<?php require_once __DIR__ . '/_api.php';

$db = getPDO();


switch ($action) {
    // ── List ──────────────────────────────────
    case 'list':
        $q  = $_GET['q'] ?? '';
        $sql = 'SELECT * FROM pasien';
        $params = [];
        if ($q !== '') {
            $sql .= ' WHERE nama LIKE ? OR nim LIKE ? OR prodi LIKE ?';
            $params = ["%$q%", "%$q%", "%$q%"];
        }
        $sql .= ' ORDER BY id';
        $rows = $db->prepare($sql);
        $rows->execute($params);
        $data = array_map(function ($r) {
            $r['kode'] = kode('P', $r['id']);
            return $r;
        }, $rows->fetchAll());
        ok($data);

    // ── Get single ────────────────────────────
    case 'get':
        $id = (int)($_GET['id'] ?? 0);
        $st = $db->prepare('SELECT * FROM pasien WHERE id = ?');
        $st->execute([$id]);
        $row = $st->fetch();
        if (!$row) err('Pasien tidak ditemukan', 404);
        $row['kode'] = kode('P', $row['id']);
        ok($row);

    // ── Create ────────────────────────────────
    case 'create':
        $nama   = trim(b('nama', ''));
        if (!$nama) err('Nama wajib diisi');
        $st = $db->prepare('INSERT INTO pasien (nama, nim, prodi, tgl_lahir, gender, hp, role, status)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        $st->execute([
            $nama,
            b('nim', ''),
            b('prodi', ''),
            b('tgl_lahir') ?: null,
            b('gender', 'L'),
            b('hp', ''),
            b('role', 'Mahasiswa'),
            b('status', 'Aktif'),
        ]);
        $id = (int)$db->lastInsertId();
        ok(['id' => $id, 'kode' => kode('P', $id)], 'Pasien berhasil ditambahkan');

    // ── Update ────────────────────────────────
    case 'update':
        $id   = (int)b('id', 0);
        $nama = trim(b('nama', ''));
        if (!$id)   err('ID tidak valid');
        if (!$nama) err('Nama wajib diisi');
        $st = $db->prepare('UPDATE pasien SET nama=?, nim=?, prodi=?, tgl_lahir=?, gender=?, hp=?, role=?, status=?
                             WHERE id=?');
        $st->execute([
            $nama,
            b('nim', ''),
            b('prodi', ''),
            b('tgl_lahir') ?: null,
            b('gender', 'L'),
            b('hp', ''),
            b('role', 'Mahasiswa'),
            b('status', 'Aktif'),
            $id,
        ]);
        ok(null, 'Pasien berhasil diperbarui');

    // ── Delete ────────────────────────────────
    case 'delete':
        $id = (int)b('id', 0);
        if (!$id) err('ID tidak valid');
        $db->prepare('DELETE FROM pasien WHERE id = ?')->execute([$id]);
        ok(null, 'Pasien berhasil dihapus');

    default:
        err('Action tidak dikenal');
}
