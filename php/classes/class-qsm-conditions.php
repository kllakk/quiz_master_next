<?php
/**
 * File that contains class for questions.
 *
 * @package QSM
 */

/**
 * Class that handles all creating, saving, and deleting of conditions.
 *
 * @since 5.2.0
 */
class QSM_Conditions {
    
    public static $types = [
        'equal' => 'Равен',
        'not-equal' => 'Не равен',
        'greater' => 'Больше',
        'less' => 'Меньше',
        'greater-or-equal' => 'Больше или равен',
        'less-or-equal' => 'Меньше или равен',
//        'contain' => 'Содержит',
//        'start' => 'Начинается с',
//        'end' => 'Заканчивается на',
    ];
    
	/**
	 * Creates a new question
	 *
	 * @since 5.2.0
	 * @param array $data The condition data.
	 * @throws Exception Throws exception if wpdb query results in error.
	 * @return int The ID of the question that was created.
	 */
	public static function create_condition( $data, $conditions = array() ) {
		return self::create_save_condition( $data, $conditions );
	}

    /**
     * Saves a question
     *
     * @since 5.2.0
     * @param array $data The question data.
     * @param array $conditions The conditions for the question.
     * @throws Exception Throws exception if wpdb query results in error.
     * @return int The ID of the question that was saved.
     */
    public static function save_condition( $data, $conditions = array()) {
        return self::create_save_condition( $data, $conditions, false );
    }

    /**
     * Creates or saves a condition
     *
     * This is used internally. Use create_condition or save_condition instead.
     *
     * @since 5.2.0
     * @param array $data The condition data.
     * @param array $conditions The conditions for the question.
     * @param bool  $is_creating True if question is being created, false if being saved.
     * @throws Exception Throws exception if wpdb query results in error.
     * @return int The ID of the question that was created/saved.
     */
    private static function create_save_condition( $data, $conditions, $is_creating = true ) {
        global $wpdb;
        global $mlwQuizMasterNext;

        // Prepare defaults and parse.
        $defaults = array(
            'quiz_id'               => 0,
            'question_id'           => 0,
        );
        $data = wp_parse_args( $data, $defaults );

        foreach ( $conditions as $key => $condition ) {
            $conditions[ $key ] = array(
                intval( $condition[0] ),
                $condition[1],
                htmlspecialchars( $condition[2], ENT_QUOTES ),
            );
        }

        $values = array(
            'quiz_id'              => intval( $data['quiz_id'] ),
            'question_id'          => intval( $data['question_id'] ),
            'condition_array'      => serialize( $conditions ),
            'deleted'              => 0,
        );

        $types = array(
            '%d',
            '%d',
            '%s',
            '%d',
        );

        if ( $is_creating ) {
            $results = $wpdb->insert(
                $wpdb->prefix . 'mlw_conditions',
                $values,
                $types
            );
        } else {
            $results = $wpdb->update(
                $wpdb->prefix . 'mlw_conditions',
                $values,
                array( 'question_id' => intval( $data['question_id'] ) ),
                $types,
                array( '%d' )
            );
        }

        if ( false === $results ) {
            $msg = $wpdb->last_error . ' from ' . $wpdb->last_query;
            $mlwQuizMasterNext->log_manager->add( 'Error when creating/saving question', $msg, 0, 'error' );
            throw new Exception( $msg );
        }

        if ( $is_creating ) {
            return $wpdb->insert_id;
        } else {
            return $data['question_id'];
        }
    }


    /**
     * Loads questions for a quiz
     *
     * @since 5.2.0
     * @param int $question_id The ID of the question.
     * @param int $quiz_id The ID of the quiz.
     * @return array The array of questions.
     */
    public static function load_conditions( $question_id, $quiz_id ) {

        global $wpdb;
        $condition_array = array();

        // Get all questions.
        $prepared = $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}mlw_conditions WHERE question_id=%d AND quiz_id=%d AND deleted='0'", $question_id, $quiz_id );
        $conditionsRequest = $wpdb->get_results($prepared, 'ARRAY_A' );

        // Loop through questions and prepare serialized data.
        foreach ( $conditionsRequest as $condition ) {

            // Prepare answers.
            $conditions = maybe_unserialize( $condition['condition_array'] );
            if ( ! is_array( $conditions ) ) {
                $conditions = array();
            }
            $condition['conditions'] = $conditions;

            $condition_array[ $condition['question_id'] ] = $condition;
        }
        return apply_filters('qsm_load_conditions', $condition_array, $question_id);
    }
}
