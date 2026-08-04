import { FC, memo, useMemo } from 'react';
import classNames from 'classnames';

import Checkbox from 'frontend/components/common/Checkbox';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import ErrorMessage from 'frontend/components/renderings/AssistedTravelForm/components/DynamicForm/inputs/ErrorMessage/ErrorMessage';
import inputStyles from 'frontend/components/renderings/AssistedTravelForm/components/DynamicForm/inputs/Inputs.module.scss';
import QuestionHeader from 'frontend/components/renderings/AssistedTravelForm/components/QuestionHeader/QuestionHeader';
import {
    IAnswerOption,
    IFormQuestion,
    TAnswerValue,
} from 'frontend/components/renderings/AssistedTravelForm/models/types';
import { getUniqueIds } from 'frontend/components/renderings/AssistedTravelForm/utils/DynamicForm.utils';

export interface IMultiSelectQuestionProps {
    onChange: (value: TAnswerValue[]) => void;
    question: IFormQuestion;
    answers?: TAnswerValue[];
    error?: string;
}
const MultiSelectQuestion: FC<IMultiSelectQuestionProps> = ({ question, answers, error, onChange }) => {
    const { errorId, labelId, questionId, additionalInfoId } = getUniqueIds(
        question.id,
        !!error,
        !!question.additionalInfo,
        !!question.label,
    );
    const otherOption = useMemo(() => question.options?.find(o => o.isOtherOption), [question.options]);

    const toggle = (option: IAnswerOption): void => {
        const { id, textForSummary, textForSubmission, clearOtherSelections, isOtherOption } = option;
        const wasSelected = answers?.some(a => a.answerId === id) ?? false;

        if (clearOtherSelections) {
            onChange(
                wasSelected
                    ? []
                    : [
                          {
                              answerId: id,
                              value: textForSummary,
                              valueForSubmission: textForSubmission,
                          },
                      ],
            );

            return;
        }

        // Build new selection: remove exclusive options first, then toggle this one
        const filtered =
            answers?.filter(a => {
                const opt = question.options?.find(o => o.id === a.answerId);

                return !opt?.clearOtherSelections;
            }) ?? [];

        onChange(
            wasSelected
                ? filtered.filter(a => a.answerId !== id)
                : [
                      ...filtered,
                      {
                          answerId: id,
                          value: isOtherOption ? '' : textForSummary,
                          valueForSubmission: isOtherOption ? '' : textForSubmission,
                      },
                  ],
        );
    };

    const isOtherSelected = answers?.some(a => {
        const opt = question.options?.find(o => o.id === a.answerId);

        return opt?.isOtherOption;
    });

    const onChangeOther = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const filtered =
            answers?.filter(a => {
                const opt = question.options?.find(o => o.id === a.answerId);

                return !opt?.clearOtherSelections && !opt?.isOtherOption;
            }) ?? [];

        onChange([...filtered, { answerId: otherOption?.id ?? '', value: e.target.value }]);
    };

    return (
        <fieldset
            className={inputStyles.fieldset}
            aria-labelledby={`${labelId || ''} ${additionalInfoId || ''} ${errorId || ''}`}
            aria-invalid={!!error}
            id={questionId}
        >
            <QuestionHeader title={question.label} description={question.description} id={labelId} tag='legend' />
            {question.options?.map(option => (
                <Checkbox
                    key={option.id}
                    id={`${questionId}-${option.id}`}
                    label={option.text}
                    checked={answers?.some(a => a.answerId === option.id)}
                    onChange={(): void => toggle(option)}
                    dataTid={`checkbox-${question.id}-${option.id}`}
                    className={classNames(inputStyles.checkbox, { [inputStyles.errorInput]: !!error })}
                    tick
                    textRight
                />
            ))}
            {isOtherSelected && otherOption && (
                <div
                    className={classNames(inputStyles.inputOtherWrapper, {
                        [inputStyles.errorInput]: !!error,
                    })}
                    style={{ marginTop: '0' }}
                >
                    <input
                        type='text'
                        name={question.id}
                        id={`${question.id}-other`}
                        required={true}
                        aria-required={true}
                        aria-label={otherOption.text}
                        className={classNames(inputStyles.input, inputStyles.inputText)}
                        inputMode='text'
                        onChange={onChangeOther}
                        value={answers?.find(a => a.answerId === otherOption.id)?.value || ''}
                        maxLength={100}
                        aria-errormessage={error ? errorId : undefined}
                        aria-invalid={!!error}
                    />
                </div>
            )}
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

export default memo(MultiSelectQuestion);
