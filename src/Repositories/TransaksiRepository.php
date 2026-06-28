<?php

namespace Klinik\Repositories;

class TransaksiRepository extends BaseRepository
{
    public function list(string $q = '', int $pasienId = 0): array
    {
        $sql = 'SELECT t.*, p.nama AS nama_pasien
                FROM transaksi t
                JOIN pasien p ON t.pasien_id = p.id';
        $params = [];
        $where = [];
        if ($q !== '') {
            $where[] = 't.id = ?';
            $params[] = $this->numericId($q);
        }
        if ($pasienId) {
            $where[] = 't.pasien_id = ?';
            $params[] = $pasienId;
        }
        if ($where) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }
        $sql .= ' ORDER BY t.tanggal DESC, t.id DESC';

        return array_map(fn ($row) => $this->withCode($row), $this->fetchAll($sql, $params));
    }

    public function find(int $id): ?array
    {
        $row = $this->fetchOne(
            'SELECT t.*, p.nama AS nama_pasien FROM transaksi t JOIN pasien p ON t.pasien_id = p.id WHERE t.id = ?',
            [$id]
        );

        return $row ? $this->withCode($row) : null;
    }

    public function create(array $data): array
    {
        $this->execute(
            'INSERT INTO transaksi (pasien_id, tanggal, layanan, metode, total, status) VALUES (?, ?, ?, ?, ?, ?)',
            [
                (int)($data['pasien_id'] ?? 0),
                $data['tanggal'] ?? date('Y-m-d'),
                $data['layanan'] ?? '',
                $data['metode'] ?? 'Tunai',
                (int)($data['total'] ?? 0),
                $data['status'] ?? 'Selesai',
            ]
        );

        $id = (int)$this->db->lastInsertId();
        return ['id' => $id, 'kode' => $this->code('T', $id)];
    }

    public function update(int $id, array $data): void
    {
        $this->execute(
            'UPDATE transaksi SET pasien_id=?, tanggal=?, layanan=?, metode=?, total=?, status=? WHERE id=?',
            [
                (int)($data['pasien_id'] ?? 0),
                $data['tanggal'] ?? date('Y-m-d'),
                $data['layanan'] ?? '',
                $data['metode'] ?? 'Tunai',
                (int)($data['total'] ?? 0),
                $data['status'] ?? 'Selesai',
                $id,
            ]
        );
    }

    public function delete(int $id): void
    {
        $this->execute('DELETE FROM transaksi WHERE id = ?', [$id]);
    }

    private function withCode(array $row): array
    {
        $row['kode'] = $this->code('T', (int)$row['id']);
        return $row;
    }
}
