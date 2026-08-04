import React, { FunctionComponent, useEffect, useState } from 'react';
import { Placeholder, Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores, isHolidayStore } from 'frontend/store/holidays';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { ViewBookingTrackingEvents } from 'frontend/utils/tracking/viewBooking.utils';
import { getViewBookingRedirectLink, isFlightDeparted } from 'frontend/utils/viewBooking.utils';
import { CreditExpiryState } from 'models/data/MyCreditInfo';
import { BookingStatus } from 'models/enum/BookingStatus';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreCompositeField, ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import LoadingState from 'frontend/components/common/LoadingState/LoadingState';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import RouterLink from 'frontend/components/common/RouterLink';
import SVGWarningFilled from 'frontend/components/icons-new/WarningFilled';
import { RefundType } from 'frontend/components/renderings/ViewBooking/CancelBookingBanner/CancelBookingBanner';
import RefundInfoPopup from 'frontend/components/renderings/ViewBooking/RefundInfoPopup';

import { getBannerContent } from './utils/RefundInfo.utils';

import styles from './RefundInfo.module.scss';

export interface IRefundInfoItemFields {
    CancelButtonText: ISitecoreField<string>;
    Description: ISitecoreField<string>;
    IsCancelButtonHidden: ISitecoreField<boolean>;
    RefundType: {
        fields: {
            Value: ISitecoreField<RefundType>;
        };
    };
    ShowContactUsButton: ISitecoreField<boolean>;
    TermsAndConditionsLink: ISitecoreField<ISitecoreLink>;
    Title: ISitecoreField<string>;
}

export interface ICreditExpiryPopupItemFields {
    CreditExpiryState: ISitecoreField<CreditExpiryState>;
    Subheading: ISitecoreField<string>;
    Text: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}

export interface IRefundInfoFields {
    Children: ISitecoreCompositeField<IRefundInfoItemFields>[];
    ExpiryPopupCTA: ISitecoreField<string>;
    ExpiryPopupCancelCTA: ISitecoreField<string>;
    ExpiryPopupItems: ISitecoreCompositeField<ICreditExpiryPopupItemFields>[];
}

