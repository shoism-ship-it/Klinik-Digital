<?php require_once __DIR__ . '/_api.php';

$db = getPDO();

switch ($action) {
    case 'list':
        $q = $_GET['q'] ?? '';
        $sql = 'SELECT * FROM dokter';
        $params = [];
        if ($q !== '') {
            $sql .= ' WHERE nama LIKE ? OR spesialis LIKE ?';
            $params = ["%$q%", "%$q%"];
        }
        $sql .= ' ORDER BY id';
        $st = $db->prepare($sql);
        $st->execute($params);
        $data = array_map(function ($r) {
            $r['kode'] = kode('D', $r['id']);
            return $r;
        }, $st->fetchAll());
        ok($data);

    case 'get':
        $id = (int)($_GET['id'] ?? 0);
        $st = $db->prepare('SELECT * FROM dokter WHERE id = ?');
        $st->execute([$id]);
        $row = $st->fetch();
        if (!$row) err('Dokter tidak ditemukan', 404);
        $row['kode'] = kode('D', $row['id']);
        ok($row);

    case 'create':
        $nama = trim(b('nama', ''));
        if (!$nama) err('Nama wajib diisi');
        $st = $db->prepare('INSERT INTO dokter (nama, spesialis, hari, jam, hp, status) VALUES (?, ?, ?, ?, ?, ?)');
        $st->execute([
            $nama,
            b('spesialis', 'Umum'),
            b('hari', ''),
            b('jam', ''),
            b('hp', ''),
            b('status', 'Aktif'),
        ]);
        $id = (int)$db->lastInsertId();
        ok(['id' => $id, 'kode' => kode('D', $id)], 'Dokter berhasil ditambahkan');

    case 'update':
        $id   = (int)b('id', 0);
        $nama = trim(b('nama', ''));
        if (!$id)   err('ID tidak valid');
        if (!$nama) err('Nama wajib diisi');
        $st = $db->prepare('UPDATE dokter SET nama=?, spesialis=?, hari=?, jam=?, hp=?, status=? WHERE id=?');
        $st->execute([
            $nama,
            b('spesialis', 'Umum'),
            b('hari', ''),
            b('jam', ''),
            b('hp', ''),
            b('status', 'Aktif'),
            $id,
        ]);
        ok(null, 'Dokter berhasil diperbarui');

    case 'delete':
        $id = (int)b('id', 0);
        if (!$id) err('ID tidak valid');
        $db->prepare('DELETE FROM dokter WHERE id = ?')->execute([$id]);
        ok(null, 'Dokter berhasil dihapus');

    default:
        err('Action tidak dikenal');
}
