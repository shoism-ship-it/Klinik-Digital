<?php

namespace Klinik\Core;

class AuthContext
{
    public function __construct(
        public readonly string $role,
        public readonly string $name,
        public readonly ?int $userId
    ) {
    }

    public static function fromSession(): self
    {
        return new self(
            (string)($_SESSION['role'] ?? ''),
            (string)($_SESSION['name'] ?? ''),
            isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null
        );
    }

    public function is(string $role): bool
    {
        return $this->role === $role;
    }
}
