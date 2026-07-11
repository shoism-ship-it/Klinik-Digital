<?php
session_start();

if (empty($_SESSION['role']) || $_SESSION['role'] !== 'pasien' || empty($_SESSION['user_id'])) {
    http_response_code(403);
    exit('Akses export resep ditolak.');
}

require_once __DIR__ . '/../config/db.php';

$pdo = getPDO();
$pasien = fetchOne(
    $pdo,
    'SELECT id, nama FROM pasien WHERE user_id = ? LIMIT 1',
    [(int)$_SESSION['user_id']]
);

if (!$pasien) {
    http_response_code(404);
    exit('Data pasien tidak ditemukan.');
}

$resepId = (int)($_GET['id'] ?? 0);
if (!$resepId) {
    http_response_code(400);
    exit('Pilih salah satu resep untuk diexport.');
}

$resep = fetchOne(
    $pdo,
    'SELECT r.*, p.nama AS nama_pasien, d.nama AS nama_dokter
     FROM resep r
     JOIN pasien p ON r.pasien_id = p.id
     JOIN dokter d ON r.dokter_id = d.id
     WHERE r.id = ? AND r.pasien_id = ?',
    [$resepId, (int)$pasien['id']]
);

if (!$resep) {
    http_response_code(404);
    exit('Resep tidak ditemukan.');
}

$detail = resepDetail($pdo, $resepId);
$kode = code('R', (int)$resep['id']);
$filename = 'resep-' . safeFilePart($kode) . '-' . safeFilePart((string)$resep['tanggal']) . '.pdf';

header('Content-Type: application/pdf');
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Cache-Control: private, max-age=0, must-revalidate');
echo buildResepPdf($resep, $detail, $kode);
exit;

function resepDetail(PDO $pdo, int $resepId): array
{
    return fetchAll(
        $pdo,
        'SELECT rd.*, COALESCE(NULLIF(rd.nama_obat, ""), o.nama, "-") AS nama_obat
         FROM resep_detail rd
         LEFT JOIN obat o ON rd.obat_id = o.id
         WHERE rd.resep_id = ?',
        [$resepId]
    );
}

function buildResepPdf(array $resep, array $detail, string $kode): string
{
    $status = isExpired($resep['berlaku_sampai'] ?? '') ? 'Kadaluarsa' : 'Berlaku';
    $lines = [
        ['Klinik Digital Polibatam', 18, true],
        ['Resep Obat Pasien', 16, true],
        ['Dokumen resep untuk penggunaan obat sesuai anjuran dokter.', 10, false],
        ['', 10, false],
        ['ID Resep: ' . $kode, 11, false],
        ['Tanggal: ' . ($resep['tanggal'] ?: '-'), 11, false],
        ['Berlaku Sampai: ' . ($resep['berlaku_sampai'] ?: '-'), 11, false],
        ['Status: ' . $status, 11, false],
        ['Pasien: ' . ($resep['nama_pasien'] ?: '-'), 11, false],
        ['Dokter: ' . ($resep['nama_dokter'] ?: '-'), 11, false],
        ['', 10, false],
        ['Detail Obat', 13, true],
    ];

    if (!$detail) {
        $lines[] = ['1. Tidak ada detail obat.', 11, false];
    }

    foreach ($detail as $index => $item) {
        $number = $index + 1;
        $lines[] = [$number . '. Nama Obat: ' . ($item['nama_obat'] ?: '-'), 11, true];
        $lines[] = ['   Jumlah: ' . ((string)($item['jumlah'] ?: '-')), 11, false];
        $lines[] = ['   Aturan Pakai: ' . ($item['aturan'] ?: '-'), 11, false];
    }

    if (!empty($resep['catatan'])) {
        $lines[] = ['', 10, false];
        $lines[] = ['Catatan: ' . $resep['catatan'], 11, false];
    }

    $lines[] = ['', 10, false];
    $lines[] = ['Dicetak dari Sistem Informasi Klinik Digital Polibatam.', 9, false];

    return pdfFromLines($lines);
}

