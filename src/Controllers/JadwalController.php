<?php

namespace Klinik\Controllers;

use Klinik\Repositories\JadwalRepository;
use Klinik\Repositories\DokterRepository;

class JadwalController extends BaseController
{
    private JadwalRepository $repo;
    private DokterRepository $dokter;

    public function __construct(...$args)
    {
        parent::__construct($args[0], $args[1], $args[2]);
        $this->repo = $args[3];
        $this->dokter = $args[4];
    }

    public function list(): void
    {
        $dokterId = $this->auth->is('dokter') ? $this->dokter->findIdByName($this->auth->name) : null;
        $this->response->ok($this->repo->list($dokterId ?: null));
    }

    public function get(): void
    {
        $row = $this->repo->find((int)$this->query('id', 0));
        if (!$row) {
            $this->response->error('Jadwal tidak ditemukan', 404);
        }
        $this->response->ok($row);
    }

    public function create(): void
    {
        $this->validatePayload();
        $this->response->ok($this->repo->create($this->request->body()), 'Jadwal berhasil ditambahkan');
    }

    public function update(): void
    {
        $id = (int)$this->input('id', 0);
        if (!$id) {
            $this->response->error('ID tidak valid');
        }
        $this->validatePayload();
        $this->repo->update($id, $this->request->body());
        $this->response->ok(null, 'Jadwal berhasil diperbarui');
    }

    public function delete(): void
    {
        $id = (int)$this->input('id', 0);
        if (!$id) {
            $this->response->error('ID tidak valid');
        }
        $this->repo->delete($id);
        $this->response->ok(null, 'Jadwal berhasil dihapus');
    }

    private function validatePayload(): void
    {
        if (!(int)$this->input('dokter_id', 0) || !$this->input('hari') || !$this->input('jam_mulai') || !$this->input('jam_selesai')) {
            $this->response->error('Dokter, hari, dan jam wajib diisi');
        }
    }
<<<<<<< HEAD
}
=======
}
>>>>>>> ac661c2cdbe7a03b19f2b09a25d9d024c6a3215d
