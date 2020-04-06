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
        'contain' => 'Содержит',
        'start' => 'Начинается с',
        'end' => 'Заканчивается на',
    ];
    
	/**
	 * Creates a new question
	 *
	 * @since 5.2.0
	 * @param array $data The condition data.
	 * @throws Exception Throws exception if wpdb query results in error.
	 * @return int The ID of the question that was created.
	 */
	public static function create_condition( $data ) {
		return self::create_save_condition( $data );
	}


    /**
     * Creates or saves a condition
     *
     * This is used internally. Use create_condition or save_condition instead.
     *
     * @since 5.2.0
     * @param array $data The condition data.
     * @param bool  $is_creating True if question is being created, false if being saved.
     * @throws Exception Throws exception if wpdb query results in error.
     * @return int The ID of the question that was created/saved.
     */
    private static function create_save_condition( $data, $is_creating = true ) {
        global $wpdb;
        global $mlwQuizMasterNext;

        // Prepare defaults and parse.
        $defaults = array(
            'quiz_id'               => 0,
            'question_id'           => 0,
            'question_related_id'   => 0,
            'condition_order'       => 1,
        );
        $data = wp_parse_args( $data, $defaults );

        $values = array(
            'quiz_id'              => intval( $data['quiz_id'] ),
            'question_id'          => intval( $data['question_id'] ),
            'question_related_id'  => intval( $data['question_related_id'] ),
            'condition_order'      => intval( $data['condition_order'] ),
            'deleted'              => 0,
        );

        $types = array(
            '%d',
            '%d',
            '%d',
            '%d',
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
                array( 'condition_id' => intval( $data['ID'] ) ),
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
            return $data['ID'];
        }
    }
}
