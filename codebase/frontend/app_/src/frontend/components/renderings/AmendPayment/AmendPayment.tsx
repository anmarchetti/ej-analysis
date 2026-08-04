import { FC, useEffect } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { PaymentStep } from 'models/data/AmendInfo';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SitePath from 'models/enum/SitePath';
import PriceBreakdown from 'frontend/components/common/PriceBreakdown/PriceBreakdown';
import {
    gaHolidaysUnavailable,
    getAmendUnavailabilityReasonFromProduct,
    HolidaysUnavailableReason,
} from 'frontend/components/renderings/Payment/GAPaymentEventHandlers';
import { usePaymentTracking } from 'frontend/components/renderings/Payment/trackingHooks/usePaymentTracking';
import useTrackPaymentErrors from 'frontend/components/renderings/Payment/trackingHooks/useTrackPaymentErrors';
import { usePaymentInitialization } from 'frontend/components/renderings/Payment/usePaymentInitialization';
import WarningPopup from 'frontend/components/renderings/WarningPopup/WarningPopup';

import AmendCheckingChangesLoader, {
    DEFAULT_CHECKING_CHANGES_TEXT,
} from './components/AmendCheckingChangesLoader/AmendCheckingChangesLoader';
import AmendPaymentAccordion from './components/AmendPaymentAccordion/AmendPaymentAccordion';
import AmendPaymentErrorPopup, {
    IAmendPaymentErrorPopupProps,
} from './components/AmendPaymentErrorPopup/AmendPaymentErrorPopup';
import AmendUnavailablePopup from './components/AmendUnavailablePopup/AmendUnavailablePopup';
import { getPriceBreakdown } from './AmendPayment.utils';
import { TAmendPaymentProps } from './interfaces';

import amendPaymentStyles from './amendPayment.module.scss';

