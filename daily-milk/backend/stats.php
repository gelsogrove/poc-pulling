<?php
// Configurazione del database
$host_name = 'db5016986092.hosting-data.io';
$database = 'dbs13687841';
$user_name = 'dbu1754291';
$password = '';

try {
    // Connessione al database
    $pdo = new PDO("mysql:host=$host_name;dbname=$database;charset=utf8", $user_name, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // Statistiche mensili
    $months = [];
    $stmt = $pdo->query("
        SELECT DATE_FORMAT(order_date_start, '%Y-%m') AS month, COUNT(*) AS total_orders
        FROM orders
        GROUP BY DATE_FORMAT(order_date_start, '%Y-%m')
    ");
    $months['total_orders'] = $stmt->fetchAll();

    $stmt = $pdo->query("
        SELECT DATE_FORMAT(order_date_start, '%Y-%m') AS month, SUM(total_price) AS total_revenue
        FROM orders
        GROUP BY DATE_FORMAT(order_date_start, '%Y-%m')
    ");
    $months['total_revenue'] = $stmt->fetchAll();

    $stmt = $pdo->query("
        SELECT DATE_FORMAT(o.order_date_start, '%Y-%m') AS month, SUM(i.quantity) AS total_items_sold
        FROM items i
        JOIN orders o ON i.order_id = o.order_id
        GROUP BY DATE_FORMAT(o.order_date_start, '%Y-%m')
    ");
    $months['total_items_sold'] = $stmt->fetchAll();

    // Statistiche annuali
    $lastyears = [];
    $stmt = $pdo->query("
        SELECT YEAR(order_date_start) AS year, COUNT(*) AS total_orders
        FROM orders
        GROUP BY YEAR(order_date_start)
    ");
    $lastyears['total_orders'] = $stmt->fetchAll();

    $stmt = $pdo->query("
        SELECT YEAR(order_date_start) AS year, SUM(total_price) AS total_revenue
        FROM orders
        GROUP BY YEAR(order_date_start)
    ");
    $lastyears['total_revenue'] = $stmt->fetchAll();

    $stmt = $pdo->query("
        SELECT YEAR(o.order_date_start) AS year, SUM(i.quantity) AS total_items_sold
        FROM items i
        JOIN orders o ON i.order_id = o.order_id
        GROUP BY YEAR(o.order_date_start)
    ");
    $lastyears['total_items_sold'] = $stmt->fetchAll();

    // Statistiche per cliente
    $clients = [];
    $stmt = $pdo->query("
        SELECT c.customer_id, c.name, COUNT(o.order_id) AS total_orders, SUM(o.total_price) AS total_revenue
        FROM customers c
        LEFT JOIN orders o ON c.customer_id = o.customer_id
        GROUP BY c.customer_id, c.name
    ");
    $clients['total_orders_and_revenue'] = $stmt->fetchAll();

    $stmt = $pdo->query("
        SELECT c.customer_id, c.name, SUM(i.quantity) AS total_items_sold
        FROM customers c
        LEFT JOIN orders o ON c.customer_id = o.customer_id
        LEFT JOIN items i ON o.order_id = i.order_id
        GROUP BY c.customer_id, c.name
    ");
    $clients['total_items_sold'] = $stmt->fetchAll();

    $stmt = $pdo->query("
        SELECT c.customer_id, c.name, DATE_FORMAT(o.order_date_start, '%Y-%m') AS month, SUM(o.total_price) AS revenue_by_month
        FROM customers c
        LEFT JOIN orders o ON c.customer_id = o.customer_id
        GROUP BY c.customer_id, c.name, DATE_FORMAT(o.order_date_start, '%Y-%m')
    ");
    $clients['revenue_by_month'] = $stmt->fetchAll();

    $stmt = $pdo->query("
        SELECT c.customer_id, c.name, YEAR(o.order_date_start) AS year, SUM(o.total_price) AS revenue_by_year
        FROM customers c
        LEFT JOIN orders o ON c.customer_id = o.customer_id
        GROUP BY c.customer_id, c.name, YEAR(o.order_date_start)
    ");
    $clients['revenue_by_year'] = $stmt->fetchAll();

    // Restituisci tutte le statistiche in un unico file JSON
    header('Content-Type: application/json');
    echo json_encode([
        'months' => $months,
        'lastyears' => $lastyears,
        'clients' => $clients
    ]);

} catch (PDOException $e) {
    // Gestione degli errori
    http_response_code(500);
    echo json_encode(['error' => 'Errore del database: ' . $e->getMessage()]);
}
?>
