/**
 * QSM Condition Tab
 */

var QSMCondition;
(function ($) {
    QSMCondition = {
        condition: Backbone.Model.extend({
            defaults: {
                id: null,
                quizID: 1,
                questionID: 1
            }
        }),
        conditions: null,
        conditionCollection: null,
        saveSuccess: function( model ) {
            QSMAdmin.displayAlert( 'Condition was saved!', 'success' );
        },
        saveConditions: function( questionID ) {
            QSMAdmin.displayAlert( 'Saving conditions...', 'info' );

            var model = QSMCondition.conditions.get( questionID );
            model.save(
                {
                    questionID: questionID,
                },
                {
                    headers: { 'X-WP-Nonce': qsmConditionSettings.nonce },
                    success: QSMCondition.saveSuccess,
                    error: QSMAdmin.displayError,
                    type: 'POST'
                }
            );
            MicroModal.close('modal-1010');
        },
        openConditionsPopup: function( questionID ) {
            var question = QSMQuestion.questions.get( questionID );
            var questions = QSMQuestion.questions;
            var questionText = QSMQuestion.prepareQuestionText( question.get( 'name' ) );
            $( '#conditions_question_id' ).val( questionID );
            $( "#conditions-question-id" ).text('').text(questionID);
            MicroModal.show( 'modal-1010' );
        },
        createCondition: function(questionID) {
            QSMAdmin.displayAlert( 'Creating condition...', 'info' );
            QSMCondition.conditions.create(
                {
                    quizID: qsmConditionSettings.quizID,
                    questionID: questionID,
                },
                {
                    headers: { 'X-WP-Nonce': qsmConditionSettings.nonce },
                    success: QSMCondition.addNewCondition,
                    error: QSMAdmin.displayError
                }
            );
        },
        addNewCondition: function( condition ) {

        }
    };

    $(function() {
        QSMCondition.conditionCollection = Backbone.Collection.extend({
            url: wpApiSettings.root + 'quiz-survey-master/v1/conditions',
            model: QSMCondition.condition
        });
        QSMCondition.conditions = new QSMCondition.conditionCollection();
        $( '.questions' ).on( 'click', '.edit-conditions-button', function( event ) {
            event.preventDefault();
            QSMCondition.openConditionsPopup( $( this ).parents( '.question' ).data( 'question-id' ) );
        });
        $( '#save-conditions-popup-button' ).on( 'click', function( event ) {
            event.preventDefault();
            QSMCondition.saveConditions( $( this ).parent().siblings( 'main' ).children( '#conditions_question_id' ).val() );
            $('.save-page-button').trigger('click');
        });
        $( '#new-condition-button' ).on( 'click', function( event ) {
            event.preventDefault();
            var questionID = $('#conditions_question_id').val();
            QSMCondition.createCondition(questionID);
        });
    });
}(jQuery));