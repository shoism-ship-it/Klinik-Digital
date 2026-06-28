<?php

namespace Klinik\Repositories;

use RuntimeException;

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

    public function waitingList(): array
    {
        return array_map(fn ($row) => $this->withCode($row), $this->fetchAll(
            'SELECT b.*, p.nama AS nama_pasien, d.nama AS nama_dokter
             FROM booking b
             JOIN pasien p ON b.pasien_id = p.id
             JOIN dokter d ON b.dokter_id = d.id
             WHERE b.status = "Menunggu"
             ORDER BY b.tanggal ASC, COALESCE(b.no_antrian, ""), b.id ASC'
        ));
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
        $slot = $this->activeSlot($dokterId, $tanggal);
        if (!$slot) {
            throw new RuntimeException('Dokter tidak praktik pada tanggal tersebut.');
        }
        $this->ensureAvailable($dokterId, $tanggal);
        $noAntrian = $data['no_antrian'] ?? $this->nextQueueNumber($dokterId, $tanggal);

        $this->execute(
            'INSERT INTO booking (pasien_id, dokter_id, jadwal_id, tanggal, keluhan, status, no_antrian) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                (int)($data['pasien_id'] ?? 0),
                $dokterId,
                !empty($data['jadwal_id']) ? (int)$data['jadwal_id'] : (int)$slot['id'],
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
        $dokterId = (int)($data['dokter_id'] ?? 0);
        $tanggal = $data['tanggal'] ?? '';
        $slot = $this->activeSlot($dokterId, $tanggal);
        if (!$slot) {
            throw new RuntimeException('Dokter tidak praktik pada tanggal tersebut.');
        }
        $this->ensureAvailable($dokterId, $tanggal, $id);
        $this->execute(
            'UPDATE booking SET pasien_id=?, dokter_id=?, jadwal_id=?, tanggal=?, keluhan=?, status=?, no_antrian=? WHERE id=?',
            [
                (int)($data['pasien_id'] ?? 0),
                $dokterId,
                !empty($data['jadwal_id']) ? (int)$data['jadwal_id'] : (int)$slot['id'],
                $tanggal,
                $data['keluhan'] ?? '',
                $data['status'] ?? 'Menunggu',
                $data['no_antrian'] ?? $this->nextQueueNumber($dokterId, $tanggal, $id),
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

    public function availability(string $tanggal): array
    {
        $hari = $this->dayName($tanggal);
        $rows = $this->fetchAll(
            'SELECT d.id, d.nama, d.spesialis, d.hari, d.jam, d.status, j.id AS jadwal_id, j.kuota
             FROM dokter d
             LEFT JOIN jadwal j ON j.dokter_id = d.id AND j.hari = ? AND j.status = "Aktif"
             WHERE d.status = "Aktif"
             ORDER BY d.id',
            [$hari]
        );

        return array_map(function ($row) use ($tanggal, $hari) {
            $kuota = (int)($row['kuota'] ?? 0);
            $terisi = $row['jadwal_id'] ? $this->bookedCount((int)$row['id'], $tanggal) : 0;
            $row['kode'] = $this->code('D', (int)$row['id']);
            $row['tanggal'] = $tanggal;
            $row['hari_tanggal'] = $hari;
            $row['kuota'] = $kuota;
            $row['terisi'] = $terisi;
            $row['sisa'] = max(0, $kuota - $terisi);
            $row['buka'] = (bool)$row['jadwal_id'];
            $row['full'] = $row['buka'] && $terisi >= $kuota;
            return $row;
        }, $rows);
    }

    private function withCode(array $row): array
    {
        $row['kode'] = $this->code('B', (int)$row['id']);
        $row['no_antrian'] = $row['no_antrian'] ?? '-';
        return $row;
    }

    private function nextQueueNumber(int $dokterId, string $tanggal, int $excludeId = 0): string
    {
        $params = [$dokterId, $tanggal];
        $where = 'dokter_id = ? AND tanggal = ?';
        if ($excludeId) {
            $where .= ' AND id <> ?';
            $params[] = $excludeId;
        }
        $count = (int)$this->fetchColumn("SELECT COUNT(*) FROM booking WHERE $where", $params);

        return 'A' . str_pad((string)($count + 1), 3, '0', STR_PAD_LEFT);
    }

    private function ensureAvailable(int $dokterId, string $tanggal, int $excludeId = 0): void
    {
        $slot = $this->activeSlot($dokterId, $tanggal);
        if (!$slot) {
            throw new RuntimeException('Dokter tidak praktik pada tanggal tersebut.');
        }
        if ($this->bookedCount($dokterId, $tanggal, $excludeId) >= (int)$slot['kuota']) {
            throw new RuntimeException('Kuota booking dokter pada tanggal tersebut sudah penuh.');
        }
    }

    private function activeSlot(int $dokterId, string $tanggal): ?array
    {
        if (!$dokterId || !$tanggal) {
            return null;
        }
        return $this->fetchOne(
            'SELECT * FROM jadwal WHERE dokter_id = ? AND hari = ? AND status = "Aktif" LIMIT 1',
            [$dokterId, $this->dayName($tanggal)]
        );
    }

    private function bookedCount(int $dokterId, string $tanggal, int $excludeId = 0): int
    {
        $params = [$dokterId, $tanggal];
        $where = 'dokter_id = ? AND tanggal = ? AND status IN ("Menunggu", "Dikonfirmasi")';
        if ($excludeId) {
            $where .= ' AND id <> ?';
            $params[] = $excludeId;
        }
        return (int)$this->fetchColumn("SELECT COUNT(*) FROM booking WHERE $where", $params);
    }

    private function dayName(string $tanggal): string
    {
        $names = [
            1 => 'Senin',
            2 => 'Selasa',
            3 => 'Rabu',
            4 => 'Kamis',
            5 => 'Jumat',
            6 => 'Sabtu',
            7 => 'Minggu',
        ];
        $day = (int)date('N', strtotime($tanggal));
        return $names[$day] ?? 'Senin';
    }
}