const AmendPayment: FC<TAmendPaymentProps> = props => {
    const {
        price,
        isLoadingData,
        isLoadingDataError,
        initialize,
        getPhrase,
        booking,
        isOnlyCreditRefund,
        isAtcomError,
        showBooking,
        toggleErrorPopupVisibility,
        isErrorPopupShown,
        goBackToPreviousPage,
        amendmentPaymentInfo,
        balanceAmount,
        isPaying,
        canAddToBalance,
        redirectFromPaymentPage,
        isSeatNoLongerAvailable,
        handleContinueWithoutSeats,
        isPayingFeesOnly,
        totalPaymentAmount,
        amountToPay,
        transferErrors,
        paymentErrors,
        holidayCredit,
        amendmentType,
        isFromAmendDates,
        isProductUnavailable,
        currency,
        hasTouristTax,
        newTaxesAndFees,
        newTouristTaxConverted,
        prevTouristTax,
    } = useStore((stores: IHolidaysStores) => ({
        price: stores.amendPaymentStore.totalPrice,
        amendmentPaymentInfo: stores.amendPaymentStore.amendmentPaymentInfo,
        booking: stores.amendPaymentStore.booking,
        isLoadingData: stores.amendPaymentStore.isLoadingData,
        isLoadingDataError: stores.amendPaymentStore.isLoadingDataError,
        initialize: stores.amendPaymentStore.initialize,
        isOnlyCreditRefund: stores.amendPaymentStore.isOnlyCreditRefund,
        getPhrase: stores.layoutStore.getPhrase,
        isAtcomError: stores.payStore.isAtcomError,
        showBooking: stores.viewBookingStore.showBooking,
        isErrorPopupShown: stores.amendPaymentStore.isErrorPopupShown,
        toggleErrorPopupVisibility: stores.amendPaymentStore.toggleErrorPopupVisibility,
        amendmentType: stores.amendPaymentStore.amendmentType,
        isFromAmendDates: stores.amendPaymentStore.isFromAmendDates,
        goBackToPreviousPage: stores.amendPaymentStore.goBackToPreviousPage,
        isProductUnavailable: stores.amendPaymentStore.isProductUnavailable,
        balanceAmount: stores.amendPaymentStore.balanceAmount,
        isPaying: stores.amendPaymentStore.isPaying,
        canAddToBalance: stores.amendPaymentStore.canAddToBalance,
        isSeatNoLongerAvailable: stores.amendDatesStore.seats.isSeatNoLongerAvailable,
        handleContinueWithoutSeats: stores.amendDatesStore.seats.handleContinueWithoutSeats,
        redirectFromPaymentPage: stores.amendPaymentStore.redirectFromPaymentPage,
        isPayingFeesOnly: stores.amendPaymentStore.isPayingFeesOnly,
        totalPaymentAmount: stores.amendPaymentStore.totalPaymentAmount,
        amountToPay: stores.payStore.amountToPay,
        transferErrors: stores.payStore.transferErrors,
        paymentErrors: stores.payStore.paymentErrors,
        holidayCredit: stores.payStore.usedCredit,
        currency: stores.marketStore.currency,
        hasTouristTax: stores.amendPaymentStore.hasTouristTax,
        newTaxesAndFees: stores.amendPaymentStore.newTaxesAndFees,
        newTouristTaxConverted: stores.amendPaymentStore.newTouristTaxConverted,
        prevTouristTax: stores.amendPaymentStore.prevTouristTax,
    }));

    usePaymentInitialization(initialize);
    useTrackPaymentErrors(transferErrors, paymentErrors);

    const { pushTrackingEvent } = usePaymentTracking();

    useEffect(() => {
        if (isProductUnavailable) {
            pushTrackingEvent(gaHolidaysUnavailable(getAmendUnavailabilityReasonFromProduct(amendmentType)));
        } else if (isSeatNoLongerAvailable) {
            pushTrackingEvent(gaHolidaysUnavailable(HolidaysUnavailableReason.SEATS));
        }
    }, [isProductUnavailable, amendmentType, isSeatNoLongerAvailable, pushTrackingEvent]);

    const onCloseErrorPopup = (): void => {
        if (isAtcomError) {
            showBooking(booking, false);
        }

        toggleErrorPopupVisibility(false);
    };

    if (!props.fields) {
        return null;
    }

    const { PopupIcon, SeatsPopupTitle, SeatsPopupDescription, SeatsPopupPrimaryCTA, SeatsPopupSecondaryCTA } =
        props.fields;

    const onProductUnavailableClose = (): void => {
        if (isFromAmendDates) {
            return redirectFromPaymentPage(SitePath.AmendDates);
        }

        return goBackToPreviousPage();
    };

    if (isLoadingDataError && !isProductUnavailable) {
        return <AmendUnavailablePopup fields={props.fields} />;
    }

    const accordionSteps = totalPaymentAmount === 0 ? [PaymentStep.Entity, PaymentStep.Confirmation] : undefined;

    // Show the previous balance only when less than 28 (or any other amount) days and not paying only fees
    const previousBalance = !canAddToBalance && !isPayingFeesOnly ? balanceAmount : undefined;

    const isShowLoader = isLoadingData || isPaying;
    const checkingChangesHeader =
        getPhrase(SitecoreDictionary.AmendBookingLabelsCheckingChanges) || DEFAULT_CHECKING_CHANGES_TEXT;

    const priceBreakdownItem = getPriceBreakdown(
        amendmentType,
        amendmentPaymentInfo?.amendmentChargesWithoutFees ?? price,
        props.fields,
    );

    return (
        <div
            className={classNames({
                [amendPaymentStyles.shrink]: isOnlyCreditRefund,
            })}
        >
            <div className={amendPaymentStyles.topContentWrapper}>
                <AmendPaymentAccordion fields={props.fields} rendering={props.rendering} steps={accordionSteps} />

                <PriceBreakdown
                    totalPrice={amountToPay}
                    subTotalPrice={price}
                    feesPerPersons={amendmentPaymentInfo?.feesPerPersons}
                    feeChargePrice={amendmentPaymentInfo?.totalFeesAmount}
                    fields={props.fields}
                    previousBalance={previousBalance}
                    priceBreakdownItems={priceBreakdownItem}
                    holidayCredit={holidayCredit}
                    currency={currency}
                    touristTaxData={{
                        hasTouristTax,
                        newTaxesAndFees: newTaxesAndFees ?? [],
                        newTouristTaxConverted,
                        prevTouristTax,
                    }}
                    touristTaxFields={{
                        paidToUsLabel: props.fields.PaidToUs?.value,
                        prevTaxLabel: props.fields.PrevTax?.value,
                        newTaxLabel: props.fields.NewTax?.value,
                        newTaxPopupTitle: props.fields.NewTaxPopupTitle?.value,
                        newTaxPopupContent: props.fields.NewTaxPopupContent?.value,
                    }}
                />
            </div>

            {isErrorPopupShown && (
                <AmendPaymentErrorPopup
                    fields={props.fields as IAmendPaymentErrorPopupProps['fields']}
                    onClose={onCloseErrorPopup}
                />
            )}
            {isProductUnavailable && (
                <Placeholder
                    name={PlaceholderNames.ProductUnavailablePopup}
                    product={amendmentType}
                    onClose={onProductUnavailableClose}
                    rendering={props.rendering}
                />
            )}

            <Placeholder name={PlaceholderNames.UnAvailableFlowPopup} rendering={props.rendering} />

            {isSeatNoLongerAvailable && (
                <WarningPopup
                    icon={PopupIcon}
                    title={SeatsPopupTitle}
                    description={SeatsPopupDescription}
                    ctaText={SeatsPopupPrimaryCTA}
                    onClose={goBackToPreviousPage}
                    secondaryCtaText={SeatsPopupSecondaryCTA}
                    onSecondaryCtaClick={handleContinueWithoutSeats}
                />
            )}

            <Placeholder name={PlaceholderNames.PriceJumpPopup} rendering={props.rendering} />

            {isShowLoader && <AmendCheckingChangesLoader header={checkingChangesHeader} />}
        </div>
    );
};

export default observer(AmendPayment);
