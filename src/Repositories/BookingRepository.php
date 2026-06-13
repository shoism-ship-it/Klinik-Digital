<?php

namespace Klinik\Repositories;

class BookingRepository extends BaseRepository
{
    public function list(?int $pasienId = null, ?int $dokterId = null): array
    {
        $sql = 'SELECT b.*, p.nama AS nama_pasien, d.nama AS nama_dokter
                FROM booking b
                JOIN pasien p ON b.pasien_id = p.id
                JOIN dokter d ON b.dokter_id = d.id';
        $params = [];
        $where = [];
        if ($pasienId) {
            $where[] = 'b.pasien_id = ?';
            $params[] = $pasienId;
        }
        if ($dokterId) {
            $where[] = 'b.dokter_id = ?';
            $params[] = $dokterId;
        }
        if ($where) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }
        $sql .= ' ORDER BY b.tanggal DESC, COALESCE(b.no_antrian, ""), b.id DESC';

        return array_map(fn ($row) => $this->withCode($row), $this->fetchAll($sql, $params));
    }

    public function find(int $id): ?array
    {
        $row = $this->fetchOne(
            'SELECT b.*, p.nama AS nama_pasien, d.nama AS nama_dokter
             FROM booking b
             JOIN pasien p ON b.pasien_id = p.id
             JOIN dokter d ON b.dokter_id = d.id
             WHERE b.id = ?',
            [$id]
        );
        return $row ? $this->withCode($row) : null;
    }

    public function create(array $data): array
    {
        $dokterId = (int)($data['dokter_id'] ?? 0);
        $tanggal = $data['tanggal'] ?? '';
        $noAntrian = $data['no_antrian'] ?? $this->nextQueueNumber($dokterId, $tanggal);

        $this->execute(
            'INSERT INTO booking (pasien_id, dokter_id, jadwal_id, tanggal, keluhan, status, no_antrian) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                (int)($data['pasien_id'] ?? 0),
                $dokterId,
                !empty($data['jadwal_id']) ? (int)$data['jadwal_id'] : null,
                $tanggal,
                $data['keluhan'] ?? '',
                $data['status'] ?? 'Menunggu',
                $noAntrian,
            ]
        );

        $id = (int)$this->db->lastInsertId();
        return ['id' => $id, 'kode' => $this->code('B', $id), 'no_antrian' => $noAntrian];
    }

    public function update(int $id, array $data): void
    {
        $this->execute(
            'UPDATE booking SET pasien_id=?, dokter_id=?, jadwal_id=?, tanggal=?, keluhan=?, status=? WHERE id=?',
            [
                (int)($data['pasien_id'] ?? 0),
                (int)($data['dokter_id'] ?? 0),
                !empty($data['jadwal_id']) ? (int)$data['jadwal_id'] : null,
                $data['tanggal'] ?? '',
                $data['keluhan'] ?? '',
                $data['status'] ?? 'Menunggu',
                $id,
            ]
        );
    }

    public function updateStatus(int $id, string $status): void
    {
        $this->execute('UPDATE booking SET status = ? WHERE id = ?', [$status, $id]);
    }

    public function delete(int $id): void
    {
        $this->execute('DELETE FROM booking WHERE id = ?', [$id]);
    }

    private function withCode(array $row): array
    {
        $row['kode'] = $this->code('B', (int)$row['id']);
        $row['no_antrian'] = $row['no_antrian'] ?? '-';
        return $row;
    }

    private function nextQueueNumber(int $dokterId, string $tanggal): string
    {
        $count = (int)$this->fetchColumn(
            'SELECT COUNT(*) FROM booking WHERE dokter_id = ? AND tanggal = ?',
            [$dokterId, $tanggal]
        );

        return 'A' . str_pad((string)($count + 1), 3, '0', STR_PAD_LEFT);
    }
}