function pdfFromLines(array $lines): string
{
    $stream = "0.85 0.91 0.92 rg\n50 736 495 64 re f\n0.22 0.35 0.38 RG\n2 w\n50 736 495 64 re S\n0 0 0 rg\n";
    $y = 778;

    foreach ($lines as [$text, $size, $bold]) {
        if ($text === '') {
            $y -= 14;
            continue;
        }

        foreach (wrapPdfText((string)$text, $size >= 13 ? 64 : 86) as $part) {
            if ($y < 64) {
                $stream .= pdfText(50, $y, 9, 'Konten resep berlanjut. Silakan cetak detail dari aplikasi jika diperlukan.', false);
                break 2;
            }
            $stream .= pdfText(64, $y, (int)$size, $part, (bool)$bold);
            $y -= max(13, (int)$size + 4);
        }
    }

    $objects = [];
    $objects[] = '<< /Type /Catalog /Pages 2 0 R >>';
    $objects[] = '<< /Type /Pages /Kids [3 0 R] /Count 1 >>';
    $objects[] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>';
    $objects[] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
    $objects[] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';
    $objects[] = "<< /Length " . strlen($stream) . " >>\nstream\n" . $stream . "endstream";

    $pdf = "%PDF-1.4\n";
    $offsets = [0];
    foreach ($objects as $i => $object) {
        $offsets[] = strlen($pdf);
        $pdf .= ($i + 1) . " 0 obj\n" . $object . "\nendobj\n";
    }

    $xref = strlen($pdf);
    $pdf .= "xref\n0 " . (count($objects) + 1) . "\n";
    $pdf .= "0000000000 65535 f \n";
    for ($i = 1; $i <= count($objects); $i++) {
        $pdf .= str_pad((string)$offsets[$i], 10, '0', STR_PAD_LEFT) . " 00000 n \n";
    }
    $pdf .= "trailer\n<< /Size " . (count($objects) + 1) . " /Root 1 0 R >>\n";
    $pdf .= "startxref\n" . $xref . "\n%%EOF";

    return $pdf;
}

function pdfText(int $x, int $y, int $size, string $text, bool $bold): string
{
    $font = $bold ? 'F2' : 'F1';
    return "BT /{$font} {$size} Tf {$x} {$y} Td (" . pdfEscape($text) . ") Tj ET\n";
}

function wrapPdfText(string $text, int $limit): array
{
    $text = preg_replace('/\s+/', ' ', toPdfText($text));
    $words = explode(' ', trim((string)$text));
    $lines = [];
    $line = '';

    foreach ($words as $word) {
        $candidate = $line === '' ? $word : $line . ' ' . $word;
        if (strlen($candidate) > $limit && $line !== '') {
            $lines[] = $line;
            $line = $word;
        } else {
            $line = $candidate;
        }
    }

    if ($line !== '') {
        $lines[] = $line;
    }

    return $lines ?: ['-'];
}

function toPdfText(string $value): string
{
    $map = [
        '–' => '-',
        '—' => '-',
        '“' => '"',
        '”' => '"',
        '‘' => "'",
        '’' => "'",
    ];
    $value = strtr($value, $map);
    return preg_replace('/[^\x20-\x7E]/', '', $value);
}

function pdfEscape(string $value): string
{
    return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], toPdfText($value));
}

function fetchOne(PDO $pdo, string $sql, array $params): ?array
{
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

function fetchAll(PDO $pdo, string $sql, array $params): array
{
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function code(string $prefix, int $id): string
{
    return $prefix . str_pad((string)$id, 3, '0', STR_PAD_LEFT);
}

function isExpired(?string $value): bool
{
    return $value !== null && $value !== '' && strtotime($value) < time();
}

function safeFilePart(string $value): string
{
    $value = preg_replace('/[^a-z0-9-]+/i', '-', trim($value));
    $value = trim((string)$value, '-');
    return strtolower($value !== '' ? $value : 'file');
}
