import React, { FC, memo } from 'react';

import AgreeDisagree from 'frontend/components/renderings/AssistedTravelForm/components/DynamicForm/inputs/AgreeDisagree/AgreeDisagree';
import InfoOnly from 'frontend/components/renderings/AssistedTravelForm/components/DynamicForm/inputs/InfoOnly/InfoOnly';
import InputQuestion from 'frontend/components/renderings/AssistedTravelForm/components/DynamicForm/inputs/InputQuestion/InputQuestion';
import InputSetQuestion from 'frontend/components/renderings/AssistedTravelForm/components/DynamicForm/inputs/InputSetQuestion/InputSetQuestion';
import MultiSelectQuestion from 'frontend/components/renderings/AssistedTravelForm/components/DynamicForm/inputs/MultiSelectQuestion/MultiSelectQuestion';
import RadioQuestion from 'frontend/components/renderings/AssistedTravelForm/components/DynamicForm/inputs/RadioQuestion/RadioQuestion';
import TextareaQuestion from 'frontend/components/renderings/AssistedTravelForm/components/DynamicForm/inputs/TextareaQuestion/TextareaQuestion';
import {
    IAnswerAction,
    IFormQuestion,
    PopupType,
    QuestionType,
    TAnswerValue,
    TFormAnswers,
    TFormErrors,
} from 'frontend/components/renderings/AssistedTravelForm/models/types';

export interface IDynamicFormQuestionProps {
    answers: TFormAnswers;
    errors: TFormErrors;
    isQuestionVisible: (id: string) => boolean;
    question: IFormQuestion;
    setAnswer: (id: string, value: TAnswerValue[], action?: IAnswerAction) => void;
    togglePopup: (popup: PopupType | null) => void;
}

const DynamicFormQuestion: FC<IDynamicFormQuestionProps> = ({
    question,
    answers,
    errors,
    isQuestionVisible,
    setAnswer,
    togglePopup,
}) => {
    const error = errors.get(question.id);
    const onChange = (value: TAnswerValue[], action?: IAnswerAction): void => setAnswer(question.id, value, action);
    const commonProps = { question, error, onChange };

    const renderQuestion = (): JSX.Element | null => {
        switch (question.type) {
            case QuestionType.InputSet:
                return (
                    <InputSetQuestion
                        question={question}
                        answers={answers}
                        errors={errors}
                        isQuestionVisible={isQuestionVisible}
                        setAnswer={setAnswer}
                        togglePopup={togglePopup}
                    />
                );

            case QuestionType.NumberInput:
            case QuestionType.TextInput:
                return <InputQuestion {...commonProps} value={answers.get(question.id)?.answers[0]} />;

            case QuestionType.Textarea:
                return <TextareaQuestion {...commonProps} value={answers.get(question.id)?.answers[0]} />;

            case QuestionType.TravelCompanionSelection:
            case QuestionType.Radio:
                return <RadioQuestion {...commonProps} value={answers.get(question.id)?.answers[0]} />;

            case QuestionType.MultiSelect: {
                return <MultiSelectQuestion {...commonProps} answers={answers.get(question.id)?.answers} />;
            }

            case QuestionType.AgreeDisagree:
                return <AgreeDisagree {...commonProps} />;

            case QuestionType.InfoOnly:
                return <InfoOnly question={question} onChange={onChange} togglePopup={togglePopup} />;
            default:
                return null;
        }
    };

    return renderQuestion();
};
export default memo(DynamicFormQuestion);
