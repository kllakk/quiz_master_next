<?php

// /wp-json/quiz-survey-master/v1/export
class QSM_ExportSql {
    public static function processed()
    {
	    global $wpdb;

	    $result = array();

	    foreach (array('mlw_quizzes', 'mlw_questions', 'mlw_conditions') as $table) {
		    $data   = $wpdb->get_results( "SELECT * FROM {$wpdb->prefix}{$table}" );
		    $columns = array();
		    $rows   = array();
		    foreach ( $data as $index => $item ) {
			    $values = array();
			    foreach ( get_object_vars( $item ) as $name => $value ) {
				    if ( $index == 0 ) {
					    $columns [] = $name;
				    }
				    $values [] = $value;
			    }
			    $rows [] = $values;
		    }

		    $result [] = array(
			    'table'  => $table,
			    'columns' => $columns,
			    'rows'   => $rows,
		    );
	    }

	    // Export the data and prompt a csv file for download
	    header('Content-Type: application/json; charset=UTF-8');
	    header("Content-Disposition: attachment; filename=export.json");
	    ob_end_clean();
	    $out = fopen('php://output', 'w');
	    fwrite($out, json_encode($result));
	    fclose($out);
	    ob_flush();
	    exit();
    }
}