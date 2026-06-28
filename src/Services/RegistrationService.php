<?php

namespace Klinik\Services;

use Klinik\Repositories\UserRepository;
use PDO;

class RegistrationService
{
    public function __construct(private PDO $db, private UserRepository $users)
    {
    }

    public function normalizeRole(string $role): array
    {
        return [
            'raw' => 'mahasiswa',
            'key' => 'pasien',
            'label' => 'Mahasiswa',
        ];
    }

    public function register(array $data): void
    {
        $role = $this->normalizeRole((string)($data['role'] ?? 'pasien'));
        if ($this->users->emailExists($data['email'])) {
            throw new \RuntimeException('Email sudah terdaftar. Gunakan email lain.');
        }

        $this->db->beginTransaction();
        try {
            $userId = $this->users->create([
                'email' => $data['email'],
                'password' => $data['password'],
                'role' => $role['key'],
                'nama' => $data['nama'],
            ]);

            if ($role['key'] === 'pasien') {
                $this->users->createPasienProfile($userId, [
                    'nama' => $data['nama'],
                    'nim' => $data['nim'] ?? '',
                    'prodi' => $data['prodi'] ?? '',
                    'tgl_lahir' => $data['tgl_lahir'] ?? null,
                    'gender' => ($data['gender'] ?? '') === 'Perempuan' ? 'P' : 'L',
                    'hp' => $data['hp'] ?? '',
                    'role_label' => $role['label'],
                ]);
            }

            $this->db->commit();
        } catch (\Throwable $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            throw $e;
        }
    }
}
