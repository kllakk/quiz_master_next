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
                success: function(models, response, options) {
                    QSMCondition.openConditionsPopup( questionID );
                },
                error: QSMAdmin.displayError
            });
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

            var model = QSMCondition.conditions.get( questionID );
            if (model) {
                var cl = 0;
                var conditions = model.get('conditions');
                //console.log(conditions);
                _.each(conditions, function (condition) {
                    condition.push(condition.question_related_id);
                    condition.push(condition.condition_type);
                    condition.push(condition.condition_value);
                    condition.push(0);
                    condition.push(questionID);
                    //console.log(condition);
                    QSMCondition.addNewCondition(condition);
                    cl++;
                });

                $( '.question_related_id' ).trigger('change');
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

            var index = $('.conditions-single').length;
            var selectedQuestionId = condition[0];
            var selectedType = condition[1];
            var selectedAnswer = condition[2];
            var conditionCount = condition[3];
            var conditionQuestionId = condition[4];

            var questions = _.map(QSMQuestion.questions.models, function(question) {
                return {
                    'value': question.id,
                    'name': QSMQuestion.decodeEntities(question.attributes.name),
                    'type': question.attributes.type,
                    'selected_question': selectedQuestionId,
                    'selected_answer': selectedAnswer,
                    'answers':  _.map(question.attributes.answers, function(answer) {
                        return {
                            'value': answer[0],
                            'name': answer[0],
                            'type': question.attributes.type,
                            'question_id': question.id,
                            'selected': answer[0] == selectedAnswer && question.id == selectedQuestionId
                        };
                    })
                };
            });

            console.log(questions);

            $( '#conditions' ).append( conditionTemplate( {
                index: index,
                question_related_id: selectedQuestionId,
                condition_type: selectedType,
                condition_value: selectedAnswer,
                count: conditionCount,
                questions: questions,
                types: qsmConditionSettings.types,
                question_id: conditionQuestionId }) );

            $( '.question_related_id[data-index=' + index + ']' ).on( 'change', function( event ) {
                console.log(event);
                var select = $(this).closest('.conditions-single').find('select.condition_value');
                var questionId = $(this).val();
                select.find("option[value!='']").remove();
                if (questionId) {
                    var filtered = _.filter(questions, function (question) {
                        return question.value == questionId;
                    });
                    console.log(filtered);
                    var question = _.first(filtered);
                    var answers = question.answers;

                    for (var i = 0; i < answers.length; i++) {
                        select.append('<option data-t1="' + question.selected_question + '" data-t2="' + question.selected_answer + '" ' + (answers[i].selected ? 'selected' : '') + ' value="' + answers[i].value + '">' + answers[i].name + '</option>');
                    }
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