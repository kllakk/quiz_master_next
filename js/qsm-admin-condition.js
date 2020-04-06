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
                questionID: 1,
                conditions: [],
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


            $( '#conditions' ).empty();
            var conditions = question.get( 'conditions' );

            // var cl = 0;
            // _.each( conditions, function( condition ) {
            //     condition.push(cl + 1);
            //     condition.push(questionID);
            //     QSMQuestion.addNewAnswer( condition );
            //     cl++;
            // });

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
            var conditionTemplate = wp.template( 'single-condition' );
            console.log(QSMQuestion.questions);

            var questions = _.map(QSMQuestion.questions.models, function(question) {
                return {
                    'value': question.id,
                    'name': QSMQuestion.decodeEntities(question.attributes.name),
                    'type': question.attributes.type,
                    'answers':  _.map(question.attributes.answers, function(answer) {
                        return {
                            'value': answer[0],
                            'name': answer[0],
                            'type': question.attributes.type,
                            'question_id': question.id,
                        };
                    })
                };
            });

            $( '#conditions' ).append( conditionTemplate( {
                question_related_id: condition[0],
                condition_type: condition[1],
                condition_value: condition[2],
                count: condition[3],
                questions: questions,
                types: qsmConditionSettings.types,
                question_id: condition[4] }) );

            $( '.question_related_id' ).on( 'change', function( event ) {
                var select = $(this).closest('.conditions-single').find('select.condition_value');
                console.log(select);
                var questionId = $(this).val();
                var filtered = _.filter(questions, function(question){ return question.value == questionId; });
                var question = _.first(filtered);
                var answers = question.answers;

                select.find("option[value]").remove();
                for (var i = 0; i < answers.length; i++) {
                    select.append('<option value=' + answers[i].value + '>' + answers[i].name + '</option>');
                }
            });
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
            var condition_length = $( '#conditions' ).find('.conditions-single').length;
            var question_id = $('#conditions_question_id').val();
            //QSMCondition.createCondition(questionID);
            var condition = [ '', '', '', condition_length, question_id ];
            QSMCondition.addNewCondition( condition );
        });
        $( '#conditions' ).on( 'click', '.delete-condition-button', function( event ) {
            event.preventDefault();
            $( this ).parents( '.conditions-single' ).remove();
        });
    });
}(jQuery));