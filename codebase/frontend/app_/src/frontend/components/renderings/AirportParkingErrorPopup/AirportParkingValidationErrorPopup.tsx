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

import styles from './AirportParkingValidationErrorPopup.module.scss';

export interface IParkingValidationErrorPopupFields {
    ParkingValidationErrorPopupBtnText: ISitecoreField<string>;
    ParkingValidationErrorPopupDescription: ISitecoreField<string>;
    ParkingValidationErrorPopupTitle: ISitecoreField<string>;
}

export type TParkingValidationErrorPopup = ISitecoreComponent<IParkingValidationErrorPopupFields>;

export const AirportParkingValidationErrorPopup = ({
    fields,
}: TParkingValidationErrorPopup): React.JSX.Element | null => {
    const isMobile = useMobileViewport();

    const { isAirportParkingValidationError, setIsAirportParkingValidationError } = useStore(
        (stores: IHolidaysStores) => ({
            isAirportParkingValidationError: stores.bookingStore.isAirportParkingValidationError,
            setIsAirportParkingValidationError: stores.bookingStore.setIsAirportParkingValidationError,
        }),
    );

    if (!fields || isBackend() || !isAirportParkingValidationError) {
        return null;
    }

    const {
        ParkingValidationErrorPopupTitle,
        ParkingValidationErrorPopupDescription,
        ParkingValidationErrorPopupBtnText,
    } = fields;

    const onAcceptClick = (): void => {
        setIsAirportParkingValidationError(!isAirportParkingValidationError);
    };

    return (
        <Popup
            aria-label={ParkingValidationErrorPopupTitle?.value}
            containerClass={styles.parkingAvailabilityPopup}
            isInnerPopup={isMobile}
            data-tid='airport-parking-validation-error-popup'
        >
            {!!ParkingValidationErrorPopupTitle?.value && (
                <Text
                    tag='h2'
                    field={ParkingValidationErrorPopupTitle}
                    className={styles.title}
                    data-tid='airport-parking-validation-error-title'
                />
            )}
            <RichTextWithLinks
                field={ParkingValidationErrorPopupDescription}
                className={styles.description}
                dataId='airport-parking-validation-error-description'
            />

            {!!ParkingValidationErrorPopupBtnText?.value && (
                <Button
                    onClick={onAcceptClick}
                    isMedium
                    isFullWidth={isMobile}
                    className={styles.button}
                    data-tid='airport-parking-validation-error-button'
                >
                    {ParkingValidationErrorPopupBtnText.value}
                </Button>
            )}
        </Popup>
    );
};

export default observer(AirportParkingValidationErrorPopup);
