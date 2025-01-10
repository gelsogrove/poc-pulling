<?php
// Configurazione del database
$host_name = 'db5016986092.hosting-data.io';
$database = 'dbs13687841';
$user_name = 'dbu1754291';
$password = 'Almogavers@123';

try {
    // Connessione al databases
    $pdo = new PDO("mysql:host=$host_name;dbname=$database;charset=utf8", $user_name, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // Verifica se è stata fornita una query tramite GET o POST
    $query = $_REQUEST['query'] ?? null;

    if ($query) {
        // Controllo di sicurezza: solo query SELECT
        $queryUpper = strtoupper($query);
        if (strpos($queryUpper, 'INSERT') !== false || strpos($queryUpper, 'UPDATE') !== false) {
            http_response_code(400); // Bad Request
            echo json_encode(['error' => 'Solo query SELECT sono permesse.']);
            exit;
        }

        // Esegui la query
        $stmt = $pdo->query($query);
        $results = $stmt->fetchAll();

        // Restituisci i risultati
        echo json_encode($results);
    } else {
        http_response_code(400); // Bad Request
        echo json_encode(['error' => 'Nessuna query fornita.']);
    }
} catch (PDOException $e) {
    // Gestione degli errori del database
    http_response_code(500); // Internal Server Error
    echo json_encode(['error' => 'Errore del database: ' . $e->getMessage()]);
}
?>
