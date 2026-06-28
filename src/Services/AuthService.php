<?php

namespace Klinik\Services;

use Klinik\Repositories\UserRepository;
use PDOException;

class AuthService
{
    public function __construct(private UserRepository $users)
    {
    }

    public function quickLogin(string $role): ?array
    {
        $roleMap = [
            'admin' => 'admin@polibatam.ac.id',
            'dokter' => 'dokter@polibatam.ac.id',
            'dokter2' => 'hendra@polibatam.ac.id',
            'dokter3' => 'putri@polibatam.ac.id',
            'pasien' => 'pasien@polibatam.ac.id',
        ];

        if (!isset($roleMap[$role])) {
            return null;
        }

        try {
            $user = $this->users->findByEmail($roleMap[$role]);
            if ($user) {
                return ['id' => (int)$user['id'], 'name' => $user['nama'], 'role' => $user['role']];
            }
        } catch (PDOException) {
        }

        $fallback = [
            'admin' => ['id' => null, 'name' => 'Ahmad Admin', 'role' => 'admin'],
            'dokter' => ['id' => null, 'name' => 'dr. Sarah Amalia', 'role' => 'dokter'],
            'dokter2' => ['id' => null, 'name' => 'dr. Hendra Kusuma', 'role' => 'dokter'],
            'dokter3' => ['id' => null, 'name' => 'dr. Putri Maharani', 'role' => 'dokter'],
            'pasien' => ['id' => null, 'name' => 'Andi Pratama', 'role' => 'pasien'],
        ];

        return $fallback[$role] ?? null;
    }

    public function login(string $email, string $password, array $sessionUsers = []): ?array
    {
        try {
            $user = $this->users->findByEmail($email);
            if ($user && $user['password'] === $password) {
                return ['id' => (int)$user['id'], 'name' => $user['nama'], 'role' => $user['role']];
            }
        } catch (PDOException) {
            if (isset($sessionUsers[$email]) && $sessionUsers[$email]['password'] === $password) {
                return ['id' => null, 'name' => $sessionUsers[$email]['name'], 'role' => $sessionUsers[$email]['role']];
            }
        }

        return null;
    }
}
