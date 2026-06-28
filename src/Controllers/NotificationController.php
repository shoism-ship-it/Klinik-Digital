<?php

namespace Klinik\Controllers;

use Klinik\Core\AuthContext;
use Klinik\Core\Request;
use Klinik\Core\Response;
use Klinik\Repositories\BookingRepository;
use Klinik\Repositories\DokterRepository;
use Klinik\Repositories\PasienRepository;
use Klinik\Repositories\StatsRepository;
use Klinik\Repositories\TransaksiRepository;

class NotificationController extends BaseController
{
    public function __construct(
        Request $request,
        Response $response,
        AuthContext $auth,
        private StatsRepository $stats,
        private BookingRepository $booking,
        private TransaksiRepository $transaksi,
        private PasienRepository $pasien,
        private DokterRepository $dokter
    ) {
        parent::__construct($request, $response, $auth);
    }

    public function list(): void
    {
        $items = [];

        if ($this->auth->is('admin')) {
            $stats = $this->stats->admin();
            $items[] = ['title' => 'Booking menunggu', 'message' => ($stats['booking_menunggu'] ?? 0) . ' booking perlu ditinjau.', 'type' => 'warning'];
            $items[] = ['title' => 'Transaksi menunggu', 'message' => ($stats['transaksi_menunggu'] ?? 0) . ' transaksi menunggu konfirmasi.', 'type' => 'info'];
            $items[] = ['title' => 'Stok menipis', 'message' => ($stats['stok_menipis'] ?? 0) . ' jenis obat perlu dicek.', 'type' => 'danger'];
        } elseif ($this->auth->is('dokter')) {
            $dokterId = $this->dokter->findIdByName($this->auth->name);
            $stats = $this->stats->dokter($dokterId);
            $items[] = ['title' => 'Antrian hari ini', 'message' => ($stats['antrian_hari_ini'] ?? 0) . ' pasien dalam antrian Anda.', 'type' => 'info'];
            $items[] = ['title' => 'Rekam medis bulan ini', 'message' => ($stats['total_pasien_bulan'] ?? 0) . ' rekam medis sudah tercatat.', 'type' => 'success'];
        } else {
            $pasienId = $this->auth->userId ? $this->pasien->findIdByUserId($this->auth->userId) : 0;
            $stats = $this->stats->pasien($pasienId);
            $items[] = ['title' => 'Booking aktif', 'message' => ($stats['booking_aktif'] ?? 0) . ' booking masih menunggu.', 'type' => 'warning'];
            $items[] = ['title' => 'Transaksi', 'message' => ($stats['transaksi_menunggu'] ?? 0) . ' transaksi menunggu pembayaran/konfirmasi.', 'type' => 'info'];
            $items[] = ['title' => 'Resep tersedia', 'message' => ($stats['total_resep'] ?? 0) . ' resep tercatat untuk Anda.', 'type' => 'success'];
        }

        $this->response->ok($items);
    }
}
