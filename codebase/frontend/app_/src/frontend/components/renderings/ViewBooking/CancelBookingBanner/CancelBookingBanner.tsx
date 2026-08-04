import React, { FunctionComponent, useEffect } from 'react';
import { Placeholder, Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { ITradePortalStores } from 'frontend/store/tradePortal';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { BookingStatus } from 'models/enum/BookingStatus';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitePath from 'models/enum/SitePath';
import SiteSettings from 'models/enum/SiteSettings';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import LoadingState from 'frontend/components/common/LoadingState/LoadingState';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import RouterLink from 'frontend/components/common/RouterLink';

import styles from './CancelBookingBanner.module.scss';

export enum RefundType {
    NoRefund = 'no-refund',
    OnlyCredit = 'only-credit',
    CreditAndCashRefund = 'credit-and-cash',
    RefundByDestinationRule = 'refund-by-destination-rule',
    RefundByAgency = 'refund-by-agency',
    LessThanXHours = 'less-than-x-hours',
    MoreThanXHours = 'more-than-x-hours',
    RefundUnavailable = 'refund-unavailable',
    OriginalPayment = 'original-payment-refund',
}

export interface ICancelBookingTypeFields {
    CancelButtonLabel: ISitecoreField<string>;
    CancellationType: {
        fields: {
            Value: ISitecoreField<RefundType>;
        };
    };
    Description: ISitecoreField<string>;
    ShowContactUsButton: ISitecoreField<boolean>;
    TermsAndConditionsLink: ISitecoreField<ISitecoreLink>;
    Title: ISitecoreField<string>;
}

interface ICancelBookingBannerFields {
    items: {
        fields: ICancelBookingTypeFields;
    }[];
}

export type TCancelBookingBannerProps = ISitecoreComponent<ICancelBookingBannerFields>;

export const CancelBookingBanner: FunctionComponent<TCancelBookingBannerProps> = ({ fields, rendering }) => {
    const {
        getSetting,
        booking,
        initializeCancellation,
        clearFetchCancellationSummary,
        canBeBookingCancelledFromWebsite,
        isCancellationSummaryIsLoading,
        startBookingCancellation,
        setPrevPagePath,
    } = useStore((stores: ITradePortalStores) => ({
        getSetting: stores.layoutStore.getSetting,
        booking: stores.viewBookingStore.booking,
        initializeCancellation: stores.holidayCreditStore.initializeCancellation,
        canBeBookingCancelledFromWebsite: stores.holidayCreditStore.canBeBookingCancelledFromWebsite,
        clearFetchCancellationSummary: stores.holidayCreditStore.clearFetchCancellationSummary,
        isCancellationSummaryIsLoading: stores.holidayCreditStore.isCancellationSummaryIsLoading,
        setPrevPagePath: stores.holidayCreditStore.setPrevPagePath,
        startBookingCancellation: stores.holidayCreditStore.startBookingCancellation,
    }));

    useEffect(() => {
        initializeCancellation();

        return () => {
            clearFetchCancellationSummary();
        };
    }, [initializeCancellation, clearFetchCancellationSummary]);

    if (!getSetting(SiteSettings.EnableCancellationTradePortal)) {
        return null;
    }

    if (isCancellationSummaryIsLoading) {
        return <LoadingState />;
    }

    if (!booking || booking.bookingStatus === BookingStatus.Canceled || !canBeBookingCancelledFromWebsite) {
        return null;
    }

    const dataField = fields?.items?.find(field => {
        const type = field.fields?.CancellationType?.fields?.Value?.value;

        if (booking.amendmentInfo?.canBookingCancelled) {
            return type === RefundType.MoreThanXHours;
        }

        return type === RefundType.LessThanXHours;
    });

    if (!dataField?.fields) {
        return null;
    }

    const { Title, Description, CancelButtonLabel, ShowContactUsButton, TermsAndConditionsLink } = dataField.fields;

    const hoursUntilBookingCanBeCancelled = getSetting(SiteSettings.CancellationRestrictionHours);
    const description = Tokenizer.replaceToken(Description.value, Tokens.Hours, hoursUntilBookingCanBeCancelled);

    const onClickButton = (): void => {
        setPrevPagePath(SitePath.TradePortalViewBooking);
        startBookingCancellation();
    };

    return (
        <div className={classNames(styles.sizeContainer, 'no-print')}>
            <div className={styles.container} data-tid='cancel-booking-banner'>
                <div className={styles.contentContainer}>
                    <Text tag='h3' field={Title} className={styles.title} data-tid='cancel-booking-banner-title' />
                    <RichTextWithLinks
                        field={{ value: description }}
                        className={styles.description}
                        dataId='cancel-booking-banner-description'
                    />
                </div>
                <div className={styles.buttonsContainer}>
                    {!!ShowContactUsButton.value && (
                        <Placeholder
                            name={PlaceholderNames.ContactUs}
                            rendering={rendering}
                            data-tid='placeholder-contact-us'
                        />
                    )}
                    {!!CancelButtonLabel.value && (
                        <Button
                            onClick={onClickButton}
                            isOutlined
                            className={styles.cancelButton}
                            data-tid='cancel-booking-banner-button'
                        >
                            {CancelButtonLabel.value}
                        </Button>
                    )}
                    {!!TermsAndConditionsLink?.value?.href && (
                        <RouterLink
                            link={TermsAndConditionsLink}
                            className={classNames(styles.ctaLink, 'btn btn--medium')}
                            dataId='terms-cta-link'
                        >
                            {TermsAndConditionsLink.value.text}
                        </RouterLink>
                    )}
                </div>
            </div>
        </div>
    );
};

export default observer(CancelBookingBanner);
