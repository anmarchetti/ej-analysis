import { FC, memo } from 'react';

import DynamicFormQuestion from 'frontend/components/renderings/AssistedTravelForm/components/DynamicForm/components/DynamicFormQuestion/DynamicFormQuestion';
import inputStyles from 'frontend/components/renderings/AssistedTravelForm/components/DynamicForm/inputs/Inputs.module.scss';
import QuestionHeader from 'frontend/components/renderings/AssistedTravelForm/components/QuestionHeader/QuestionHeader';
import {
    IAnswerAction,
    IFormQuestion,
    PopupType,
    TAnswerValue,
    TFormAnswers,
    TFormErrors,
} from 'frontend/components/renderings/AssistedTravelForm/models/types';

export interface IInputSetProps {
    answers: TFormAnswers;
    errors: TFormErrors;
    isQuestionVisible: (id: string) => boolean;
    question: IFormQuestion;
    setAnswer: (id: string, value: TAnswerValue[], action?: IAnswerAction) => void;
    togglePopup: (popup: PopupType | null) => void;
}

const InputSetQuestion: FC<IInputSetProps> = ({
    question,
    answers,
    errors,
    isQuestionVisible,
    setAnswer,
    togglePopup,
}) => (
    <fieldset className={inputStyles.fieldset}>
        <QuestionHeader title={question.label} description={question.description} tag='legend' />
        {question.questions?.map(subQuestion => (
            <DynamicFormQuestion
                key={subQuestion.id}
                question={subQuestion}
                answers={answers}
                errors={errors}
                isQuestionVisible={isQuestionVisible}
                setAnswer={setAnswer}
                togglePopup={togglePopup}
            />
        ))}
    </fieldset>
);

export default memo(InputSetQuestion);
