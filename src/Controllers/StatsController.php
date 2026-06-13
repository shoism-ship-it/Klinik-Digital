<?php

namespace Klinik\Controllers;

use Klinik\Repositories\DokterRepository;
use Klinik\Repositories\PasienRepository;
use Klinik\Repositories\StatsRepository;

class StatsController extends BaseController
{
    private StatsRepository $stats;
    private DokterRepository $dokter;
    private PasienRepository $pasien;

    public function __construct(...$args)
    {
        parent::__construct($args[0], $args[1], $args[2]);
        $this->stats = $args[3];
        $this->dokter = $args[4];
        $this->pasien = $args[5];
    }

    public function get(): void
    {
        if ($this->auth->is('admin')) {
            $this->response->ok($this->stats->admin());
        }

        if ($this->auth->is('dokter')) {
            $this->response->ok($this->stats->dokter($this->dokter->findIdByName($this->auth->name)));
        }

        $pasienId = $this->auth->userId ? $this->pasien->findIdByUserId($this->auth->userId) : 0;
        $this->response->ok($this->stats->pasien($pasienId));
    }

    public function laporan(): void
    {
        $year = (int)$this->query('year', date('Y'));
        $this->response->ok($this->stats->laporan($year));
    }
}
