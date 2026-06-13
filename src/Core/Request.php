<?php

namespace Klinik\Core;

class Request
{
    private ?array $jsonBody = null;

    public function method(): string
    {
        return $_SERVER['REQUEST_METHOD'] ?? 'GET';
    }

    public function action(): string
    {
        return (string)($_GET['action'] ?? '');
    }

    public function query(string $key, mixed $default = null): mixed
    {
        return $_GET[$key] ?? $default;
    }

    public function input(string $key, mixed $default = null): mixed
    {
        $body = $this->body();
        return $body[$key] ?? $default;
    }

    public function body(): array
    {
        if ($this->jsonBody !== null) {
            return $this->jsonBody;
        }

        $raw = file_get_contents('php://input');
        $data = $raw ? json_decode($raw, true) : [];
        if (!is_array($data)) {
            $data = [];
        }
        if (empty($data) && !empty($_POST)) {
            $data = $_POST;
        }

        $this->jsonBody = $data;
        return $this->jsonBody;
    }
}
