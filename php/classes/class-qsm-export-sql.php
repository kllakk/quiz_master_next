<?php

// /wp-json/quiz-survey-master/v1/export
class QSM_ExportSql {
    public static function processed($quizId)
    {
	    global $wpdb;

	    $result = array();

	    foreach (array('mlw_quizzes', 'mlw_questions', 'mlw_conditions') as $table) {
		    $data   = $wpdb->get_results( "SELECT * FROM {$wpdb->prefix}{$table} WHERE quiz_id = {$quizId}" );
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

	    return $result;
    }
}