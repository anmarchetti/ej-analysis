import React, { FC, useEffect, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { DATE_FORMATS } from 'code/dates';
import useStore from 'frontend/hooks/useStore';
import helpCenterService from 'frontend/services/helpCenter.service';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { getWebStorageItem, removeWebStorageItem, setWebStorageItem } from 'frontend/utils/webStorage.utils';
import { IFAQRatingById, IFAQRatingFields } from 'models/data/IFAQRatingFields';
import { MediaSize } from 'models/data/MediaSizeParams';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';
import Button from 'frontend/components/common/Button';
import { JSSImageNext } from 'frontend/components/common/JSSImageNext/JSSImageNext';
import SvgTick from 'frontend/components/icons-new/Tick';

import styles from './FaqRating.module.scss';

export interface IFaqRatingProps {
    questionId: string;
    categoryName?: string;
    categoryNavParameter?: string;
    className?: string;
    fields?: IFAQRatingFields;
    questionName?: string;
    questionNavParameter?: string;
}

const FaqRating: FC<IFaqRatingProps> = ({
    fields,
    questionId,
    questionNavParameter,
    categoryNavParameter,
    categoryName,
    questionName,
    className,
}) => {
    const { getPhrase, trackHelpWasUseful } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
        trackHelpWasUseful: stores.trackingStore.trackHelpWasUseful,
    }));

    const [faqRatingStorageValue, setFaqRatingStorageValue] = useState<IFAQRatingById[]>([]);
    const [feedback, setFeedback] = useState<string>('');
    const [isFeedbackSubmitted, setIsFeedbackSubmitted] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        const storageValue = getWebStorageItem(WebStorageKeys.FaqRating, true) as IFAQRatingById[];
        setFaqRatingStorageValue(Array.isArray(storageValue) ? storageValue : []);
    }, [questionId]);

    if (!fields?.IsRatingEnabled?.value) {
        return null;
    }

    const {
        RatingQuestion,
        PositiveActiveIcon,
        PositiveInactiveIcon,
        NegativeActiveIcon,
        NegativeInactiveIcon,
        IsTextFieldEnabled,
        ThumbUpPlaceholder,
        ThumbDownPlaceholder,
    } = fields;

    const onRatingButtonClick = (value: boolean): void => {
        isFeedbackSubmitted && setIsFeedbackSubmitted(false);

        const questionInWebStorage = faqRatingStorageValue.find(item => item.id === questionId);

        if (questionInWebStorage?.rating !== value) {
            try {
                const newFaqRatingStorageValue = [
                    ...faqRatingStorageValue.filter(item => item.id !== questionId),
                    { id: questionId, rating: value },
                ];
                setWebStorageItem(WebStorageKeys.FaqRating, JSON.stringify(newFaqRatingStorageValue));
                setFaqRatingStorageValue(newFaqRatingStorageValue);
                trackHelpWasUseful(value, categoryNavParameter, questionNavParameter);
            } catch (e) {
                removeWebStorageItem(WebStorageKeys.FaqRating);
            }
        } else {
            const newFaqRatingStorageValue = faqRatingStorageValue.filter(item => item.id !== questionId);
            setWebStorageItem(WebStorageKeys.FaqRating, JSON.stringify(newFaqRatingStorageValue));
            setFaqRatingStorageValue(newFaqRatingStorageValue);
            setFeedback('');
        }
    };

    const onTextInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
        setFeedback(event.target.value);
    };

    const currentQuestionRating = faqRatingStorageValue.find(item => item.id === questionId)?.rating;
    const showFeedbackTextArea =
        !!IsTextFieldEnabled?.value && currentQuestionRating !== undefined && !isFeedbackSubmitted;

    const onSubmitClick = async (e: React.ChangeEvent<HTMLFormElement>): Promise<void> => {
        try {
            e?.preventDefault();

            if (categoryName && questionName && currentQuestionRating !== undefined) {
                setIsLoading(true);
                await helpCenterService.saveQuestionFeedback(
                    categoryName,
                    questionName,
                    currentQuestionRating,
                    feedback,
                    formatDateL10n(new Date(), DATE_FORMATS.serverIsoFormat),
                );
                setFeedback('');
                setIsFeedbackSubmitted(true);
                setIsLoading(false);
            }
        } catch (e) {
            setIsLoading(false);
        }
    };

    return (
        <form className={classNames(styles.form, className)} onSubmit={onSubmitClick} data-tid='faq-rating-form'>
            <div className={styles.container}>
                <Text field={RatingQuestion} tag='p' className={styles.title} data-tid='title' />
                <Button
                    className={styles.icon}
                    onClick={() => onRatingButtonClick(true)}
                    aria-label={getPhrase(SitecoreDictionary.GlobalsFormFieldsRadioButtonsYes)}
                    aria-pressed={!!currentQuestionRating}
                    dataTid='positive-rating-button'
                >
                    <JSSImageNext
                        field={currentQuestionRating ? PositiveActiveIcon : PositiveInactiveIcon}
                        mediaSize={MediaSize.Small}
                    />
                </Button>
                <Button
                    className={styles.icon}
                    name={'question-rating'}
                    onClick={() => onRatingButtonClick(false)}
                    aria-label={getPhrase(SitecoreDictionary.GlobalsFormFieldsRadioButtonsNo)}
                    aria-pressed={currentQuestionRating === false}
                    dataTid='negative-rating-button'
                >
                    <JSSImageNext
                        field={currentQuestionRating === false ? NegativeActiveIcon : NegativeInactiveIcon}
                        mediaSize={MediaSize.Small}
                    />
                </Button>
            </div>
            {showFeedbackTextArea && (
                <>
                    <textarea
                        onChange={onTextInputChange}
                        maxLength={1000}
                        className={styles.comment}
                        placeholder={currentQuestionRating ? ThumbUpPlaceholder?.value : ThumbDownPlaceholder?.value}
                        aria-label={getPhrase(SitecoreDictionary.FaqRatingLabelsYourFeedback)}
                        data-tid='faq-rating-comment'
                    />
                    <Button
                        className={styles.submitButton}
                        disabled={!feedback || isLoading}
                        type='submit'
                        isLoading={isLoading}
                        dataTid='submit-faq-rating'
                    >
                        {getPhrase(SitecoreDictionary.FaqRatingButtonsSubmitFeedback)}
                    </Button>
                </>
            )}
            {isFeedbackSubmitted && (
                <div className={styles.ratingSubmitted} data-tid='submitted-message'>
                    <SvgTick />
                    <span>{getPhrase(SitecoreDictionary.FaqRatingLabelsFeedbackIsSubmitted)}</span>
                </div>
            )}
        </form>
    );
};

export default FaqRating;
