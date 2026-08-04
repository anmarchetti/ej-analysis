import React, { FC, useEffect, useState } from 'react';
import { observer } from 'mobx-react';

import { ICurrencyFormatOptions } from 'code/currency';
import { Tokens } from 'code/tokens';
import { useGoBack } from 'frontend/hooks/useGoBack';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { AmendEventActions } from 'models/data/tracking/AmendEvent';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import { Popup } from 'frontend/components/common/Popup';
import { gaTriggerPriceJumpPopup } from 'frontend/components/renderings/Payment/GAPaymentEventHandlers';
import { usePaymentTracking } from 'frontend/components/renderings/Payment/trackingHooks/usePaymentTracking';

import PriceJumpPopupContent from './components/PriceJumpPopupContent/PriceJumpPopupContent';
import PriceJumpPopupFooter from './components/PriceJumpPopupFooter/PriceJumpPopupFooter';
import { usePriceJumpPopupTracking } from './hooks/usePriceJumpPopupTracking';
import { getAmendmentDescriptionTemplate, getPrices, getPromoCodeSubtitle } from './PriceJumpPopup.utils';

import styles from './PriceJumpPopup.module.scss';

export interface IPriceJumpPopupFields {
    CloseButtonLabel: ISitecoreField<string>;
    ContinueButtonLabel: ISitecoreField<string>;
    DeclineButtonLabel: ISitecoreField<string>;
    DefaultDescription: ISitecoreField<string>;
    FlightDescription: ISitecoreField<string>;
    Icon: ISitecoreField<ISitecoreImage>;
    PromoDowngradeLabel: ISitecoreField<string>;
    PromoRemoveLabel: ISitecoreField<string>;
    PromoUpgradeLabel: ISitecoreField<string>;
    QuestionLabel: ISitecoreField<string>;
    RefundDescription: ISitecoreField<string>;
    StatusDecreased: ISitecoreField<string>;
    StatusIncreased: ISitecoreField<string>;
    Title: ISitecoreField<string>;
    TransferDescription: ISitecoreField<string>;
}

export type TPriceJumpPopupProps = ISitecoreComponent<IPriceJumpPopupFields>;

