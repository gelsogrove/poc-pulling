<?php
declare(strict_types=1);

// Dati di connessione
$host_name = 'db5016986092.hosting-data.io';
$database = 'dbs13687841';
$user_name = 'dbu1754291';
$password = 'Almogavers@123';

// Connessione al database
try {
    $link = new mysqli($host_name, $user_name, $password, $database);

    if ($link->connect_error) {
        throw new Exception('Failed to connect to MySQL: ' . $link->connect_error);
    }

    echo '<p>Connection to MySQL server successfully established.</p>';

    // Aggiungi qui il tuo codice per interagire con il database...

} catch (Exception $e) {
    echo '<p>Error: ' . $e->getMessage() . '</p>';
} finally {
    // Chiude la connessione se è stata aperta
    if (isset($link) && $link->ping()) {
        $link->close();
    }
}
?>
