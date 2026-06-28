<?php

namespace Klinik\Repositories;

use Throwable;

class ResepRepository extends BaseRepository
{
    public function list(string $q = '', int $pasienId = 0, int $dokterId = 0): array
    {
        $sql = 'SELECT r.*, p.nama AS nama_pasien, d.nama AS nama_dokter
                FROM resep r
                JOIN pasien p ON r.pasien_id = p.id
                JOIN dokter d ON r.dokter_id = d.id';
        $params = [];
        $where = [];
        if ($q !== '') {
            $id = $this->numericId($q);
            $where[] = 'r.id = ?';
            $params[] = $id;
        }
        if ($pasienId) {
            $where[] = 'r.pasien_id = ?';
            $params[] = $pasienId;
        }
        if ($dokterId) {
            $where[] = 'r.dokter_id = ?';
            $params[] = $dokterId;
        }
        if ($where) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }
        $sql .= ' ORDER BY r.tanggal DESC, r.id DESC';

        $rows = $this->fetchAll($sql, $params);
        foreach ($rows as &$row) {
            $row = $this->withDetail($row);
        }
        unset($row);

        return $rows;
    }

    public function find(int $id): ?array
    {
        $row = $this->fetchOne(
            'SELECT r.*, p.nama AS nama_pasien, d.nama AS nama_dokter
             FROM resep r
             JOIN pasien p ON r.pasien_id = p.id
             JOIN dokter d ON r.dokter_id = d.id
             WHERE r.id = ?',
            [$id]
        );

        return $row ? $this->withDetail($row) : null;
    }

    public function create(array $data): array
    {
        $this->db->beginTransaction();
        try {
            $this->execute(
                'INSERT INTO resep (rekam_medis_id, pasien_id, dokter_id, tanggal, berlaku_sampai, catatan) VALUES (?, ?, ?, ?, ?, ?)',
                [
                    (int)($data['rekam_medis_id'] ?? 0),
                    (int)($data['pasien_id'] ?? 0),
                    (int)($data['dokter_id'] ?? 0),
                    $data['tanggal'] ?? '',
                    $this->expiryFor($data),
                    $data['catatan'] ?? '',
                ]
            );
            $id = (int)$this->db->lastInsertId();
            $this->replaceDetail($id, $data['detail'] ?? []);
            $this->db->commit();

            return ['id' => $id, 'kode' => $this->code('R', $id)];
        } catch (Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function update(int $id, array $data): void
    {
        $this->db->beginTransaction();
        try {
            $this->execute(
                'UPDATE resep SET pasien_id=?, dokter_id=?, tanggal=?, berlaku_sampai=?, catatan=? WHERE id=?',
                [
                    (int)($data['pasien_id'] ?? 0),
                    (int)($data['dokter_id'] ?? 0),
                    $data['tanggal'] ?? '',
                    $this->expiryFor($data),
                    $data['catatan'] ?? '',
                    $id,
                ]
            );
            $this->execute('DELETE FROM resep_detail WHERE resep_id = ?', [$id]);
            $this->replaceDetail($id, $data['detail'] ?? []);
            $this->db->commit();
        } catch (Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function delete(int $id): void
    {
        $this->execute('DELETE FROM resep WHERE id = ?', [$id]);
    }

    private function withDetail(array $row): array
    {
        $row['detail'] = $this->fetchAll(
            'SELECT rd.*, COALESCE(NULLIF(rd.nama_obat, ""), o.nama, "-") AS nama_obat
             FROM resep_detail rd
             LEFT JOIN obat o ON rd.obat_id = o.id
             WHERE rd.resep_id = ?',
            [(int)$row['id']]
        );
        $row['kode'] = $this->code('R', (int)$row['id']);
        return $row;
    }

    private function replaceDetail(int $resepId, array $detail): void
    {
        foreach ($detail as $item) {
            $this->execute(
                'INSERT INTO resep_detail (resep_id, obat_id, nama_obat, jumlah, aturan) VALUES (?, ?, ?, ?, ?)',
                [
                    $resepId,
                    !empty($item['obat_id']) ? (int)$item['obat_id'] : null,
                    trim((string)($item['nama_obat'] ?? '')),
                    (int)($item['jumlah'] ?? 1),
                    $item['aturan'] ?? '',
                ]
            );
        }
    }

    private function expiryFor(array $data): string
    {
        if (!empty($data['berlaku_sampai'])) {
            return str_replace('T', ' ', (string)$data['berlaku_sampai']);
        }

        $tanggal = (string)($data['tanggal'] ?? date('Y-m-d'));
        return $tanggal . ' 23:59:59';
    }

}
