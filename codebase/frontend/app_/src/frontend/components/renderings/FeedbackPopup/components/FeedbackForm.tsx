import React, { FC, useState } from 'react';
import classNames from 'classnames';

import { DATE_FORMATS } from 'code/dates';
import useStore from 'frontend/hooks/useStore';
import helpCenterService from 'frontend/services/helpCenter.service';
import { IHolidaysStores } from 'frontend/store/holidays';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { getBookingType } from 'frontend/utils/viewBooking.utils';
import { DataStatus, isErrorStatus, isLoadingStatus } from 'models/enum/DataStatus';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import SvgWarningFilled from 'frontend/components/icons-new/WarningFilled';
import { IFeedbackPopupFields } from 'frontend/components/renderings/FeedbackPopup/FeedbackPopup';

import FeedbackScaleItem from './FeedbackScaleItem';

interface IFeedbackFormProps {
    fields: IFeedbackPopupFields;
    onSuccessSubmit: () => void;
    trackClickAction: (cta: string) => void;
    isInDrawer?: boolean;
    onClose?: () => void;
}

export const FeedbackForm: FC<IFeedbackFormProps> = ({
    fields,
    isInDrawer,
    onClose,
    onSuccessSubmit,
    trackClickAction,
}) => {
    const { getPhrase, booking } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        booking: stores.bookingStore.booking,
    }));

    const [scaleValue, setScaleValue] = useState<number | null>(null);
    const [comment, setComment] = useState<string>('');
    const [submitStatus, setSubmitStatus] = useState<DataStatus>(DataStatus.NotLoaded);

    if (!booking) {
        return null;
    }

    const isFormValid = scaleValue !== null;
    const hasCommentField = !!fields.IsCommentFieldEnabled?.value;
    const title = fields.Title?.value || '';

    const onSubmit = async (e: React.FormEvent): Promise<void> => {
        e?.preventDefault();

        if (!isFormValid || isLoadingStatus(submitStatus)) {
            return;
        }

        const scaleItem = fields.Scale.find(item => item.fields?.ScaleValue?.value === scaleValue);
        trackClickAction(scaleItem?.fields?.Name?.value ?? '');

        try {
            setSubmitStatus(DataStatus.Loading);
            await helpCenterService.saveFeedback(
                title,
                scaleValue as number,
                comment,
                formatDateL10n(new Date(), DATE_FORMATS.serverIsoFormat),
                booking?.marketCode || '',
                getBookingType(booking),
            );
            setSubmitStatus(DataStatus.Loaded);
            onSuccessSubmit();
        } catch {
            setSubmitStatus(DataStatus.Error);
        }
    };

    const submitButton = (
        <Button
            className='feedback-form__submit'
            type='submit'
            disabled={!isFormValid}
            isLoading={isLoadingStatus(submitStatus)}
            data-tid='feedback-form-submit-button'
        >
            {getPhrase(SitecoreDictionary.FeedbackPopupButtonsSubmit)}
        </Button>
    );

    return (
        <form className={classNames('feedback-form', !hasCommentField && 'feedback-form--small')} onSubmit={onSubmit}>
            {!!title && <h2 className='feedback-popup__title'>{title}</h2>}

            <div className='feedback-form__row'>
                <div className='feedback-form__col'>
                    <fieldset>
                        {!!fields.ScaleTitle?.value && (
                            <legend className='feedback-popup__subtitle'>{fields.ScaleTitle.value}</legend>
                        )}

                        <div className='feedback-form__scale'>
                            {fields.Scale.map(item => (
                                <FeedbackScaleItem
                                    radioGroupName='feedback-scale'
                                    key={item.id}
                                    fields={item.fields}
                                    checked={scaleValue === Number(item.fields?.ScaleValue?.value)}
                                    onChange={value => setScaleValue(value)}
                                />
                            ))}
                        </div>
                    </fieldset>
                </div>

                <div className='feedback-form__col'>
                    {hasCommentField && (
                        <>
                            {!!fields.CommentTitle?.value && (
                                <label className='feedback-popup__subtitle' htmlFor='feedbackComment'>
                                    {fields.CommentTitle.value}
                                </label>
                            )}
                            <textarea
                                id='feedbackComment'
                                data-tid='feedback-form-comment'
                                className='feedback-form__comment'
                                value={comment}
                                rows={isInDrawer ? 10 : 1}
                                placeholder={getPhrase(SitecoreDictionary.FeedbackPopupLabelsCommentPlaceholder)}
                                onChange={e => setComment(e.target.value)}
                            />
                        </>
                    )}

                    {isErrorStatus(submitStatus) && (
                        <ErrorMessage
                            role='alert'
                            message={getPhrase(SitecoreDictionary.FeedbackPopupLabelsErrorMessage)}
                            errorMessageClass='mt-3 mb-0'
                            icon={
                                <i className='error-message__icon'>
                                    <SvgWarningFilled />
                                </i>
                            }
                        />
                    )}

                    {!isInDrawer && submitButton}
                </div>
            </div>

            {isInDrawer && (
                <div className='drawer__actions' data-tid='feedback-form-drawer-actions'>
                    {submitButton}

                    <Button
                        isText
                        type='button'
                        className='ms-0 mt-1'
                        onClick={(): void => {
                            onClose?.();
                            trackClickAction(getPhrase(SitecoreDictionary.FeedbackPopupButtonsDontGiveFeedback));
                        }}
                    >
                        {getPhrase(SitecoreDictionary.FeedbackPopupButtonsDontGiveFeedback)}
                    </Button>
                </div>
            )}
        </form>
    );
};

export default FeedbackForm;
