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
        loadConditions: function(questionID) {
            QSMAdmin.displayAlert( 'Loading conditions...', 'info' );
            QSMCondition.conditions.fetch({
                headers: { 'X-WP-Nonce': qsmConditionSettings.nonce },
                data: {
                    quizID: qsmConditionSettings.quizID,
                    questionID: questionID,
                },
                success: QSMCondition.loadSuccess(questionID),
                error: QSMAdmin.displayError
            });
        },
        loadSuccess: function(questionID) {
            QSMCondition.openConditionsPopup( questionID );
        },
        saveSuccess: function( model ) {
            QSMAdmin.displayAlert( 'Condition was saved!', 'success' );
        },
        saveConditions: function( questionID ) {
            QSMAdmin.displayAlert( 'Saving conditions...', 'info' );

            var conditions = [];
            var $conditions = jQuery( '.conditions-single');
            _.each( $conditions, function( condition ) {
                var $condition = jQuery( condition );
                var relatedID = $condition.find( '.question_related_id' ).val();
                var type = $condition.find( '.condition_type' ).val();
                var value = $condition.find( '.condition_value' ).val();
                conditions.push( [ relatedID, type, value ] );
            });
            var model = QSMCondition.conditions.get( questionID );
            if (!model) {
                QSMCondition.createCondition(questionID, conditions);
            } else {
                model.save(
                    {
                        quizID: qsmConditionSettings.quizID,
                        questionID: questionID,
                        conditions: conditions,
                    },
                    {
                        headers: {'X-WP-Nonce': qsmConditionSettings.nonce},
                        success: QSMCondition.saveSuccess,
                        error: QSMAdmin.displayError,
                        type: 'POST'
                    }
                );
            }
            MicroModal.close('modal-1010');
        },
        openConditionsPopup: function( questionID ) {
            $( '#conditions_question_id' ).val( questionID );
            $( "#conditions-question-id" ).text('').text(questionID);
            $( '#conditions' ).empty();

            var condition = QSMCondition.conditions.get( questionID );
            if (condition) {
                console.log(condition.get('conditions'));
                console.log(QSMCondition.condition);
                console.log(condition);

                var cl = 0;
                var conditions = condition.get('conditions');
                _.each(conditions, function (condition) {
                    console.log(condition);
                    condition.push(condition.question_related_id);
                    condition.push(condition.condition_type);
                    condition.push(condition.condition_value);
                    condition.push(0);
                    condition.push(questionID);
                    QSMCondition.addNewCondition(condition);
                    cl++;
                });
            }

            MicroModal.show( 'modal-1010' );
        },
        createCondition: function(questionID, conditions) {
            QSMAdmin.displayAlert( 'Creating condition...', 'info' );
            QSMCondition.conditions.create(
                {
                    quizID: qsmConditionSettings.quizID,
                    questionID: questionID,
                    conditions: conditions,
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
                var questionId = $(this).val();
                var filtered = _.filter(questions, function(question){ return question.value == questionId; });
                var question = _.first(filtered);
                var answers = question.answers;

                select.find("option[value!='']").remove();
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
            var questionID = $( this ).parents( '.question' ).data( 'question-id' );
            QSMCondition.loadConditions( questionID );
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
            var condition = [ '', '', '', condition_length, question_id ];
            QSMCondition.addNewCondition( condition );
        });
        $( '#conditions' ).on( 'click', '.delete-condition-button', function( event ) {
            event.preventDefault();
            $( this ).parents( '.conditions-single' ).remove();
        });
    });
}(jQuery));