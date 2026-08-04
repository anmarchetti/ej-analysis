import { FC, memo } from 'react';
import classNames from 'classnames';

import RadioButton from 'frontend/components/common/RadioButton';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import ErrorMessage from 'frontend/components/renderings/AssistedTravelForm/components/DynamicForm/inputs/ErrorMessage/ErrorMessage';
import inputStyles from 'frontend/components/renderings/AssistedTravelForm/components/DynamicForm/inputs/Inputs.module.scss';
import QuestionHeader from 'frontend/components/renderings/AssistedTravelForm/components/QuestionHeader/QuestionHeader';
import { IQuestionProps } from 'frontend/components/renderings/AssistedTravelForm/models/types';
import { getUniqueIds } from 'frontend/components/renderings/AssistedTravelForm/utils/DynamicForm.utils';

const RadioQuestion: FC<IQuestionProps> = ({ question, value, error, onChange }) => {
    const { errorId, labelId, questionId, additionalInfoId } = getUniqueIds(
        question.id,
        !!error,
        !!question.additionalInfo,
        !!question.label,
    );

    return (
        <fieldset
            className={inputStyles.fieldset}
            id={questionId}
            aria-labelledby={`${labelId || ''} ${additionalInfoId || ''}`}
            aria-invalid={!!error}
            aria-errormessage={errorId}
            tabIndex={-1}
        >
            <QuestionHeader title={question.label} description={question.description} id={labelId} tag='legend' />
            {question.options?.map(option => (
                <RadioButton
                    key={option.id}
                    id={`${questionId}-${option.id}`}
                    name={questionId}
                    label={option.text}
                    value={option.id}
                    checked={value?.answerId === option.id}
                    onChange={(): void => {
                        onChange(
                            [
                                {
                                    answerId: option.id,
                                    value: option.textForSummary,
                                    valueForSubmission: option.textForSubmission,
                                },
                            ],
                            option.action,
                        );
                    }}
                    dataTid={`radio-${question.id}-${option.id}`}
                    className={classNames(inputStyles.radioBtn, { [inputStyles.errorInput]: !!error })}
                />
            ))}
            <ErrorMessage error={error} id={errorId} />
            {question.additionalInfo && (
                <RichTextWithLinks
                    field={{ value: question.additionalInfo }}
                    className={inputStyles.additionalInfo}
                    id={additionalInfoId}
                />
            )}
        </fieldset>
    );
};

export default memo(RadioQuestion);
