<?php
// Configurazione del database
$host_name = 'db5016986092.hosting-data.io';
$database  = 'dbs13687841';
$user_name = 'dbu1754291';
$password  = 'Almogavers@123';

// 1) Funzione per recuperare start_date e end_date di un QUARTER
function getQuarterDateRange($quarter, $year) {
    // $quarter = 1,2,3,4
    // Calcoliamo i mesi di inizio/fine
    $startMonth = 1 + 3 * ($quarter - 1);   // es. Q1 -> 1, Q2 -> 4, Q3 -> 7, Q4 -> 10
    $endMonth   = 3 * $quarter;            // es. Q1 -> 3, Q2 -> 6, Q3 -> 9, Q4 -> 12

    // Costruiamo le stringhe "YYYY-MM-DD"
    $startDate = sprintf('%04d-%02d-01', $year, $startMonth);
    // Per la fine mese, prendiamo l’ultimo giorno del mese $endMonth
    // => Se il mese è 12, l’ultimo giorno è 31, altrimenti usiamo date("t")
    //   in modo semplificato facciamo:
    $endDay   = date('t', strtotime("$year-$endMonth-01"));  // 't' = ultimo giorno del mese
    $endDate  = sprintf('%04d-%02d-%02d', $year, $endMonth, $endDay);

    return [$startDate, $endDate];
}

// 2) Funzione per fare una query e restituire "overview" + "breakdown"
//    in una struttura unificata (period, total_revenue, total_orders, total_items_sold, etc.)
function getPeriodData(PDO $pdo, $startDate, $endDate, $groupBySql, $labelSql) {
    // $groupBySql = ad es. "DATE_FORMAT(order_date_start, '%M')" per breakdown mensile
    // $labelSql   = ad es. "DATE_FORMAT(order_date_start, '%M') as label"

    // A) OVERVIEW globale (somma su tutto il range)
    $overviewQuery = "
        SELECT 
            MIN(order_date_start) AS min_date,
            MAX(order_date_start) AS max_date,
            SUM(total_price)      AS total_revenue,
            COUNT(order_id)       AS total_orders,
            SUM(
                (SELECT SUM(quantity)
                 FROM items
                 WHERE items.order_id = orders.order_id)
            ) AS total_items_sold
        FROM orders
        WHERE order_date_start >= :start
          AND order_date_start <= :end
    ";
    $stmt = $pdo->prepare($overviewQuery);
    $stmt->execute([
        ':start' => $startDate,
        ':end'   => $endDate
    ]);
    $oRow = $stmt->fetch();

    // B) BREAKDOWN (raggruppato per $groupBySql)
    $breakdownQuery = "
        SELECT 
            $labelSql,
            SUM(total_price)      AS total_revenue,
            COUNT(order_id)       AS total_orders,
            SUM(
                (SELECT SUM(quantity)
                 FROM items
                 WHERE items.order_id = orders.order_id)
            ) AS total_items_sold
        FROM orders
        WHERE order_date_start >= :start
          AND order_date_start <= :end
        GROUP BY $groupBySql
        ORDER BY MIN(order_date_start) ASC
    ";
    $stmt2 = $pdo->prepare($breakdownQuery);
    $stmt2->execute([
        ':start' => $startDate,
        ':end'   => $endDate
    ]);
    $rows = $stmt2->fetchAll();

    // C) Componiamo la struttura
    // Se non ci sono dati (es. zero ordini), potremmo avere null => forziamo 0
    $overview = [
        'period' => [
            'start_date' => $startDate,
            'end_date'   => $endDate
        ],
        'total_revenue'    => (float)($oRow['total_revenue'] ?? 0),
        'total_orders'     => (int)($oRow['total_orders']   ?? 0),
        'total_items_sold' => (int)($oRow['total_items_sold'] ?? 0)
    ];

    $breakdown = [];
    foreach ($rows as $r) {
        $breakdown[] = [
            'label'            => $r['label'],
            'total_revenue'    => (float)$r['total_revenue'],
            'total_orders'     => (int)$r['total_orders'],
            'total_items_sold' => (int)$r['total_items_sold']
        ];
    }

    return [
        'overview'  => $overview,
        'breakdown' => $breakdown
    ];
}

