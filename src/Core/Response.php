<?php

namespace Klinik\Core;

class Response
{
    public function ok(mixed $data = null, string $message = 'OK'): void
    {
        echo json_encode(['ok' => true, 'msg' => $message, 'data' => $data]);
        exit;
    }

    public function error(string $message, int $code = 400): void
    {
        http_response_code($code);
        echo json_encode(['ok' => false, 'msg' => $message]);
        exit;
    }
}
