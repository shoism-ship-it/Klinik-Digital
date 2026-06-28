<?php

namespace Klinik\Repositories;

class UserRepository extends BaseRepository
{
    public function findByEmail(string $email): ?array
    {
        return $this->fetchOne('SELECT id, nama, role, password FROM users WHERE email = ?', [$email]);
    }

    public function findFullByEmail(string $email): ?array
    {
        return $this->fetchOne('SELECT id, email, nama, role, password FROM users WHERE email = ?', [$email]);
    }

    public function findById(int $id): ?array
    {
        return $this->fetchOne('SELECT id, email, nama, role FROM users WHERE id = ?', [$id]);
    }

    public function emailExists(string $email): bool
    {
        return (bool)$this->fetchColumn('SELECT id FROM users WHERE email = ?', [$email]);
    }

    public function create(array $data): int
    {
        $this->execute(
            'INSERT INTO users (email, password, role, nama) VALUES (?, ?, ?, ?)',
            [$data['email'], $data['password'], $data['role'], $data['nama']]
        );

        return (int)$this->db->lastInsertId();
    }

    public function createPasienProfile(int $userId, array $data): void
    {
        $this->execute(
            'INSERT INTO pasien (user_id, nama, nim, prodi, tgl_lahir, gender, hp, role, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, "Aktif")',
            [
                $userId,
                $data['nama'],
                $data['nim'] ?? '',
                $data['prodi'] ?? '',
                ($data['tgl_lahir'] ?? '') ?: null,
                $data['gender'] ?? 'L',
                $data['hp'] ?? '',
                $data['role_label'] ?? 'Mahasiswa',
            ]
        );
    }

    public function profile(int $userId): ?array
    {
        $user = $this->findById($userId);
        if (!$user) {
            return null;
        }

        $profile = [
            'user_id' => (int)$user['id'],
            'email' => $user['email'],
            'nama' => $user['nama'],
            'role' => $user['role'],
            'nim' => '',
            'prodi' => '',
            'tgl_lahir' => '',
            'gender' => 'L',
            'hp' => '',
            'status' => '',
        ];

        if ($user['role'] === 'pasien') {
            $pasien = $this->fetchOne('SELECT * FROM pasien WHERE user_id = ?', [$userId]);
            if ($pasien) {
                $profile = array_merge($profile, [
                    'pasien_id' => (int)$pasien['id'],
                    'nama' => $pasien['nama'],
                    'nim' => $pasien['nim'] ?? '',
                    'prodi' => $pasien['prodi'] ?? '',
                    'tgl_lahir' => $pasien['tgl_lahir'] ?? '',
                    'gender' => $pasien['gender'] ?? 'L',
                    'hp' => $pasien['hp'] ?? '',
                    'status' => $pasien['status'] ?? '',
                ]);
            }
        }

        if ($user['role'] === 'dokter') {
            $dokter = $this->fetchOne('SELECT * FROM dokter WHERE nama = ?', [$user['nama']]);
            if ($dokter) {
                $profile = array_merge($profile, [
                    'dokter_id' => (int)$dokter['id'],
                    'spesialis' => $dokter['spesialis'] ?? '',
                    'hari' => $dokter['hari'] ?? '',
                    'jam' => $dokter['jam'] ?? '',
                    'hp' => $dokter['hp'] ?? '',
                    'status' => $dokter['status'] ?? '',
                ]);
            }
        }

        return $profile;
    }

    public function updateProfile(int $userId, array $data): array
    {
        $user = $this->findById($userId);
        if (!$user) {
            throw new \RuntimeException('User tidak ditemukan.');
        }

        $nama = trim((string)($data['nama'] ?? $user['nama']));
        if ($nama === '') {
            throw new \RuntimeException('Nama wajib diisi.');
        }

        $this->execute('UPDATE users SET nama = ? WHERE id = ?', [$nama, $userId]);

        if ($user['role'] === 'pasien') {
            $this->execute(
                'UPDATE pasien SET nama=?, nim=?, prodi=?, tgl_lahir=?, gender=?, hp=? WHERE user_id=?',
                [
                    $nama,
                    $data['nim'] ?? '',
                    $data['prodi'] ?? '',
                    ($data['tgl_lahir'] ?? '') ?: null,
                    $data['gender'] ?? 'L',
                    $data['hp'] ?? '',
                    $userId,
                ]
            );
        }

        if ($user['role'] === 'dokter') {
            $this->execute(
                'UPDATE dokter SET nama=?, hp=? WHERE nama=?',
                [$nama, $data['hp'] ?? '', $user['nama']]
            );
        }

        if (!empty($data['password'])) {
            $this->execute('UPDATE users SET password = ? WHERE id = ?', [$data['password'], $userId]);
        }

        return $this->profile($userId) ?? [];
    }

    public function resetPasswordWithIdentity(string $email, string $nama, string $identity, string $password): void
    {
        $user = $this->findFullByEmail($email);
        if (!$user || strcasecmp(trim($user['nama']), trim($nama)) !== 0) {
            throw new \RuntimeException('Data akun tidak cocok.');
        }

        $identity = trim($identity);
        if ($identity !== '') {
            if ($user['role'] === 'pasien') {
                $pasien = $this->fetchOne('SELECT nim, hp FROM pasien WHERE user_id = ?', [(int)$user['id']]);
                $matches = $pasien && ($identity === (string)($pasien['nim'] ?? '') || $identity === (string)($pasien['hp'] ?? ''));
                if (!$matches) {
                    throw new \RuntimeException('NIM atau No HP tidak cocok.');
                }
            }
            if ($user['role'] === 'dokter') {
                $dokter = $this->fetchOne('SELECT hp FROM dokter WHERE nama = ?', [$user['nama']]);
                if ($dokter && $identity !== (string)($dokter['hp'] ?? '')) {
                    throw new \RuntimeException('No HP dokter tidak cocok.');
                }
            }
        }

        $this->execute('UPDATE users SET password = ? WHERE id = ?', [$password, (int)$user['id']]);
    }
}
