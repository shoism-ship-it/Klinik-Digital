<?php

namespace Klinik\Controllers;

use Klinik\Repositories\TransaksiRepository;
use Klinik\Repositories\PasienRepository;

class TransaksiController extends BaseController
{
    private TransaksiRepository $repo;
    private PasienRepository $pasien;

    public function __construct(...$args)
    {
        parent::__construct($args[0], $args[1], $args[2]);
        $this->repo = $args[3];
        $this->pasien = $args[4];
    }

    public function list(): void
    {
        $pasienId = 0;
        if ($this->auth->is('pasien') && $this->auth->userId) {
            $pasienId = $this->pasien->findIdByUserId($this->auth->userId);
        }
        $this->response->ok($this->repo->list((string)$this->query('q', ''), $pasienId));
    }

    public function get(): void
    {
        $row = $this->repo->find((int)$this->query('id', 0));
        if (!$row) {
            $this->response->error('Transaksi tidak ditemukan', 404);
        }
        if ($this->auth->is('pasien') && $this->auth->userId) {
            $pasienId = $this->pasien->findIdByUserId($this->auth->userId);
            if ($pasienId && (int)$row['pasien_id'] !== $pasienId) {
                $this->response->error('Akses transaksi ditolak', 403);
            }
        }
        $this->response->ok($row);
    }

    public function create(): void
    {
        if ($this->auth->is('pasien')) {
            $this->response->error('Pasien tidak dapat membuat transaksi', 403);
        }
        $this->validatePayload();
        $this->response->ok($this->repo->create($this->request->body()), 'Transaksi berhasil dicatat');
    }

    public function update(): void
    {
        if ($this->auth->is('pasien')) {
            $this->response->error('Pasien tidak dapat mengubah transaksi', 403);
        }
        $id = (int)$this->input('id', 0);
        if (!$id) {
            $this->response->error('ID tidak valid');
        }
        $this->validatePayload();
        $this->repo->update($id, $this->request->body());
        $this->response->ok(null, 'Transaksi berhasil diperbarui');
    }

    public function delete(): void
    {
        if ($this->auth->is('pasien')) {
            $this->response->error('Pasien tidak dapat menghapus transaksi', 403);
        }
        $id = (int)$this->input('id', 0);
        if (!$id) {
            $this->response->error('ID tidak valid');
        }
        $this->repo->delete($id);
        $this->response->ok(null, 'Transaksi berhasil dihapus');
    }

    private function validatePayload(): void
    {
        if (!(int)$this->input('pasien_id', 0)) {
            $this->response->error('Pasien wajib dipilih');
        }
    }
}
