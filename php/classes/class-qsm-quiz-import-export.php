<?php

// /wp-json/quiz-survey-master/v1/export
class QSM_QuizImportExport {

    public static function import($file)
    {
	    $content = file_get_contents($file['tmp_name']);
	    $data = json_decode($content, true);

	    global $wpdb;
	    $current_user = wp_get_current_user();

	    if ($quiz = $data['mlw_quizzes'][0]) {

	    	$prevQuizId = $quiz['quiz_id'];
	    	$prevQuizSettings = $quiz['quiz_settings'];
		    unset($quiz['quiz_id']);
		    $quiz['quiz_author_id'] = $current_user->ID;
		    $quiz['admin_email'] = get_option( 'admin_email', 'Enter email' );
		    $quiz['last_activity'] = current_time( 'mysql' );
		    $quiz['quiz_views'] = 0;
		    $quiz['quiz_taken'] = 0;
		    $quiz['deleted'] = 0;
		    $quiz['quiz_settings'] = '';

		    $types = array_fill(0, count($quiz), '%s');
		    $wpdb->insert($wpdb->prefix . 'mlw_quizzes', $quiz, $types);
		    $quizId = $wpdb->insert_id;

		    $prevQuestionsMap = array();
		    if ($questions = $data['mlw_questions']) {
				foreach ($questions as $question) {
					$prevQuestionId = $question['question_id'];
					unset($question['question_id']);
					$question['quiz_id'] = $quizId;
					$types = array_fill(0, count($question), '%s');
					$wpdb->insert($wpdb->prefix . 'mlw_questions', $question, $types);
					$questionId = $wpdb->insert_id;
					$prevQuestionsMap [$prevQuestionId] = $questionId;
				}
		    }

		    $quiz_settings = unserialize($prevQuizSettings);
		    $pages = unserialize($quiz_settings['pages']);
		    $newPages = array();
		    foreach ($pages as $page) {
			    $newPage = array();
		    	foreach ($page as $pageQuestionId) {
				    $newPage [] = $prevQuestionsMap[ $pageQuestionId ];
			    }
			    $newPages [] = $newPage;
		    }
		    $quiz_settings['pages'] = serialize($newPages);
		    $serialized_settings = serialize($quiz_settings);

		    $wpdb->update( $wpdb->prefix . 'mlw_quizzes',
			    array( 'quiz_settings' => $serialized_settings ),
			    array( 'quiz_id' => $quizId ),
			    array( '%s' ),
			    array( '%d' )
		    );

		    if ($conditions = $data['mlw_conditions']) {
			    foreach ($conditions as $condition) {
				    $condition['question_id'] = $prevQuestionsMap[$condition['question_id']];
				    $condition['quiz_id'] = $quizId;

				    $condition_array = unserialize($condition['condition_array']);
				    foreach ($condition_array as &$condition_item) {
					    $condition_item[0] = $prevQuestionsMap[$condition_item[0]];
				    }
				    $condition['condition_array'] = serialize($condition_array);

				    $types = array_fill(0, count($condition), '%s');
				    $wpdb->insert($wpdb->prefix . 'mlw_conditions', $condition, $types);
			    }
		    }
	    }
    }

    public static function export($quizId)
    {
	    global $wpdb;

	    $result = array();

	    foreach (array('mlw_quizzes', 'mlw_questions', 'mlw_conditions') as $table) {
		    $data   = $wpdb->get_results( "SELECT * FROM {$wpdb->prefix}{$table} WHERE quiz_id = {$quizId}" );
		    $rows   = array();
		    foreach ( $data as $index => $item ) {
			    $values = array();
			    foreach ( get_object_vars( $item ) as $name => $value ) {
				    $values [$name] = $value;
			    }
			    $rows [] = $values;
		    }

		    $result [$table] = $rows;
	    }

	    return $result;
    }
}