<?php

namespace Klinik\Controllers;

use Klinik\Repositories\ObatRepository;

class ObatController extends BaseController
{
    private ObatRepository $repo;

    public function __construct(...$args)
    {
        parent::__construct($args[0], $args[1], $args[2]);
        $this->repo = $args[3];
    }

    public function list(): void
    {
        $this->response->ok($this->repo->list((string)$this->query('q', '')));
    }

    public function get(): void
    {
        $row = $this->repo->find((int)$this->query('id', 0));
        if (!$row) {
            $this->response->error('Obat tidak ditemukan', 404);
        }
        $this->response->ok($row);
    }

    public function create(): void
    {
        if (trim((string)$this->input('nama', '')) === '') {
            $this->response->error('Nama obat wajib diisi');
        }
        $this->response->ok($this->repo->create($this->request->body()), 'Obat berhasil ditambahkan');
    }

    public function update(): void
    {
        $id = (int)$this->input('id', 0);
        if (!$id) {
            $this->response->error('ID tidak valid');
        }
        if (trim((string)$this->input('nama', '')) === '') {
            $this->response->error('Nama obat wajib diisi');
        }
        $this->repo->update($id, $this->request->body());
        $this->response->ok(null, 'Obat berhasil diperbarui');
    }

    public function update_stok(): void
    {
        $id = (int)$this->input('id', 0);
        if (!$id) {
            $this->response->error('ID tidak valid');
        }
        $this->response->ok($this->repo->adjustStock($id, (int)$this->input('delta', 0)), 'Stok berhasil diperbarui');
    }

    public function delete(): void
    {
        $id = (int)$this->input('id', 0);
        if (!$id) {
            $this->response->error('ID tidak valid');
        }
        $this->repo->delete($id);
        $this->response->ok(null, 'Obat berhasil dihapus');
    }
<<<<<<< HEAD
}
=======
}
>>>>>>> ac661c2cdbe7a03b19f2b09a25d9d024c6a3215d
