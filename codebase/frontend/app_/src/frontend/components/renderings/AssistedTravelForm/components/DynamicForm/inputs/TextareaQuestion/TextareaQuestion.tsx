import { FC, memo } from 'react';
import classNames from 'classnames';

import { ValidationRule } from 'models/enum/ValidationRule';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import ErrorMessage from 'frontend/components/renderings/AssistedTravelForm/components/DynamicForm/inputs/ErrorMessage/ErrorMessage';
import inputStyles from 'frontend/components/renderings/AssistedTravelForm/components/DynamicForm/inputs/Inputs.module.scss';
import QuestionHeader from 'frontend/components/renderings/AssistedTravelForm/components/QuestionHeader/QuestionHeader';
import { IQuestionProps } from 'frontend/components/renderings/AssistedTravelForm/models/types';
import { getUniqueIds } from 'frontend/components/renderings/AssistedTravelForm/utils/DynamicForm.utils';

const TextareaQuestion: FC<IQuestionProps> = ({ question, value, error, onChange }) => {
    const maxLength = question.validation?.find(rule => rule.type === ValidationRule.MaxLength)?.value;

    const { errorId, labelId, questionId, additionalInfoId } = getUniqueIds(
        question.id,
        !!error,
        !!question.additionalInfo,
        !!question.label,
    );

    return (
        <div id={questionId}>
            <QuestionHeader title={question.label} description={question.description} tag='label' id={labelId} />
            <div
                className={classNames(inputStyles.inputWrapper, {
                    [inputStyles.errorInput]: !!error,
                })}
            >
                <textarea
                    name={questionId}
                    required={question.requiredValidation?.required}
                    aria-required={question.requiredValidation?.required}
                    aria-labelledby={labelId}
                    aria-describedby={additionalInfoId}
                    aria-invalid={!!error}
                    aria-errormessage={errorId}
                    className={classNames(inputStyles.input, inputStyles.textArea)}
                    placeholder=' '
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>): void =>
                        onChange([{ value: e.target.value }])
                    }
                    value={value?.value}
                    maxLength={maxLength}
                />
                <span className={inputStyles.placeholder} aria-hidden='true'>
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

export default memo(TextareaQuestion);
