<?php

namespace Klinik\Services;

use Klinik\Repositories\UserRepository;
use PDOException;

class AuthService
{
    public function __construct(private UserRepository $users)
    {
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
