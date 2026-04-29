<?php require_once __DIR__ . '/_api.php';

$db = getPDO();

switch ($action) {
    case 'list':
        $q = $_GET['q'] ?? '';
        $sql = 'SELECT * FROM obat';
        $params = [];
        if ($q !== '') {
            $sql .= ' WHERE nama LIKE ? OR kategori LIKE ?';
            $params = ["%$q%", "%$q%"];
        }
        $sql .= ' ORDER BY id';
        $st = $db->prepare($sql);
        $st->execute($params);
        $data = array_map(function ($r) {
            $r['kode'] = kode('O', $r['id']);
            return $r;
        }, $st->fetchAll());
        ok($data);

    case 'get':
        $id = (int)($_GET['id'] ?? 0);
        $st = $db->prepare('SELECT * FROM obat WHERE id = ?');
        $st->execute([$id]);
        $row = $st->fetch();
        if (!$row) err('Obat tidak ditemukan', 404);
        $row['kode'] = kode('O', $row['id']);
        ok($row);

    case 'create':
        $nama = trim(b('nama', ''));
        if (!$nama) err('Nama obat wajib diisi');
        $st = $db->prepare('INSERT INTO obat (nama, kategori, stok, satuan, harga, kadaluarsa) VALUES (?, ?, ?, ?, ?, ?)');
        $st->execute([
            $nama,
            b('kategori', ''),
            (int)b('stok', 0),
            b('satuan', 'Tablet'),
            (int)b('harga', 0),
            b('kadaluarsa') ?: null,
        ]);
        $id = (int)$db->lastInsertId();
        ok(['id' => $id, 'kode' => kode('O', $id)], 'Obat berhasil ditambahkan');

    case 'update':
        $id   = (int)b('id', 0);
        $nama = trim(b('nama', ''));
        if (!$id)   err('ID tidak valid');
        if (!$nama) err('Nama obat wajib diisi');
        $st = $db->prepare('UPDATE obat SET nama=?, kategori=?, stok=?, satuan=?, harga=?, kadaluarsa=? WHERE id=?');
        $st->execute([
            $nama,
            b('kategori', ''),
            (int)b('stok', 0),
            b('satuan', 'Tablet'),
            (int)b('harga', 0),
            b('kadaluarsa') ?: null,
            $id,
        ]);
        ok(null, 'Obat berhasil diperbarui');

    case 'update_stok':
        $id    = (int)b('id', 0);
        $delta = (int)b('delta', 0);
        if (!$id) err('ID tidak valid');
        $db->prepare('UPDATE obat SET stok = GREATEST(0, stok + ?) WHERE id = ?')->execute([$delta, $id]);
        $st = $db->prepare('SELECT stok FROM obat WHERE id = ?');
        $st->execute([$id]);
        $row = $st->fetch();
        ok(['stok' => $row['stok']], 'Stok berhasil diperbarui');

    case 'delete':
        $id = (int)b('id', 0);
        if (!$id) err('ID tidak valid');
        $db->prepare('DELETE FROM obat WHERE id = ?')->execute([$id]);
        ok(null, 'Obat berhasil dihapus');

    default:
        err('Action tidak dikenal');
}
