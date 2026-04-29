<?php require_once __DIR__ . '/_api.php';

$db = getPDO();

switch ($action) {
    case 'list':
        $sql = 'SELECT j.*, d.nama AS nama_dokter, d.spesialis
                FROM jadwal j
                JOIN dokter d ON j.dokter_id = d.id
                ORDER BY FIELD(j.hari, "Senin","Selasa","Rabu","Kamis","Jumat","Sabtu","Minggu"), j.jam_mulai';
        $st = $db->prepare($sql);
        $st->execute();
        $data = array_map(function ($r) {
            $r['kode'] = kode('J', $r['id']);
            $r['jam']  = substr($r['jam_mulai'], 0, 5) . ' - ' . substr($r['jam_selesai'], 0, 5);
            return $r;
        }, $st->fetchAll());
        ok($data);

    case 'get':
        $id = (int)($_GET['id'] ?? 0);
        $st = $db->prepare('SELECT j.*, d.nama AS nama_dokter FROM jadwal j JOIN dokter d ON j.dokter_id = d.id WHERE j.id = ?');
        $st->execute([$id]);
        $row = $st->fetch();
        if (!$row) err('Jadwal tidak ditemukan', 404);
        $row['kode'] = kode('J', $row['id']);
        ok($row);

    case 'create':
        $dokter_id  = (int)b('dokter_id', 0);
        $hari       = b('hari', '');
        $jam_mulai  = b('jam_mulai', '');
        $jam_selesai = b('jam_selesai', '');
        if (!$dokter_id || !$hari || !$jam_mulai || !$jam_selesai) err('Dokter, hari, dan jam wajib diisi');
        $st = $db->prepare('INSERT INTO jadwal (dokter_id, hari, jam_mulai, jam_selesai, kuota, status) VALUES (?, ?, ?, ?, ?, ?)');
        $st->execute([$dokter_id, $hari, $jam_mulai, $jam_selesai, (int)b('kuota', 10), b('status', 'Aktif')]);
        $id = (int)$db->lastInsertId();
        ok(['id' => $id, 'kode' => kode('J', $id)], 'Jadwal berhasil ditambahkan');

    case 'update':
        $id         = (int)b('id', 0);
        $dokter_id  = (int)b('dokter_id', 0);
        $hari       = b('hari', '');
        $jam_mulai  = b('jam_mulai', '');
        $jam_selesai = b('jam_selesai', '');
        if (!$id || !$dokter_id || !$hari || !$jam_mulai || !$jam_selesai) err('Data tidak lengkap');
        $st = $db->prepare('UPDATE jadwal SET dokter_id=?, hari=?, jam_mulai=?, jam_selesai=?, kuota=?, status=? WHERE id=?');
        $st->execute([$dokter_id, $hari, $jam_mulai, $jam_selesai, (int)b('kuota', 10), b('status', 'Aktif'), $id]);
        ok(null, 'Jadwal berhasil diperbarui');

    case 'delete':
        $id = (int)b('id', 0);
        if (!$id) err('ID tidak valid');
        $db->prepare('DELETE FROM jadwal WHERE id = ?')->execute([$id]);
        ok(null, 'Jadwal berhasil dihapus');

    default:
        err('Action tidak dikenal');
}
