import React, { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import FloatingPopup from 'frontend/components/common/FloatingPopup/FloatingPopup';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

import styles from './CancellationErrorPopup.module.scss';

export interface ICancellationErrorPopupFields {
    ErrorPopupButtonLabel: ISitecoreField<string>;
    ErrorPopupDescription: ISitecoreField<string>;
    ErrorPopupTitle: ISitecoreField<string>;
}

export interface IFailedToLoadPopupFields {
    FailedToLoadPopupButtonLabel: ISitecoreField<string>;
    FailedToLoadPopupDescription: ISitecoreField<string>;
    FailedToLoadPopupTitle: ISitecoreField<string>;
}

export type TCancellationErrorPopupProps = {
    fields: ICancellationErrorPopupFields & IFailedToLoadPopupFields;
};

export const CancellationErrorPopup: FC<TCancellationErrorPopupProps> = ({ fields }) => {
    const { redirectToViewBookingPage, isCancellationSummaryFailed, isCreditBookingFailed } = useStore(
        (stores: TStores) => ({
            redirectToViewBookingPage: stores.routerStore.redirectToViewBookingPage,
            isCancellationSummaryFailed: stores.holidayCreditStore.isCancellationSummaryFailed,
            isCreditBookingFailed: stores.holidayCreditStore.isCreditBookingFailed,
        }),
    );

    if (!isCreditBookingFailed && !isCancellationSummaryFailed) return null;

    const Title = isCancellationSummaryFailed ? fields.FailedToLoadPopupTitle : fields.ErrorPopupTitle;
    const Description = isCancellationSummaryFailed
        ? fields.FailedToLoadPopupDescription
        : fields.ErrorPopupDescription;
    const buttonLabel = isCancellationSummaryFailed
        ? fields.FailedToLoadPopupButtonLabel.value
        : fields.ErrorPopupButtonLabel.value;

    return (
        <FloatingPopup
            onClose={redirectToViewBookingPage}
            footerContent={
                <Button
                    onClick={redirectToViewBookingPage}
                    isFullWidth
                    aria-label={buttonLabel}
                    dataTid='cancellation-error-button'
                >
                    {buttonLabel}
                </Button>
            }
            contentClass={styles.popup}
        >
            <div>
                <Text field={Title} className={styles.title} tag='h4' data-tid='cancellation-error-title' />
                <RichTextWithLinks
                    className={styles.description}
                    field={Description}
                    dataId='cancellation-error-description'
                />
            </div>
        </FloatingPopup>
    );
};

export default observer(CancellationErrorPopup);
