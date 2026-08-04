import { FC, memo, useCallback } from 'react';
import classNames from 'classnames';

import { ValidationRule } from 'models/enum/ValidationRule';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import ErrorMessage from 'frontend/components/renderings/AssistedTravelForm/components/DynamicForm/inputs/ErrorMessage/ErrorMessage';
import inputStyles from 'frontend/components/renderings/AssistedTravelForm/components/DynamicForm/inputs/Inputs.module.scss';
import QuestionHeader from 'frontend/components/renderings/AssistedTravelForm/components/QuestionHeader/QuestionHeader';
import { IQuestionProps, QuestionType } from 'frontend/components/renderings/AssistedTravelForm/models/types';
import {
    getUniqueIds,
    hasExcessDecimalPlaces,
} from 'frontend/components/renderings/AssistedTravelForm/utils/DynamicForm.utils';

const propsByType = {
    [QuestionType.TextInput]: {
        type: 'text',
        inputMode: 'text',
        className: classNames(inputStyles.input, inputStyles.inputText),
    },
    [QuestionType.NumberInput]: {
        type: 'number',
        inputMode: 'numeric',
        className: classNames(inputStyles.input, inputStyles.inputNumber),
    },
};

const InputQuestion: FC<IQuestionProps> = ({ question, value, error, onChange }) => {
    const { errorId, labelId, questionId, additionalInfoId, placeholderId } = getUniqueIds(
        question.id,
        !!error,
        !!question.additionalInfo,
        !!question.label,
        !!question.placeholderLabel,
    );
    const maxDecimalPlaces = question.validation?.find(rule => rule.type === ValidationRule.MaxDecimalPlaces)?.value;
    const maxLength = question.validation?.find(rule => rule.type === ValidationRule.MaxLength)?.value;

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>): void => {
            const newValue = e.target.value;

            if (maxDecimalPlaces !== undefined && hasExcessDecimalPlaces(newValue, maxDecimalPlaces)) {
                return;
            }

            onChange([{ value: newValue }]);
        },
        [maxDecimalPlaces, onChange],
    );

    return (
        <div id={questionId}>
            <QuestionHeader title={question.label} description={question.description} tag='label' id={labelId} />
            <div
                className={classNames(inputStyles.inputWrapper, {
                    [inputStyles.errorInput]: !!error,
                })}
            >
                <input
                    name={questionId}
                    required={question.requiredValidation?.required}
                    aria-required={question.requiredValidation?.required}
                    aria-labelledby={labelId || placeholderId}
                    aria-describedby={additionalInfoId}
                    aria-invalid={!!error}
                    aria-errormessage={errorId}
                    placeholder=' '
                    onChange={handleChange}
                    value={value?.value}
                    maxLength={maxLength}
                    {...propsByType[question.type]}
                />
                <span className={inputStyles.placeholder} id={placeholderId}>
                    {question.placeholderLabel}
                </span>
            </div>
            <ErrorMessage error={error} id={errorId} />
            {question.additionalInfo && (
                <RichTextWithLinks
                    field={{ value: question.additionalInfo }}
                    className={inputStyles.additionalInfo}
                    id={additionalInfoId}
                />
            )}
        </div>
    );
};

export default memo(InputQuestion);
