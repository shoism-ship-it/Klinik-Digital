<?php

namespace Klinik\Controllers;

use Klinik\Core\AuthContext;
use Klinik\Core\Request;
use Klinik\Core\Response;

abstract class BaseController
{
    public function __construct(
        protected Request $request,
        protected Response $response,
        protected AuthContext $auth
    ) {
    }

    public function dispatch(string $action): void
    {
        if ($action === '') {
            $action = 'list';
        }

        if (!method_exists($this, $action)) {
            $this->response->error('Action tidak dikenal');
        }

        $this->{$action}();
    }

    protected function input(string $key, mixed $default = null): mixed
    {
        return $this->request->input($key, $default);
    }

    protected function query(string $key, mixed $default = null): mixed
    {
        return $this->request->query($key, $default);
    }
}
