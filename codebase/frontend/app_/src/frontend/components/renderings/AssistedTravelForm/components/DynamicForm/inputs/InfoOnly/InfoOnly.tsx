import { FC, memo, useEffect } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import {
    IAnswerAction,
    IQuestionProps,
    PopupType,
    TAnswerValue,
} from 'frontend/components/renderings/AssistedTravelForm/models/types';
import { createOnContactUsClick } from 'frontend/components/renderings/AssistedTravelForm/utils/AssistedTravelForm.utils';

import styles from './InfoOnly.module.scss';

type TInfoOnlyProps = {
    onChange: (value: TAnswerValue[], action?: IAnswerAction) => void;
    question: IQuestionProps['question'];
    togglePopup: (popup: PopupType | null) => void;
};

const InfoOnly: FC<TInfoOnlyProps> = ({ question, onChange, togglePopup }) => {
    useEffect(() => {
        const option = question.options?.[0];

        const { id, textForSummary, textForSubmission } = option || {};

        if (option) {
            onChange([
                {
                    answerId: id,
                    value: textForSummary,
                    valueForSubmission: textForSubmission,
                },
            ]);
        }
    }, []);

    const onContactUsClick = createOnContactUsClick(togglePopup);

    return (
        <div className={styles.content} id={`question-${question.id}`}>
            <Text tag='div' field={{ value: question.label }} className={styles.title} />
            {question.description && (
                <RichTextWithLinks
                    tag='div'
                    field={{ value: question.description }}
                    className={styles.description}
                    onLinkClick={onContactUsClick}
                />
            )}
        </div>
    );
};

export default memo(InfoOnly);
