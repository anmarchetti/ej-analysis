import React, { useEffect, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { isTradeStore } from 'frontend/store/tradePortal';
import isBackend from 'frontend/utils/isBackend';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import ConfirmationCheckbox from 'frontend/components/common/ConfirmationInfo/ConfirmationCheckbox';
import { Popup } from 'frontend/components/common/Popup';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

interface ISeatsNotAvailablePopupFields {
    ClearSeatsButtonText: ISitecoreField<string>;
    ConfirmationCheckboxLabel: ISitecoreField<string>;
    Description: ISitecoreField<string>;
    ReselectSeatsButtonText: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}

type TSeatsNotAvailablePopupProps = ISitecoreComponent<ISeatsNotAvailablePopupFields>;

export const SeatsNotAvailablePopup = ({ fields }: TSeatsNotAvailablePopupProps) => {
    const [isAgreementRead, setIsAgreementRead] = useState<boolean>(false);

    const {
        isScreenLessMedium,
        isSelectedSeatsUnavailableError,
        isSeatMapFlowDisabledError,
        clearSelectedSeatsUnavailableError,
        clearSeatMapFlowDisabledError,
        clearPackageValidation,
        validatePackage,
        setSelectedOfferPrices,
        redirectToExtrasPage,
        clearSelectedSeatsAndUpdateUrl,
        selectDefaultPaymentOption,
        isPaymentPage,
        isAmendPaymentPage,
        isViewBookingPage,
        isSeatMapOpened,
        isTradePortal,
        goBackToViewBooking,
        setSeatMapOpened,
        setIsSelectedSeatsUnavailableError,
        setValidatedSelectedSeats,
        initialSelectedSeats,
        booking,
        fetchSeatMap,
        clearAmendPaymentStore,
        isConfirmPage,
    } = useStore((stores: TStores) => ({
        isScreenLessMedium: stores.appStore.isScreenLessMedium,
        isSelectedSeatsUnavailableError: stores.seatMapStore.isSelectedSeatsUnavailableError,
        isSeatMapFlowDisabledError: stores.seatMapStore.isSeatMapFlowDisabledError,
        isTradePortal: stores.layoutStore.isTradePortal,
        clearSelectedSeatsUnavailableError: stores.seatMapStore.clearSelectedSeatsUnavailableError,
        clearSeatMapFlowDisabledError: stores.seatMapStore.clearSeatMapFlowDisabledError,
        clearPackageValidation: stores.bookingStore.clearPackageValidation,
        validatePackage: stores.bookingStore.validatePackage,
        setSelectedOfferPrices: stores.bookingStore.setSelectedOfferPrices,
        redirectToExtrasPage: stores.routerStore.redirectToExtrasPage,
        clearSelectedSeatsAndUpdateUrl: stores.seatMapStore.clearSelectedSeatsAndUpdateUrl,
        isAmendPaymentPage: stores.layoutStore.isAmendPaymentPage,
        isViewBookingPage: stores.layoutStore.isViewBookingPage,
        isSeatMapOpened: stores.seatMapStore.isSeatMapOpened,
        goBackToViewBooking: stores.amendPaymentStore.goBackToViewBooking,
        setSeatMapOpened: stores.seatMapStore.setSeatMapOpened,
        setIsSelectedSeatsUnavailableError: stores.seatMapStore.setIsSelectedSeatsUnavailableError,
        setValidatedSelectedSeats: stores.seatMapStore.setValidatedSelectedSeats,
        initialSelectedSeats: stores.viewBookingStore.booking?.seatSelection,
        booking: stores.viewBookingStore.booking,
        fetchSeatMap: stores.seatMapStore.fetchSeatMap,
        selectDefaultPaymentOption: stores.paymentStore.selectDefaultPaymentOption,
        ...(isHolidayStore(stores) && {
            isPaymentPage: stores.layoutStore.isPaymentPage,
        }),

        ...(isTradeStore(stores) && {
            clearAmendPaymentStore: stores.amendPaymentStore.clearAmendPaymentStore,
            isConfirmPage: stores.layoutStore.isConfirmPage,
        }),
    }));

    const getSeatMap = async () => {
        const { routes = [] } = booking?.package?.transport || {};

        if (routes.length) {
            await fetchSeatMap(routes, booking?.prom);
        }
    };

    useEffect(() => {
        if (isViewBookingPage && isSelectedSeatsUnavailableError && !isSeatMapOpened) {
            setSeatMapOpened(true);
            setIsSelectedSeatsUnavailableError(false);
        }
    }, [
        isSelectedSeatsUnavailableError,
        isSeatMapOpened,
        setSeatMapOpened,
        setIsSelectedSeatsUnavailableError,
        isViewBookingPage,
    ]);

    if (!fields || isBackend() || !(isSelectedSeatsUnavailableError || isSeatMapFlowDisabledError)) {
        return null;
    }

    const { Title, Description, ReselectSeatsButtonText, ConfirmationCheckboxLabel, ClearSeatsButtonText } = fields;
    const clearSeats = async () => {
        await clearSelectedSeatsAndUpdateUrl();
        clearPackageValidation();
        clearSelectedSeatsUnavailableError();
        clearSeatMapFlowDisabledError();
    };

    const onClearSeatsButtonClick = async () => {
        if (isAmendPaymentPage) {
            goBackToViewBooking(undefined, true);
            setIsSelectedSeatsUnavailableError(false);
            isTradePortal && clearAmendPaymentStore?.();

            return;
        }

        if (isViewBookingPage) {
            // close widget
            await getSeatMap();
            setValidatedSelectedSeats(initialSelectedSeats || []);
            setIsSelectedSeatsUnavailableError(false);
            setSeatMapOpened(false);

            return;
        }

        await clearSeats();
        await validatePackage();
        setSelectedOfferPrices();

        if (isPaymentPage || isConfirmPage) {
            selectDefaultPaymentOption();
        }
    };

    const onReselectSeatsButtonClick = async () => {
        if (isAmendPaymentPage) {
            goBackToViewBooking(undefined, true, true);
            setIsSelectedSeatsUnavailableError(false);
            isTradePortal && clearAmendPaymentStore?.();

            return;
        }

        if (isViewBookingPage) {
            /**Clear selected seats and close seat map. It will be reopened in useEffect above.
             * we need to reopen it as there is no other way to return back to initial state
             */
            await getSeatMap();
            setValidatedSelectedSeats(initialSelectedSeats || []);
            setSeatMapOpened(false);

            return;
        }

        await clearSeats();
        redirectToExtrasPage();
    };

    const toggleIsAgreementRead = () => {
        setIsAgreementRead(!isAgreementRead);
    };

    return (
        <Popup aria-label={Title?.value} containerClass='seats-availability-popup' isInnerPopup={isSeatMapOpened}>
            {!!Title?.value && <Text tag={'h2'} field={Title} className='seats-availability-popup__title' />}
            {!!Description?.value && (
                <RichTextWithLinks field={Description} className='seats-availability-popup__description' />
            )}
            {!!ConfirmationCheckboxLabel?.value && isTradePortal && (
                <ConfirmationCheckbox
                    onChange={toggleIsAgreementRead}
                    checked={isAgreementRead}
                    label={ConfirmationCheckboxLabel?.value}
                    data-tid='confirmation-checkbox'
                />
            )}
            <div className='seats-availability-popup__actions'>
                {!!ReselectSeatsButtonText?.value && (
                    <Button
                        onClick={onReselectSeatsButtonClick}
                        isMedium
                        isFullWidth={isScreenLessMedium}
                        className='seats-availability-popup__btn'
                        data-tid='reselect-seats-button'
                        disabled={isTradePortal && !isAgreementRead}
                    >
                        {ReselectSeatsButtonText.value}
                    </Button>
                )}
                {!!ClearSeatsButtonText?.value && (
                    <Button
                        onClick={onClearSeatsButtonClick}
                        isMedium
                        isTransparent={!!ReselectSeatsButtonText?.value}
                        isFullWidth={isScreenLessMedium}
                        className='seats-availability-popup__btn'
                        data-tid='clear-seats-button'
                    >
                        {ClearSeatsButtonText.value}
                    </Button>
                )}
            </div>
        </Popup>
    );
};

export default observer(SeatsNotAvailablePopup);
