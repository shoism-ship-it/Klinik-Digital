<?php

namespace Klinik\Repositories;

class PasienRepository extends BaseRepository
{
    public function list(string $q = ''): array
    {
        $sql = 'SELECT * FROM pasien';
        $params = [];
        if ($q !== '') {
            $sql .= ' WHERE id = ?';
            $params = [$this->numericId($q)];
        }
        $sql .= ' ORDER BY id';

        return array_map(fn ($row) => $this->withCode($row), $this->fetchAll($sql, $params));
    }

    public function find(int $id): ?array
    {
        $row = $this->fetchOne('SELECT * FROM pasien WHERE id = ?', [$id]);
        return $row ? $this->withCode($row) : null;
    }

    public function findIdByUserId(int $userId): int
    {
        return (int)($this->fetchColumn('SELECT id FROM pasien WHERE user_id = ?', [$userId]) ?: 0);
    }

    public function create(array $data): array
    {
        $this->execute(
            'INSERT INTO pasien (nama, nim, prodi, tgl_lahir, gender, hp, role, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                trim((string)($data['nama'] ?? '')),
                $data['nim'] ?? '',
                $data['prodi'] ?? '',
                ($data['tgl_lahir'] ?? '') ?: null,
                $data['gender'] ?? 'L',
                $data['hp'] ?? '',
                $data['role'] ?? 'Mahasiswa',
                $data['status'] ?? 'Aktif',
            ]
        );

        $id = (int)$this->db->lastInsertId();
        return ['id' => $id, 'kode' => $this->code('P', $id)];
    }

    public function update(int $id, array $data): void
    {
        $this->execute(
            'UPDATE pasien SET nama=?, nim=?, prodi=?, tgl_lahir=?, gender=?, hp=?, role=?, status=? WHERE id=?',
            [
                trim((string)($data['nama'] ?? '')),
                $data['nim'] ?? '',
                $data['prodi'] ?? '',
                ($data['tgl_lahir'] ?? '') ?: null,
                $data['gender'] ?? 'L',
                $data['hp'] ?? '',
                $data['role'] ?? 'Mahasiswa',
                $data['status'] ?? 'Aktif',
                $id,
            ]
        );
    }

    public function delete(int $id): void
    {
        $this->execute('DELETE FROM pasien WHERE id = ?', [$id]);
    }

    private function withCode(array $row): array
    {
        $row['kode'] = $this->code('P', (int)$row['id']);
        return $row;
    }
}