try {
    // Connessione al database
    $pdo = new PDO("mysql:host=$host_name;dbname=$database;charset=utf8", $user_name, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // ====================
    // Calcoliamo la data odierna per capire il quarter e l'anno
    // ====================
    $yearNow     = (int)date('Y');       // es. 2025
    $quarterNow  = (int)ceil(date('n')/3); // se siamo a gennaio/febbraio/marzo => Q1, etc.

    // 1) CURRENT QUARTER
    list($currentQStart, $currentQEnd) = getQuarterDateRange($quarterNow, $yearNow);

    // 2) LAST QUARTER
    //   se $quarterNow=1 => last quarter = Q4 of (yearNow-1)
    //   altrimenti Q(n-1) of yearNow
    if ($quarterNow === 1) {
        $lastQ   = 4;
        $lastY   = $yearNow - 1;
    } else {
        $lastQ   = $quarterNow - 1;
        $lastY   = $yearNow;
    }
    list($lastQStart, $lastQEnd) = getQuarterDateRange($lastQ, $lastY);

    // 3) CURRENT YEAR
    //   Dall'1 gennaio di quest'anno al 31 dicembre di quest'anno
    $currentYStart = sprintf('%04d-01-01', $yearNow);
    $currentYEnd   = sprintf('%04d-12-31', $yearNow);

    // 4) LAST YEAR
    //   Dall'1 gennaio dello scorso anno al 31 dicembre dello scorso anno
    $lastYStart = sprintf('%04d-01-01', $yearNow - 1);
    $lastYEnd   = sprintf('%04d-12-31', $yearNow - 1);

    // ====================
    // Eseguiamo le 4 "sezioni" con la stessa funzione getPeriodData()
    // ====================

    // current_quarter => breakdown su base mensile
    $current_quarter = getPeriodData(
        $pdo,
        $currentQStart,
        $currentQEnd,
        // Gruppo su Mese: "DATE_FORMAT(order_date_start, '%Y-%m')"
        // Label:         "DATE_FORMAT(order_date_start, '%Y-%m') as label"
        "DATE_FORMAT(order_date_start, '%Y-%m')",
        "DATE_FORMAT(order_date_start, '%Y-%m') as label"
    );

    // last_quarter => breakdown su base mensile
    $last_quarter = getPeriodData(
        $pdo,
        $lastQStart,
        $lastQEnd,
        "DATE_FORMAT(order_date_start, '%Y-%m')",
        "DATE_FORMAT(order_date_start, '%Y-%m') as label"
    );

    // current_year => breakdown su base mensile
    $current_year = getPeriodData(
        $pdo,
        $currentYStart,
        $currentYEnd,
        "DATE_FORMAT(order_date_start, '%Y-%m')",
        "DATE_FORMAT(order_date_start, '%Y-%m') as label"
    );

    // last_year => breakdown su base mensile (o annuale, se preferisci)
    $last_year = getPeriodData(
        $pdo,
        $lastYStart,
        $lastYEnd,
        "DATE_FORMAT(order_date_start, '%Y-%m')",
        "DATE_FORMAT(order_date_start, '%Y-%m') as label"
    );

    // ====================
    // Componiamo il risultato
    // ====================
    $response = [
        'current_quarter' => $current_quarter,
        'last_quarter'    => $last_quarter,
        'current_year'    => $current_year,
        'last_year'       => $last_year
    ];

    // ====================
    // CSV o JSON
    // ====================
    $type = isset($_GET['type']) ? $_GET['type'] : 'json';

    if ($type === 'csv') {
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="stats.csv"');
        $output = fopen('php://output', 'w');

        // Esempio: blocco "CURRENT_QUARTER"
        fputcsv($output, ['CURRENT_QUARTER OVERVIEW']);
        fputcsv($output, ['start_date','end_date','total_revenue','total_orders','total_items_sold']);
        $o = $response['current_quarter']['overview'];
        fputcsv($output, [
            $o['period']['start_date'],
            $o['period']['end_date'],
            $o['total_revenue'],
            $o['total_orders'],
            $o['total_items_sold']
        ]);
        fputcsv($output, []);

        fputcsv($output, ['CURRENT_QUARTER BREAKDOWN']);
        fputcsv($output, ['label','total_revenue','total_orders','total_items_sold']);
        foreach ($response['current_quarter']['breakdown'] as $row) {
            fputcsv($output, [
                $row['label'],
                $row['total_revenue'],
                $row['total_orders'],
                $row['total_items_sold']
            ]);
        }
        fputcsv($output, []);

        // LAST_QUARTER
        fputcsv($output, ['LAST_QUARTER OVERVIEW']);
        $o = $response['last_quarter']['overview'];
        fputcsv($output, ['start_date','end_date','total_revenue','total_orders','total_items_sold']);
        fputcsv($output, [
            $o['period']['start_date'],
            $o['period']['end_date'],
            $o['total_revenue'],
            $o['total_orders'],
            $o['total_items_sold']
        ]);
        fputcsv($output, []);

        fputcsv($output, ['LAST_QUARTER BREAKDOWN']);
        fputcsv($output, ['label','total_revenue','total_orders','total_items_sold']);
        foreach ($response['last_quarter']['breakdown'] as $row) {
            fputcsv($output, [
                $row['label'],
                $row['total_revenue'],
                $row['total_orders'],
                $row['total_items_sold']
            ]);
        }
        fputcsv($output, []);

        // CURRENT_YEAR
        fputcsv($output, ['CURRENT_YEAR OVERVIEW']);
        $o = $response['current_year']['overview'];
        fputcsv($output, ['start_date','end_date','total_revenue','total_orders','total_items_sold']);
        fputcsv($output, [
            $o['period']['start_date'],
            $o['period']['end_date'],
            $o['total_revenue'],
            $o['total_orders'],
            $o['total_items_sold']
        ]);
        fputcsv($output, []);

        fputcsv($output, ['CURRENT_YEAR BREAKDOWN']);
        fputcsv($output, ['label','total_revenue','total_orders','total_items_sold']);
        foreach ($response['current_year']['breakdown'] as $row) {
            fputcsv($output, [
                $row['label'],
                $row['total_revenue'],
                $row['total_orders'],
                $row['total_items_sold']
            ]);
        }
        fputcsv($output, []);

        // LAST_YEAR
        fputcsv($output, ['LAST_YEAR OVERVIEW']);
        $o = $response['last_year']['overview'];
        fputcsv($output, ['start_date','end_date','total_revenue','total_orders','total_items_sold']);
        fputcsv($output, [
            $o['period']['start_date'],
            $o['period']['end_date'],
            $o['total_revenue'],
            $o['total_orders'],
            $o['total_items_sold']
        ]);
        fputcsv($output, []);

        fputcsv($output, ['LAST_YEAR BREAKDOWN']);
        fputcsv($output, ['label','total_revenue','total_orders','total_items_sold']);
        foreach ($response['last_year']['breakdown'] as $row) {
            fputcsv($output, [
                $row['label'],
                $row['total_revenue'],
                $row['total_orders'],
                $row['total_items_sold']
            ]);
        }
        fputcsv($output, []);

        fclose($output);
        exit;
    } else {
        // Altrimenti JSON
        header('Content-Type: application/json');
        echo json_encode($response);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Errore del database: ' . $e->getMessage()]);
}
?>