export const PriceJumpPopup: FC<TPriceJumpPopupProps> = ({ fields }) => {
    const {
        goBackToPreviousPage,
        isFromAmendFlight,
        isFromAmendTransfer,
        trackGenericAmendmentAction,
        currency,
        formatMoney,
        roomAndBoardPromoCodeStatus,
        isAmendPaymentPage,
        amendPaymentPrice,
        prevSelectedItemPrice,
        isAmendDatesSummaryPage,
        amendDatesPrice,
        prevAmendDatesPrice,
        amendFlightPrice,
        prevAmendFlightPrice,
        isAmendFlightsPage,
        amendTransferPrice,
        prevAmendTransferPrice,
        isAmendTransfersPage,
        isAmendHotelSummaryPage,
        amendHotelOffer,
        prevAmendHotelOffer,
        redirectToAmendHotelPage,
        isProductUnavailable,
        isAmendPaymentLoadingData,
        isAmendErrorPopupShown,
        isLoadingFromPayload,
        setPrevSelectedHotelOffer,
        isFromAmendHotel,
        setDatesPrevOfferWithPrices,
    } = useStore((stores: IHolidaysStores) => ({
        isAmendPaymentPage: stores.layoutStore.isAmendPaymentPage,
        isAmendDatesSummaryPage: stores.layoutStore.isAmendDatesSummaryPage,
        isAmendFlightsPage: stores.layoutStore.isAmendFlightsPage,
        isAmendHotelSummaryPage: stores.layoutStore.isAmendHotelSummaryPage,
        isAmendTransfersPage: stores.layoutStore.isAmendTransfersPage,
        isFromAmendFlight: stores.amendPaymentStore.isFromAmendFlight,
        goBackToPreviousPage: stores.amendPaymentStore.goBackToPreviousPage,
        redirectToAmendHotelPage: stores.routerStore.redirectToAmendHotelPage,
        isFromAmendTransfer: stores.amendPaymentStore.isFromAmendTransfer,
        isFromAmendHotel: stores.amendPaymentStore.isFromAmendHotel,
        roomAndBoardPromoCodeStatus:
            stores.amendRoomAndBoardStore.chosenRoomVariant?.promoCodeBreakDown?.promoCodeStatus,
        trackGenericAmendmentAction: stores.trackingStore.trackGenericAmendmentAction,
        currency: stores.amendPaymentStore.currency,
        formatMoney: stores.marketStore.formatMoney,
        amendPaymentPrice: stores.amendPaymentStore.totalPrice,
        prevSelectedItemPrice: stores.amendPaymentStore.prevSelectedItemPrice,
        amendDatesPrice: stores.amendDatesStore.offerPrices?.amendmentDatesCharges,
        prevAmendDatesPrice: stores.amendDatesStore.prevOfferWithPrices?.amendmentDatesCharges,
        setDatesPrevOfferWithPrices: stores.amendDatesStore.setPrevOfferWithPrices,
        amendFlightPrice: stores.amendFlightsStore.selectedFlight?.amendmentCharges,
        prevAmendFlightPrice: stores.amendFlightsStore.prevSelectedFlight?.amendmentCharges,
        amendTransferPrice: stores.amendTransfersStore.selectedTransfer?.amendmentCharges,
        prevAmendTransferPrice: stores.amendTransfersStore.prevSelectedTransfer?.amendmentCharges,
        amendHotelOffer: stores.amendHotelStore.newlySelectedHotelOffer,
        setPrevSelectedHotelOffer: stores.amendHotelStore.setPrevSelectedHotelOffer,
        prevAmendHotelOffer: stores.amendHotelStore.prevSelectedHotelOffer,
        isProductUnavailable: stores.amendPaymentStore.isProductUnavailable,
        isAmendPaymentLoadingData: stores.amendPaymentStore.isLoadingData,
        isAmendErrorPopupShown: stores.viewBookingStore.isAmendErrorPopupShown,
        isLoadingFromPayload: stores.viewBookingStore.isLoadingBookingFromPayload,
    }));

    const [isPopupShown, setIsPopupShown] = useState(false);
    const handleDeclineGoBack = useGoBack(goBackToPreviousPage);

    const { pushTrackingEvent } = usePaymentTracking();
    const { trackAppear, trackInteraction } = usePriceJumpPopupTracking();

    const { deltaPrice, totalPrice, isPriceJumpPopupShownByPrice } = getPrices({
        flight: {
            isPage: isAmendFlightsPage,
            price: amendFlightPrice,
            prevPrice: prevAmendFlightPrice,
        },
        transfer: {
            isPage: isAmendTransfersPage,
            price: amendTransferPrice,
            prevPrice: prevAmendTransferPrice,
        },
        dates: {
            isPage: isAmendDatesSummaryPage,
            price: amendDatesPrice,
            prevPrice: prevAmendDatesPrice,
        },
        payment: {
            isPage: isAmendPaymentPage,
            price: amendPaymentPrice,
            prevPrice: prevSelectedItemPrice,
        },
        hotel: {
            isPage: isAmendHotelSummaryPage,
            price: amendHotelOffer?.amendmentPaymentInfo?.amendmentChargesWithoutFees,
            prevPrice:
                prevAmendHotelOffer?.amendmentPaymentInfo?.amendmentChargesWithoutFees ||
                prevAmendHotelOffer?.amendmentChargesInfo?.fullAmendmentCharges,
            totalPriceToBeShown: amendHotelOffer?.amendmentChargesInfo?.fullAmendmentCharges,
        },
    });

    useEffect(() => {
        if (isPopupShown) {
            pushTrackingEvent(gaTriggerPriceJumpPopup);
            trackAppear(deltaPrice);
        }
    }, [isPopupShown, pushTrackingEvent]);

    useEffect(() => {
        if (isAmendPaymentPage) {
            setIsPopupShown(isPriceJumpPopupShownByPrice && !isAmendPaymentLoadingData && !isProductUnavailable);

            return;
        }

        if (isAmendDatesSummaryPage) {
            setIsPopupShown(isPriceJumpPopupShownByPrice && !isLoadingFromPayload);

            return;
        }

        setIsPopupShown(isPriceJumpPopupShownByPrice && !isLoadingFromPayload && !isAmendErrorPopupShown);
    }, [
        isPriceJumpPopupShownByPrice,
        isLoadingFromPayload,
        isAmendErrorPopupShown,
        isAmendPaymentPage,
        isAmendPaymentLoadingData,
    ]);

    if (!fields || !isPopupShown) {
        return null;
    }

    const { StatusIncreased, StatusDecreased, RefundDescription } = fields;

    const hidePriceJumpPopup = (): void => {
        setIsPopupShown(false);
        trackInteraction(deltaPrice, true);

        if (isFromAmendTransfer) {
            trackGenericAmendmentAction(AmendEventActions.ChangeTransfer, 'Price Change: Close');
        }

        if (isAmendHotelSummaryPage) {
            setPrevSelectedHotelOffer(amendHotelOffer);
        }

        if (isAmendDatesSummaryPage) {
            setDatesPrevOfferWithPrices(null);
        }
    };

    const handleDecline = (): void => {
        trackInteraction(deltaPrice);

        if (isAmendHotelSummaryPage || isFromAmendHotel) {
            redirectToAmendHotelPage();

            return;
        }

        handleDeclineGoBack();
    };

    const currencyOptions: ICurrencyFormatOptions = {
        currency,
        maximumFractionDigits: 0,
    };

    const deltaAmountAbs = Math.abs(deltaPrice);

    const amendmentTemplate = getAmendmentDescriptionTemplate(
        { flight: isFromAmendFlight, transfer: isFromAmendTransfer },
        fields,
    );

    const promoCodeSubtitle = getPromoCodeSubtitle(fields, roomAndBoardPromoCodeStatus);

    const onlyCloseButton = isAmendTransfersPage || isAmendFlightsPage;

    const description = Tokenizer.replaceTokens(amendmentTemplate, {
        [Tokens.ChangeStatus]: deltaPrice < 0 ? StatusDecreased.value : StatusIncreased.value,
        [Tokens.Delta]: formatMoney(deltaAmountAbs, currencyOptions),
        [Tokens.TotalAmount]: formatMoney(totalPrice, currencyOptions),
    });

    const refundDescription = Tokenizer.replaceTokens(RefundDescription.value, {
        [Tokens.RefundAmount]: formatMoney(Math.abs(totalPrice), currencyOptions),
    });

    return (
        <Popup
            contentClass={styles.content}
            footerContent={
                <PriceJumpPopupFooter
                    fields={fields}
                    onClose={hidePriceJumpPopup}
                    onDecline={handleDecline}
                    isOnlyCloseButton={onlyCloseButton}
                    isOnlyContinueButton={isAmendDatesSummaryPage}
                />
            }
        >
            <PriceJumpPopupContent
                fields={fields}
                description={description}
                refundDescription={refundDescription}
                isRefund={totalPrice < 0}
                isOnlyOneButton={isAmendDatesSummaryPage || onlyCloseButton}
                promoCodeSubtitle={promoCodeSubtitle}
            />
        </Popup>
    );
};

export default observer(PriceJumpPopup);
