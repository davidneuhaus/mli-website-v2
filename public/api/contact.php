<?php
/**
 * MLI contact form mailer for classic PHP hosting (nginx/Apache).
 *
 * Configure before deploy:
 *   - CONTACT_TO: destination inbox
 *   - CONTACT_FROM: envelope / From address (must be allowed by the server)
 *
 * Accepts JSON (application/json) or classic form POST.
 * Returns JSON: { "ok": true } or { "ok": false, "error": "..." }
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

const CONTACT_TO = 'info@leadership-munich.org'; // TODO: set destination email
const CONTACT_FROM = 'noreply@leadership-munich.org'; // TODO: set allowed From
const SUBJECT_PREFIX = '[MLI Website] ';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$raw = file_get_contents('php://input') ?: '';
$data = [];
$contentType = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';

if (stripos($contentType, 'application/json') !== false) {
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Invalid JSON']);
        exit;
    }
    $data = $decoded;
} else {
    $data = $_POST;
}

// Honeypot
if (!empty($data['website'])) {
    echo json_encode(['ok' => true]);
    exit;
}

$name = trim((string)($data['name'] ?? ''));
$email = trim((string)($data['email'] ?? ''));
$phone = trim((string)($data['phone'] ?? ''));
$subject = trim((string)($data['subject'] ?? ''));
$comments = trim((string)($data['comments'] ?? ''));
$privacy = !empty($data['privacy']);
$lang = trim((string)($data['lang'] ?? 'de'));

if ($name === '' || $email === '' || $subject === '' || $comments === '' || !$privacy) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Missing required fields']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Invalid email']);
    exit;
}

$body = "New contact form submission ({$lang})\n\n"
    . "Name: {$name}\n"
    . "Email: {$email}\n"
    . "Phone: {$phone}\n"
    . "Subject: {$subject}\n\n"
    . "Message:\n{$comments}\n";

$mailSubject = SUBJECT_PREFIX . $subject;
$headers = [
    'From: ' . CONTACT_FROM,
    'Reply-To: ' . $email,
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: MLI-Static-Contact',
];

$ok = @mail(CONTACT_TO, '=?UTF-8?B?' . base64_encode($mailSubject) . '?=', $body, implode("\r\n", $headers));

if (!$ok) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Mail transport failed']);
    exit;
}

echo json_encode(['ok' => true]);
