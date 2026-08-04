import React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import isBackend from 'frontend/utils/isBackend';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import { Popup } from 'frontend/components/common/Popup';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

import styles from './AirportParkingNotAvailablePopup.module.scss';

export interface IAirportParkingNotAvailablePopupFields {
    ParkingNotAvailablePopupClearBtnText: ISitecoreField<string>;
    ParkingNotAvailablePopupDescription: ISitecoreField<string>;
    ParkingNotAvailablePopupTitle: ISitecoreField<string>;
}

export type TAirportParkingNotAvailablePopup = ISitecoreComponent<IAirportParkingNotAvailablePopupFields>;

export const AirportParkingNotAvailablePopup = ({
    fields,
}: TAirportParkingNotAvailablePopup): React.JSX.Element | null => {
    const isMobile = useMobileViewport();

    const {
        isSelectedParkingUnavailableError,
        setIsSelectedParkingUnavailableError,
        fetchOfferAndReloadPage,
        clearSelectedAirportParkingAndUpdateUrl,
        selectDefaultPaymentOption,
    } = useStore((stores: IHolidaysStores) => ({
        isSelectedParkingUnavailableError: stores.airportParkingStore.isSelectedParkingUnavailableError,
        setIsSelectedParkingUnavailableError: stores.airportParkingStore.setIsSelectedParkingUnavailableError,
        validateParking: stores.airportParkingStore.validateParking,
        fetchOfferAndReloadPage: stores.bookingStore.fetchOfferAndReloadPage,
        clearSelectedAirportParkingAndUpdateUrl: stores.airportParkingStore.clearSelectedAirportParkingAndUpdateUrl,
        selectDefaultPaymentOption: stores.paymentStore.selectDefaultPaymentOption,
    }));

    if (!fields || isBackend() || !isSelectedParkingUnavailableError) {
        return null;
    }

    const { ParkingNotAvailablePopupTitle, ParkingNotAvailablePopupDescription, ParkingNotAvailablePopupClearBtnText } =
        fields;

    const onRemoveSelectedParkingCLick = async (): Promise<void> => {
        await clearSelectedAirportParkingAndUpdateUrl();

        setIsSelectedParkingUnavailableError(!isSelectedParkingUnavailableError);
        await fetchOfferAndReloadPage(true);

        // update total price of package after removing parking
        selectDefaultPaymentOption();
    };

    return (
        <Popup
            aria-label={ParkingNotAvailablePopupTitle?.value}
            containerClass={styles.parkingAvailabilityPopup}
            isInnerPopup={isMobile}
            data-tid='parking-not-available-popup'
        >
            {!!ParkingNotAvailablePopupTitle?.value && (
                <Text
                    tag='h2'
                    field={ParkingNotAvailablePopupTitle}
                    className={styles.title}
                    data-tid='parking-not-available-title'
                />
            )}
            <RichTextWithLinks
                field={ParkingNotAvailablePopupDescription}
                className={styles.description}
                dataId='parking-not-available-description'
            />

            {!!ParkingNotAvailablePopupClearBtnText?.value && (
                <Button
                    onClick={onRemoveSelectedParkingCLick}
                    isMedium
                    isFullWidth={isMobile}
                    className={styles.button}
                >
                    {ParkingNotAvailablePopupClearBtnText.value}
                </Button>
            )}
        </Popup>
    );
};

export default observer(AirportParkingNotAvailablePopup);
