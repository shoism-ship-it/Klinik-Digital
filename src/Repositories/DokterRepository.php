<?php

namespace Klinik\Repositories;

class DokterRepository extends BaseRepository
{
    public function list(string $q = ''): array
    {
        $sql = 'SELECT * FROM dokter';
        $params = [];
        if ($q !== '') {
            $sql .= ' WHERE nama LIKE ? OR spesialis LIKE ?';
            $params = ["%$q%", "%$q%"];
        }
        $sql .= ' ORDER BY id';

        return array_map(fn ($row) => $this->withCode($row), $this->fetchAll($sql, $params));
    }

    public function find(int $id): ?array
    {
        $row = $this->fetchOne('SELECT * FROM dokter WHERE id = ?', [$id]);
        return $row ? $this->withCode($row) : null;
    }

    public function findIdByName(string $name): int
    {
        return (int)($this->fetchColumn('SELECT id FROM dokter WHERE nama = ?', [$name]) ?: 0);
    }

    public function create(array $data): array
    {
        $this->execute(
            'INSERT INTO dokter (nama, spesialis, hari, jam, hp, status) VALUES (?, ?, ?, ?, ?, ?)',
            [
                trim((string)($data['nama'] ?? '')),
                $data['spesialis'] ?? 'Umum',
                $data['hari'] ?? '',
                $data['jam'] ?? '',
                $data['hp'] ?? '',
                $data['status'] ?? 'Aktif',
            ]
        );

        $id = (int)$this->db->lastInsertId();
        return ['id' => $id, 'kode' => $this->code('D', $id)];
    }

    public function update(int $id, array $data): void
    {
        $this->execute(
            'UPDATE dokter SET nama=?, spesialis=?, hari=?, jam=?, hp=?, status=? WHERE id=?',
            [
                trim((string)($data['nama'] ?? '')),
                $data['spesialis'] ?? 'Umum',
                $data['hari'] ?? '',
                $data['jam'] ?? '',
                $data['hp'] ?? '',
                $data['status'] ?? 'Aktif',
                $id,
            ]
        );
    }

    public function delete(int $id): void
    {
        $this->execute('DELETE FROM dokter WHERE id = ?', [$id]);
    }

    private function withCode(array $row): array
    {
        $row['kode'] = $this->code('D', (int)$row['id']);
        return $row;
    }
}
