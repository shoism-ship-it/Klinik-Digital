<?php

namespace Klinik\Repositories;

class RekamMedisRepository extends BaseRepository
{
    public function list(string $q = '', int $pasienId = 0, int $dokterId = 0): array
    {
        $sql = 'SELECT rm.*, p.nama AS nama_pasien, d.nama AS nama_dokter
                FROM rekam_medis rm
                JOIN pasien p ON rm.pasien_id = p.id
                JOIN dokter d ON rm.dokter_id = d.id';
        $params = [];
        $where = [];

        if ($pasienId) {
            $where[] = 'rm.pasien_id = ?';
            $params[] = $pasienId;
        }
        if ($dokterId) {
            $where[] = 'rm.dokter_id = ?';
            $params[] = $dokterId;
        }
        if ($q !== '') {
            $where[] = 'rm.id = ?';
            $params[] = $this->numericId($q);
        }
        if ($where) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }
        $sql .= ' ORDER BY rm.tanggal DESC, rm.id DESC';

        return array_map(fn ($row) => $this->withCode($row), $this->fetchAll($sql, $params));
    }

    public function find(int $id): ?array
    {
        $row = $this->fetchOne(
            'SELECT rm.*, p.nama AS nama_pasien, d.nama AS nama_dokter
             FROM rekam_medis rm
             JOIN pasien p ON rm.pasien_id = p.id
             JOIN dokter d ON rm.dokter_id = d.id
             WHERE rm.id = ?',
            [$id]
        );

        return $row ? $this->withCode($row) : null;
    }

    public function latestIdForPatient(int $pasienId): int
    {
        return (int)($this->fetchColumn('SELECT id FROM rekam_medis WHERE pasien_id = ? ORDER BY id DESC LIMIT 1', [$pasienId]) ?: 0);
    }

    public function create(array $data): array
    {
        $this->execute(
            'INSERT INTO rekam_medis (pasien_id, dokter_id, tanggal, keluhan, diagnosa, tindakan, tekanan_darah, berat_badan)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                (int)($data['pasien_id'] ?? 0),
                (int)($data['dokter_id'] ?? 0),
                $data['tanggal'] ?? '',
                $data['keluhan'] ?? '',
                $data['diagnosa'] ?? '',
                $data['tindakan'] ?? '',
                $data['tekanan_darah'] ?? '',
                ($data['berat_badan'] ?? '') ?: null,
            ]
        );

        $id = (int)$this->db->lastInsertId();
        return ['id' => $id, 'kode' => $this->code('RM', $id)];
    }

    public function update(int $id, array $data): void
    {
        $this->execute(
            'UPDATE rekam_medis SET pasien_id=?, dokter_id=?, tanggal=?, keluhan=?, diagnosa=?, tindakan=?, tekanan_darah=?, berat_badan=? WHERE id=?',
            [
                (int)($data['pasien_id'] ?? 0),
                (int)($data['dokter_id'] ?? 0),
                $data['tanggal'] ?? '',
                $data['keluhan'] ?? '',
                $data['diagnosa'] ?? '',
                $data['tindakan'] ?? '',
                $data['tekanan_darah'] ?? '',
                ($data['berat_badan'] ?? '') ?: null,
                $id,
            ]
        );
    }

    public function delete(int $id): void
    {
        $this->execute('DELETE FROM rekam_medis WHERE id = ?', [$id]);
    }

    private function withCode(array $row): array
    {
        $row['kode'] = $this->code('RM', (int)$row['id']);
        $row['resep'] = $this->resepFor((int)$row['id']);
        return $row;
    }

    private function resepFor(int $rekamMedisId): ?array
    {
        $resep = $this->fetchOne('SELECT * FROM resep WHERE rekam_medis_id = ? ORDER BY id DESC LIMIT 1', [$rekamMedisId]);
        if (!$resep) {
            return null;
        }
        $resep['kode'] = $this->code('R', (int)$resep['id']);
        $resep['detail'] = $this->fetchAll(
            'SELECT rd.*, COALESCE(NULLIF(rd.nama_obat, ""), o.nama, "-") AS nama_obat
             FROM resep_detail rd
             LEFT JOIN obat o ON rd.obat_id = o.id
             WHERE rd.resep_id = ?',
            [(int)$resep['id']]
        );
        return $resep;
    }
}
