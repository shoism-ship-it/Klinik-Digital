<?php

namespace Klinik\Repositories;

use PDO;

abstract class BaseRepository
{
    public function __construct(protected PDO $db)
    {
    }

    protected function fetchAll(string $sql, array $params = []): array
    {
        $st = $this->db->prepare($sql);
        $st->execute($params);
        return $st->fetchAll();
    }

    protected function fetchOne(string $sql, array $params = []): ?array
    {
        $st = $this->db->prepare($sql);
        $st->execute($params);
        $row = $st->fetch();
        return $row ?: null;
    }

    protected function fetchColumn(string $sql, array $params = []): mixed
    {
        $st = $this->db->prepare($sql);
        $st->execute($params);
        return $st->fetchColumn();
    }

    protected function execute(string $sql, array $params = []): void
    {
        $st = $this->db->prepare($sql);
        $st->execute($params);
    }

    protected function code(string $prefix, int $id): string
    {
        return $prefix . str_pad((string)$id, 3, '0', STR_PAD_LEFT);
    }
}
