<?php

namespace Klinik\Controllers;

use Klinik\Repositories\RekamMedisRepository;
use Klinik\Repositories\ResepRepository;
use Klinik\Repositories\DokterRepository;
use Klinik\Repositories\PasienRepository;
use Throwable;

class ResepController extends BaseController
{
    private ResepRepository $repo;
    private RekamMedisRepository $rekamMedis;
    private DokterRepository $dokter;
    private PasienRepository $pasien;

    public function __construct(...$args)
    {
        parent::__construct($args[0], $args[1], $args[2]);
        $this->repo = $args[3];
        $this->rekamMedis = $args[4];
        $this->dokter = $args[5];
        $this->pasien = $args[6];
    }

    public function list(): void
    {
        $pasienId = 0;
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
            $this->response->error('Resep tidak ditemukan', 404);
        }
        $this->guardRow($row);
        $this->response->ok($row);
    }

    public function create(): void
    {
        if ($this->auth->is('pasien')) {
            $this->response->error('Pasien tidak dapat membuat resep', 403);
        }
        $data = $this->validatedPayload();
        if (!(int)($data['rekam_medis_id'] ?? 0)) {
            $data['rekam_medis_id'] = $this->rekamMedis->latestIdForPatient((int)$data['pasien_id']);
        }
        if (!(int)$data['rekam_medis_id']) {
            $this->response->error('Pasien belum memiliki rekam medis');
        }

        try {
            $this->response->ok($this->repo->create($data), 'Resep berhasil dibuat');
        } catch (Throwable $e) {
            $this->response->error('Gagal menyimpan resep: ' . $e->getMessage());
        }
    }

    public function update(): void
    {
        if ($this->auth->is('pasien')) {
            $this->response->error('Pasien tidak dapat mengubah resep', 403);
        }
        $id = (int)$this->input('id', 0);
        if (!$id) {
            $this->response->error('ID tidak valid');
        }
        $data = $this->validatedPayload();

        try {
            $this->repo->update($id, $data);
            $this->response->ok(null, 'Resep berhasil diperbarui');
        } catch (Throwable $e) {
            $this->response->error('Gagal memperbarui resep: ' . $e->getMessage());
        }
    }

    public function delete(): void
    {
        if ($this->auth->is('pasien')) {
            $this->response->error('Pasien tidak dapat menghapus resep', 403);
        }
        $id = (int)$this->input('id', 0);
        if (!$id) {
            $this->response->error('ID tidak valid');
        }
        $this->repo->delete($id);
        $this->response->ok(null, 'Resep berhasil dihapus');
    }

    private function validatedPayload(): array
    {
        $data = $this->request->body();
        if ($this->auth->is('dokter')) {
            $data['dokter_id'] = $this->dokter->findIdByName($this->auth->name);
        }
        $detail = $data['detail'] ?? [];
        if (!(int)($data['pasien_id'] ?? 0) || !(int)($data['dokter_id'] ?? 0) || empty($data['tanggal'])) {
            $this->response->error('Pasien, dokter, dan tanggal wajib diisi');
        }
        if (!is_array($detail) || empty($detail)) {
            $this->response->error('Minimal satu item obat wajib diisi');
        }
        return $data;
    }

    private function guardRow(array $row): void
    {
        if ($this->auth->is('dokter')) {
            $dokterId = $this->dokter->findIdByName($this->auth->name);
            if ($dokterId && (int)$row['dokter_id'] !== $dokterId) {
                $this->response->error('Akses resep ditolak', 403);
            }
        }
        if ($this->auth->is('pasien') && $this->auth->userId) {
            $pasienId = $this->pasien->findIdByUserId($this->auth->userId);
            if ($pasienId && (int)$row['pasien_id'] !== $pasienId) {
                $this->response->error('Akses resep ditolak', 403);
            }
        }
    }
}
