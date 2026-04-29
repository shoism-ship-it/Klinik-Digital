<?php require_once __DIR__ . '/_api.php';

$db = getPDO();

switch ($action) {
    case 'list':
        $q = $_GET['q'] ?? '';
        $sql = 'SELECT r.*, p.nama AS nama_pasien, d.nama AS nama_dokter
                FROM resep r
                JOIN pasien p ON r.pasien_id = p.id
                JOIN dokter d ON r.dokter_id = d.id';
        $params = [];
        if ($q !== '') {
            $sql   .= ' WHERE p.nama LIKE ? OR d.nama LIKE ?';
            $params = ["%$q%", "%$q%"];
        }
        $sql .= ' ORDER BY r.tanggal DESC, r.id DESC';
        $st = $db->prepare($sql);
        $st->execute($params);
        $reseps = $st->fetchAll();

        // Fetch detail for each
        $detSt = $db->prepare('SELECT rd.*, o.nama AS nama_obat FROM resep_detail rd JOIN obat o ON rd.obat_id = o.id WHERE rd.resep_id = ?');
        foreach ($reseps as &$res) {
            $detSt->execute([$res['id']]);
            $res['detail'] = $detSt->fetchAll();
            $res['kode']   = kode('R', $res['id']);
        }
        ok($reseps);

    case 'get':
        $id = (int)($_GET['id'] ?? 0);
        $st = $db->prepare('SELECT r.*, p.nama AS nama_pasien, d.nama AS nama_dokter
                             FROM resep r
                             JOIN pasien p ON r.pasien_id = p.id
                             JOIN dokter d ON r.dokter_id = d.id
                             WHERE r.id = ?');
        $st->execute([$id]);
        $row = $st->fetch();
        if (!$row) err('Resep tidak ditemukan', 404);
        $detSt = $db->prepare('SELECT rd.*, o.nama AS nama_obat FROM resep_detail rd JOIN obat o ON rd.obat_id = o.id WHERE rd.resep_id = ?');
        $detSt->execute([$id]);
        $row['detail'] = $detSt->fetchAll();
        $row['kode']   = kode('R', $row['id']);
        ok($row);

    case 'create':
        $pasien_id     = (int)b('pasien_id', 0);
        $dokter_id     = (int)b('dokter_id', 0);
        $rekam_medis_id = (int)b('rekam_medis_id', 0);
        $tanggal       = b('tanggal', '');
        $detail        = b('detail', []);
        if (!$pasien_id || !$dokter_id || !$tanggal) err('Pasien, dokter, dan tanggal wajib diisi');
        if (empty($detail)) err('Minimal satu item obat wajib diisi');

        // If no rekam_medis_id given, pick the latest one for this pasien
        if (!$rekam_medis_id) {
            $st = $db->prepare('SELECT id FROM rekam_medis WHERE pasien_id = ? ORDER BY id DESC LIMIT 1');
            $st->execute([$pasien_id]);
            $rm = $st->fetchColumn();
            $rekam_medis_id = $rm ?: 0;
        }
        if (!$rekam_medis_id) err('Pasien belum memiliki rekam medis');

        $db->beginTransaction();
        try {
            $st = $db->prepare('INSERT INTO resep (rekam_medis_id, pasien_id, dokter_id, tanggal, catatan) VALUES (?, ?, ?, ?, ?)');
            $st->execute([$rekam_medis_id, $pasien_id, $dokter_id, $tanggal, b('catatan', '')]);
            $resepId = (int)$db->lastInsertId();

            $detSt = $db->prepare('INSERT INTO resep_detail (resep_id, obat_id, jumlah, aturan) VALUES (?, ?, ?, ?)');
            foreach ($detail as $item) {
                $detSt->execute([$resepId, (int)$item['obat_id'], (int)$item['jumlah'], $item['aturan'] ?? '']);
            }
            $db->commit();
            ok(['id' => $resepId, 'kode' => kode('R', $resepId)], 'Resep berhasil dibuat');
        } catch (Throwable $e) {
            $db->rollBack();
            err('Gagal menyimpan resep: ' . $e->getMessage());
        }

    case 'update':
        $id        = (int)b('id', 0);
        $pasien_id = (int)b('pasien_id', 0);
        $dokter_id = (int)b('dokter_id', 0);
        $tanggal   = b('tanggal', '');
        $detail    = b('detail', []);
        if (!$id || !$pasien_id || !$dokter_id || !$tanggal) err('Data tidak lengkap');
        if (empty($detail)) err('Minimal satu item obat wajib diisi');

        $db->beginTransaction();
        try {
            $st = $db->prepare('UPDATE resep SET pasien_id=?, dokter_id=?, tanggal=?, catatan=? WHERE id=?');
            $st->execute([$pasien_id, $dokter_id, $tanggal, b('catatan', ''), $id]);
            $db->prepare('DELETE FROM resep_detail WHERE resep_id = ?')->execute([$id]);
            $detSt = $db->prepare('INSERT INTO resep_detail (resep_id, obat_id, jumlah, aturan) VALUES (?, ?, ?, ?)');
            foreach ($detail as $item) {
                $detSt->execute([$id, (int)$item['obat_id'], (int)$item['jumlah'], $item['aturan'] ?? '']);
            }
            $db->commit();
            ok(null, 'Resep berhasil diperbarui');
        } catch (Throwable $e) {
            $db->rollBack();
            err('Gagal memperbarui resep: ' . $e->getMessage());
        }

    case 'delete':
        $id = (int)b('id', 0);
        if (!$id) err('ID tidak valid');
        $db->prepare('DELETE FROM resep WHERE id = ?')->execute([$id]);
        ok(null, 'Resep berhasil dihapus');

    default:
        err('Action tidak dikenal');
}
