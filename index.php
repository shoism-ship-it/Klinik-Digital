<?php
session_start();

if (!empty($_SESSION['role'])) {
    header('Location: app.php');
} else {
    header('Location: login.php');
}
exit;
