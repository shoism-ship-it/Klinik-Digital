<?php

namespace Klinik\Controllers;

use Klinik\Repositories\BookingRepository;
use Klinik\Repositories\DokterRepository;
use Klinik\Repositories\PasienRepository;
use RuntimeException;

class BookingController extends BaseController
{
    private BookingRepository $repo;
    private PasienRepository $pasien;
    private DokterRepository $dokter;

    public function __construct(...$args)
    {
        parent::__construct($args[0], $args[1], $args[2]);
        $this->repo = $args[3];
        $this->pasien = $args[4];
        $this->dokter = $args[5];
    }

    public function list(): void
    {
        $pasienId = null;
        $dokterId = null;
        if ($this->auth->is('pasien') && $this->auth->userId) {
            $pasienId = $this->pasien->findIdByUserId($this->auth->userId);
        }
        if ($this->auth->is('dokter')) {
            $dokterId = $this->dokter->findIdByName($this->auth->name);
        }
        $this->response->ok($this->repo->list($pasienId ?: null, $dokterId ?: null));
    }

    public function get(): void
    {
        $row = $this->repo->find((int)$this->query('id', 0));
        if (!$row) {
            $this->response->error('Booking tidak ditemukan', 404);
        }
        $this->response->ok($row);
    }

    public function create(): void
    {
        $this->validatePayload();
        try {
            $this->response->ok($this->repo->create($this->payloadForRole()), 'Booking berhasil dibuat');
        } catch (RuntimeException $e) {
            $this->response->error($e->getMessage());
        }
    }

    public function update(): void
    {
        $id = (int)$this->input('id', 0);
        if (!$id) {
            $this->response->error('ID tidak valid');
        }
        $this->validatePayload();
        try {
            $this->repo->update($id, $this->payloadForRole());
        } catch (RuntimeException $e) {
            $this->response->error($e->getMessage());
        }
        $this->response->ok(null, 'Booking berhasil diperbarui');
    }

    public function availability(): void
    {
        $tanggal = (string)$this->query('tanggal', date('Y-m-d'));
        $this->response->ok($this->repo->availability($tanggal));
    }

    public function update_status(): void
    {
        $id = (int)$this->input('id', 0);
        $status = (string)$this->input('status', '');
        if (!$id || $status === '') {
            $this->response->error('Data tidak lengkap');
        }
        $this->repo->updateStatus($id, $status);
        $this->response->ok(null, 'Status booking diperbarui');
    }

    public function delete(): void
    {
        $id = (int)$this->input('id', 0);
        if (!$id) {
            $this->response->error('ID tidak valid');
        }
        $this->repo->delete($id);
        $this->response->ok(null, 'Booking berhasil dihapus');
    }

    private function validatePayload(): void
    {
        $pasienId = (int)$this->input('pasien_id', 0);
        if ($this->auth->is('pasien') && $this->auth->userId) {
            $pasienId = $this->pasien->findIdByUserId($this->auth->userId);
        }
        if (!$pasienId || !(int)$this->input('dokter_id', 0) || !$this->input('tanggal')) {
            $this->response->error('Pasien, dokter, dan tanggal wajib diisi');
        }
    }

    private function payloadForRole(): array
    {
        $data = $this->request->body();
        if ($this->auth->is('pasien') && $this->auth->userId) {
            $data['pasien_id'] = $this->pasien->findIdByUserId($this->auth->userId);
        }
        return $data;
    }
}