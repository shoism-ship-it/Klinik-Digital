<?php

namespace Klinik\Repositories;

class UserRepository extends BaseRepository
{
    public function findByEmail(string $email): ?array
    {
        return $this->fetchOne('SELECT id, nama, role, password FROM users WHERE email = ?', [$email]);
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
                $data['role_label'] ?? 'Pasien',
            ]
        );
    }
}