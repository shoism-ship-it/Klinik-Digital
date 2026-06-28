<?php

namespace Klinik\Repositories;

class ObatRepository extends BaseRepository
{
    public function list(string $q = ''): array
    {
        $sql = 'SELECT * FROM obat';
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
        $row = $this->fetchOne('SELECT * FROM obat WHERE id = ?', [$id]);
        return $row ? $this->withCode($row) : null;
    }

    public function create(array $data): array
    {
        $this->execute(
            'INSERT INTO obat (nama, kategori, stok, satuan, harga, kadaluarsa) VALUES (?, ?, ?, ?, ?, ?)',
            [
                trim((string)($data['nama'] ?? '')),
                $data['kategori'] ?? '',
                (int)($data['stok'] ?? 0),
                $data['satuan'] ?? 'Tablet',
                (int)($data['harga'] ?? 0),
                ($data['kadaluarsa'] ?? '') ?: null,
            ]
        );

        $id = (int)$this->db->lastInsertId();
        return ['id' => $id, 'kode' => $this->code('O', $id)];
    }

    public function update(int $id, array $data): void
    {
        $this->execute(
            'UPDATE obat SET nama=?, kategori=?, stok=?, satuan=?, harga=?, kadaluarsa=? WHERE id=?',
            [
                trim((string)($data['nama'] ?? '')),
                $data['kategori'] ?? '',
                (int)($data['stok'] ?? 0),
                $data['satuan'] ?? 'Tablet',
                (int)($data['harga'] ?? 0),
                ($data['kadaluarsa'] ?? '') ?: null,
                $id,
            ]
        );
    }

    public function adjustStock(int $id, int $delta): ?array
    {
        $this->execute('UPDATE obat SET stok = GREATEST(0, stok + ?) WHERE id = ?', [$delta, $id]);
        return $this->fetchOne('SELECT stok FROM obat WHERE id = ?', [$id]);
    }

    public function delete(int $id): void
    {
        $this->execute('DELETE FROM obat WHERE id = ?', [$id]);
    }

    private function withCode(array $row): array
    {
        $row['kode'] = $this->code('O', (int)$row['id']);
        return $row;
    }
}
