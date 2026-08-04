import { memo } from 'react';
import classNames from 'classnames';

import Button from 'frontend/components/common/Button';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import {
    IAnswerAction,
    IAnswerOption,
    IFormQuestion,
    TAnswerValue,
} from 'frontend/components/renderings/AssistedTravelForm/models/types';

import styles from './AgreeDisagree.module.scss';

const AgreeDisagree: React.FC<{
    onChange: (value: TAnswerValue[], action?: IAnswerAction) => void;
    question: IFormQuestion;
}> = ({ question, onChange }) => {
    const agreeValue = question.options?.find(option => option.isAgreeOption);
    const disagreeValue = question.options?.find(option => !option.isAgreeOption);

    const onButtonClick = (option?: IAnswerOption): void => {
        onChange(
            [{ answerId: option?.id, value: option?.textForSummary, valueForSubmission: option?.textForSubmission }],
            option?.action,
        );
    };

    return (
        <div id={`question-${question.id}`}>
            {question.description && (
                <RichTextWithLinks
                    field={{
                        value: question.description,
                    }}
                    className={styles.description}
                />
            )}
            <div className={styles.buttonGroup}>
                {disagreeValue && (
                    <Button
                        onClick={(): void => onButtonClick(disagreeValue)}
                        data-tid='disagree-btn'
                        isOutlined
                        className={classNames(styles.btn, styles.btnSecondary)}
                    >
                        {disagreeValue?.text}
                    </Button>
                )}
                {agreeValue && (
                    <Button
                        onClick={(): void => onButtonClick(agreeValue)}
                        data-tid='agree-btn'
                        className={styles.btn}
                        isMedium
                    >
                        {agreeValue?.text}
                    </Button>
                )}
            </div>
        </div>
    );
};
export default memo(AgreeDisagree);