export type TRefundInfoProps = ISitecoreComponent<IRefundInfoFields>;
/** This rendering is added to placeholder PlaceholderNames.CreditBookingDisruption on View Booking Page */
export const RefundInfo: FunctionComponent<TRefundInfoProps> = ({ fields, rendering }) => {
    const {
        isCreditBookingEnabled,
        isCreditEnabledApiSettings,
        getPhrase,
        isBookingCancellationAllowed,
        getSetting,
        startBookingCancellation,
        fireViewBookingTrackingEvent,
        isLoggedIn,
        booking,
        isViewBookingStatusPage,
        initializeCancellation,
        isOneTimeUseCreditEnabled,
        clearFetchCancellationSummary,
        isEligibleForOriginalPaymentRefund,
        isEligibleForCreditRefund,
        isCancellationSummaryIsLoading,
        canBeBookingCancelledFromWebsite,
        setPrevPagePath,
        viewBookingPageState,
        viewBookingLinks,
        cancellationSummary,
        showCreditExpiryInfoPopupBeforeCancellation,
    } = useStore((stores: IHolidaysStores) => ({
        isCreditBookingEnabled: stores.holidayCreditStore.isCreditBookingEnabled,
        isCreditEnabledApiSettings: stores.holidayCreditStore.isCreditEnabledApiSettings,
        getPhrase: stores.layoutStore.getPhrase,
        isBookingCancellationAllowed: stores.viewBookingStore.isBookingCancellationAllowed,
        getSetting: stores.layoutStore.getSetting,
        startBookingCancellation: stores.holidayCreditStore.startBookingCancellation,
        fireViewBookingTrackingEvent: isHolidayStore(stores) && stores.trackingStore.fireViewBookingEvent,
        isLoggedIn: stores.userStore.isLoggedIn,
        booking: stores.viewBookingStore.booking,
        isViewBookingStatusPage: isHolidayStore(stores) && stores.viewBookingStore.isViewBookingStatusPage,
        initializeCancellation: stores.holidayCreditStore.initializeCancellation,
        isOneTimeUseCreditEnabled: stores.holidayCreditStore.isOneTimeUseCreditEnabled,
        clearFetchCancellationSummary: stores.holidayCreditStore.clearFetchCancellationSummary,
        isEligibleForCreditRefund: stores.holidayCreditStore.isEligibleForCreditRefund,
        isEligibleForOriginalPaymentRefund: stores.holidayCreditStore.isEligibleForOriginalPaymentRefund,
        isCancellationSummaryIsLoading: stores.holidayCreditStore.isCancellationSummaryIsLoading,
        canBeBookingCancelledFromWebsite: stores.holidayCreditStore.canBeBookingCancelledFromWebsite,
        setPrevPagePath: stores.holidayCreditStore.setPrevPagePath,
        viewBookingPageState: stores.viewBookingStore.viewBookingPageState,
        viewBookingLinks: stores.layoutStore.viewBookingLinks,
        cancellationSummary: stores.holidayCreditStore.cancellationSummary,
        showCreditExpiryInfoPopupBeforeCancellation:
            stores.holidayCreditStore.showCreditExpiryInfoPopupBeforeCancellation,
    }));
    const [isPopupOpened, setIsPopupOpened] = useState<boolean>(false);

    useEffect(() => {
        if (isOneTimeUseCreditEnabled) {
            initializeCancellation();
        }

        return () => {
            clearFetchCancellationSummary();
        };
    }, [initializeCancellation, clearFetchCancellationSummary, isOneTimeUseCreditEnabled]);

    const isUserLeadPassenger = isLoggedIn && booking?.isLoggedInAsLeadPassenger;

    if (
        !booking ||
        !isCreditBookingEnabled ||
        booking.bookingStatus === BookingStatus.Canceled ||
        (!isUserLeadPassenger && !booking.isExternalAgency) ||
        isFlightDeparted(booking) ||
        (!canBeBookingCancelledFromWebsite && (!booking.isDestinationRulesApplied || booking.isExternalAgency)) ||
        (!isOneTimeUseCreditEnabled && !isEligibleForCreditRefund && !isEligibleForOriginalPaymentRefund)
    ) {
        return null;
    }

    // Show an error message if currently credit functionality are not available in API
    if (!isCreditEnabledApiSettings && !booking.isExternalAgency) {
        return (
            <div className={classNames(styles.sizeContainer, 'no-print')} data-tid='refund-info-unavailable-container'>
                <div className={styles.container}>
                    <div>
                        <h2 className={styles.title}>
                            {getPhrase(SitecoreDictionary.HolidayCreditTitlesHolidayCredit)}
                        </h2>
                        <div className={styles.errorMessage}>
                            <SVGWarningFilled />
                            <span>{getPhrase(SitecoreDictionary.HolidayCreditErrorMessagesCantAccessToCredit)}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isCancellationSummaryIsLoading) {
        return <LoadingState />;
    }

    const content = getBannerContent(
        booking,
        fields?.Children,
        !isBookingCancellationAllowed,
        isEligibleForCreditRefund,
        isEligibleForOriginalPaymentRefund,
    );

    if (!content?.fields || !fields) {
        return null;
    }

    const { Title, Description, CancelButtonText, IsCancelButtonHidden, TermsAndConditionsLink, ShowContactUsButton } =
        content.fields;
    const isButtonShown = !IsCancelButtonHidden?.value && !!CancelButtonText?.value;

    const hasExpiredOrExpiringCredit =
        cancellationSummary?.creditExpiryState && cancellationSummary.creditExpiryState !== CreditExpiryState.None;

    const creditExpiryPopupContent = fields?.ExpiryPopupItems?.find(
        item => item.fields?.CreditExpiryState?.value === cancellationSummary?.creditExpiryState,
    );

    const openPopup = (): void => {
        setIsPopupOpened(true);
    };

    const onClickButton = (): void => {
        setPrevPagePath(getViewBookingRedirectLink(viewBookingPageState, viewBookingLinks));
        startBookingCancellation();
        fireViewBookingTrackingEvent &&
            fireViewBookingTrackingEvent?.(ViewBookingTrackingEvents.CancelBooking, 'Cancel Booking');
    };

    const handleCancelBooking = (): void => {
        if (showCreditExpiryInfoPopupBeforeCancellation && hasExpiredOrExpiringCredit && creditExpiryPopupContent) {
            openPopup();
        } else {
            onClickButton();
        }
    };

    const onClosePopup = (): void => {
        setIsPopupOpened(false);
    };

    const description = Tokenizer.replaceToken(
        Description.value,
        Tokens.Hours,
        getSetting(SiteSettings.CancellationRestrictionHours),
    );

    return (
        <>
            <RefundInfoPopup
                onClosePopup={onClosePopup}
                onClickButton={onClickButton}
                creditExpiryPopupFields={creditExpiryPopupContent?.fields}
                isOpened={isPopupOpened}
                ExpiryPopupCTA={fields.ExpiryPopupCTA}
                ExpiryPopupCancelCTA={fields.ExpiryPopupCancelCTA}
            />
            <div
                className={classNames(
                    styles.container,
                    isViewBookingStatusPage && styles.masonryItemContainer,
                    'no-print',
                )}
                data-tid='refund-info-container'
            >
                <div>
                    <Text tag='h2' field={Title} className={styles.title} data-tid='refund-info-title' />
                    <RichTextWithLinks
                        field={{ value: description }}
                        className={styles.description}
                        dataId='refund-info-description'
                    />
                </div>
                <div className={styles.buttonsContainer}>
                    {!!ShowContactUsButton?.value && (
                        <Placeholder
                            name={PlaceholderNames.ContactUs}
                            rendering={rendering}
                            data-tid='placeholder-contact-us'
                        />
                    )}
                    {isButtonShown && (
                        <Button
                            onClick={handleCancelBooking}
                            isSmall
                            isOutlined
                            disabled={!isBookingCancellationAllowed}
                            className={classNames(styles.cancelButton, 'btn btn--small')}
                            data-tid='refund-info-button'
                        >
                            {CancelButtonText.value}
                        </Button>
                    )}
                    {!isButtonShown && !!TermsAndConditionsLink?.value?.href && (
                        <RouterLink
                            link={TermsAndConditionsLink}
                            className={classNames(styles.ctaLink, 'btn btn--small')}
                            dataId='terms-cta-link'
                        >
                            {TermsAndConditionsLink.value.text}
                        </RouterLink>
                    )}
                </div>
            </div>
        </>
    );
};

export default observer(RefundInfo);
