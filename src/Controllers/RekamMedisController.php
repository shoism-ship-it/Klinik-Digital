<?php

namespace Klinik\Controllers;

use Klinik\Repositories\RekamMedisRepository;
use Klinik\Repositories\DokterRepository;
use Klinik\Repositories\PasienRepository;

class RekamMedisController extends BaseController
{
    private RekamMedisRepository $repo;
    private DokterRepository $dokter;
    private PasienRepository $pasien;

    public function __construct(...$args)
    {
        parent::__construct($args[0], $args[1], $args[2]);
        $this->repo = $args[3];
        $this->dokter = $args[4];
        $this->pasien = $args[5];
    }

    public function list(): void
    {
        $pasienId = (int)$this->query('pasien_id', 0);
        $dokterId = 0;
        if ($this->auth->is('dokter')) {
            $dokterId = $this->dokter->findIdByName($this->auth->name);
        }
        if ($this->auth->is('pasien') && $this->auth->userId) {
            $pasienId = $this->pasien->findIdByUserId($this->auth->userId);
        }
        $this->response->ok($this->repo->list((string)$this->query('q', ''), $pasienId, $dokterId));
    }

    public function get(): void
    {
        $row = $this->repo->find((int)$this->query('id', 0));
        if (!$row) {
            $this->response->error('Rekam medis tidak ditemukan', 404);
        }
        $this->guardRow($row);
        $this->response->ok($row);
    }

    public function create(): void
    {
        $this->validatePayload();
        $this->response->ok($this->repo->create($this->payloadWithRoleDoctor()), 'Rekam medis berhasil ditambahkan');
    }

    public function update(): void
    {
        $id = (int)$this->input('id', 0);
        if (!$id) {
            $this->response->error('ID tidak valid');
        }
        $this->validatePayload();
        $this->repo->update($id, $this->payloadWithRoleDoctor());
        $this->response->ok(null, 'Rekam medis berhasil diperbarui');
    }

    public function delete(): void
    {
        $id = (int)$this->input('id', 0);
        if (!$id) {
            $this->response->error('ID tidak valid');
        }
        $this->repo->delete($id);
        $this->response->ok(null, 'Rekam medis berhasil dihapus');
    }

    private function validatePayload(): void
    {
        $dokterId = (int)$this->input('dokter_id', 0);
        if ($this->auth->is('dokter')) {
            $dokterId = $this->dokter->findIdByName($this->auth->name);
        }
        if (!(int)$this->input('pasien_id', 0) || !$dokterId || !$this->input('tanggal')) {
            $this->response->error('Pasien, dokter, dan tanggal wajib diisi');
        }
    }

    private function payloadWithRoleDoctor(): array
    {
        $data = $this->request->body();
        if ($this->auth->is('dokter')) {
            $data['dokter_id'] = $this->dokter->findIdByName($this->auth->name);
        }
        return $data;
    }

    private function guardRow(array $row): void
    {
        if ($this->auth->is('dokter')) {
            $dokterId = $this->dokter->findIdByName($this->auth->name);
            if ($dokterId && (int)$row['dokter_id'] !== $dokterId) {
                $this->response->error('Akses rekam medis ditolak', 403);
            }
        }
        if ($this->auth->is('pasien') && $this->auth->userId) {
            $pasienId = $this->pasien->findIdByUserId($this->auth->userId);
            if ($pasienId && (int)$row['pasien_id'] !== $pasienId) {
                $this->response->error('Akses rekam medis ditolak', 403);
            }
        }
    }
}