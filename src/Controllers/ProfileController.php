<?php

namespace Klinik\Controllers;

use Klinik\Repositories\UserRepository;

class ProfileController extends BaseController
{
    private UserRepository $users;

    public function __construct(...$args)
    {
        parent::__construct($args[0], $args[1], $args[2]);
        $this->users = $args[3];
    }

    public function get(): void
    {
        if (!$this->auth->userId) {
            $this->response->error('Profile demo tidak tersimpan di database', 400);
        }

        $profile = $this->users->profile($this->auth->userId);
        if (!$profile) {
            $this->response->error('Profile tidak ditemukan', 404);
        }

        $this->response->ok($profile);
    }

    public function update(): void
    {
        if (!$this->auth->userId) {
            $this->response->error('Profile demo tidak tersimpan di database', 400);
        }

        try {
            $profile = $this->users->updateProfile($this->auth->userId, $this->request->body());
            $_SESSION['name'] = $profile['nama'] ?? $this->auth->name;
            $this->response->ok($profile, 'Profile berhasil diperbarui');
        } catch (\RuntimeException $e) {
            $this->response->error($e->getMessage());
        }
    }
}
