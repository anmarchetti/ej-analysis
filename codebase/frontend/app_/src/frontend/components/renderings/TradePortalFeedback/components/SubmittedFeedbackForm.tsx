import React, { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import useStore from 'frontend/hooks/useStore';
import { ITradePortalStores } from 'frontend/store/tradePortal';
import Button from 'frontend/components/common/Button';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import ComponentWrapper from 'frontend/components/renderings/static/ComponentWrapper';
import { ITradePortalFeedbackFields } from 'frontend/components/renderings/TradePortalFeedback/TradePortalFeedback';

export interface ISubmittedFeedbackFormProps {
    fields: ITradePortalFeedbackFields;
}

export const SubmittedFeedbackForm: FC<ISubmittedFeedbackFormProps> = ({ fields }) => {
    const { redirectToHomePage } = useStore((stores: ITradePortalStores) => ({
        redirectToHomePage: stores.routerStore.redirectToHomePage,
    }));

    if (!fields) {
        return null;
    }

    const { ConfirmationTitle, ConfirmationSubtitle, ConfirmationButton } = fields || {};

    return (
        <>
            {ConfirmationTitle && (
                <ComponentWrapper params={{ IsGreyBackground: '1', IsTriangleEnd: '1', IsTriangleEndReverse: '1' }}>
                    <Text
                        field={ConfirmationTitle}
                        tag='h1'
                        className='feedback-form__title'
                        data-tid='feedback-form-submitted-title'
                    />
                </ComponentWrapper>
            )}
            <ComponentWrapper>
                {ConfirmationSubtitle && (
                    <RichTextWithLinks
                        field={ConfirmationSubtitle}
                        tag='p'
                        className='feedback-form__subtitle'
                        dataId='feedback-form-submitted-subtitle'
                    />
                )}
                {ConfirmationButton && (
                    <Button
                        isMedium
                        type='button'
                        onClick={redirectToHomePage}
                        className='feedback-confirm__btn'
                        dataTid='feedback-form-submitted-btn'
                    >
                        {ConfirmationButton.value}
                    </Button>
                )}
            </ComponentWrapper>
        </>
    );
};

export default SubmittedFeedbackForm;
