<?php

namespace Klinik\Repositories;

class JadwalRepository extends BaseRepository
{
    public function list(?int $dokterId = null): array
    {
        $sql = 'SELECT j.*, d.nama AS nama_dokter, d.spesialis
                FROM jadwal j
                JOIN dokter d ON j.dokter_id = d.id';
        $params = [];
        if ($dokterId) {
            $sql .= ' WHERE j.dokter_id = ?';
            $params[] = $dokterId;
        }
        $sql .= ' ORDER BY FIELD(j.hari, "Senin","Selasa","Rabu","Kamis","Jumat","Sabtu","Minggu"), j.jam_mulai';

        $rows = $this->fetchAll($sql, $params);

        return array_map(fn ($row) => $this->withCode($row), $rows);
    }

    public function find(int $id): ?array
    {
        $row = $this->fetchOne(
            'SELECT j.*, d.nama AS nama_dokter FROM jadwal j JOIN dokter d ON j.dokter_id = d.id WHERE j.id = ?',
            [$id]
        );

        return $row ? $this->withCode($row) : null;
    }

    public function create(array $data): array
    {
        $this->execute(
            'INSERT INTO jadwal (dokter_id, hari, jam_mulai, jam_selesai, kuota, status) VALUES (?, ?, ?, ?, ?, ?)',
            [
                (int)($data['dokter_id'] ?? 0),
                $data['hari'] ?? '',
                $data['jam_mulai'] ?? '',
                $data['jam_selesai'] ?? '',
                (int)($data['kuota'] ?? 10),
                $data['status'] ?? 'Aktif',
            ]
        );

        $id = (int)$this->db->lastInsertId();
        return ['id' => $id, 'kode' => $this->code('J', $id)];
    }

    public function update(int $id, array $data): void
    {
        $this->execute(
            'UPDATE jadwal SET dokter_id=?, hari=?, jam_mulai=?, jam_selesai=?, kuota=?, status=? WHERE id=?',
            [
                (int)($data['dokter_id'] ?? 0),
                $data['hari'] ?? '',
                $data['jam_mulai'] ?? '',
                $data['jam_selesai'] ?? '',
                (int)($data['kuota'] ?? 10),
                $data['status'] ?? 'Aktif',
                $id,
            ]
        );
    }

    public function delete(int $id): void
    {
        $this->execute('DELETE FROM jadwal WHERE id = ?', [$id]);
    }

    private function withCode(array $row): array
    {
        $row['kode'] = $this->code('J', (int)$row['id']);
        if (isset($row['jam_mulai'], $row['jam_selesai'])) {
            $row['jam'] = substr((string)$row['jam_mulai'], 0, 5) . ' - ' . substr((string)$row['jam_selesai'], 0, 5);
        }
        return $row;
    }
}
