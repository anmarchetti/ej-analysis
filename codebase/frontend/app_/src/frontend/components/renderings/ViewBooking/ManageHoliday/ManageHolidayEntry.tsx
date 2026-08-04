import { FunctionComponent, useEffect } from 'react';
import { observer } from 'mobx-react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import Button from 'frontend/components/common/Button';

import ManageHolidayPopup from './components/ManageHolidayPopup/ManageHolidayPopup';

import styles from './ManageHolidayEntry.module.scss';

export interface IManageHolidayEntryProps {
    onAmendDatesClick: (e: React.MouseEvent) => void;
    onAmendHotelClick: (e: React.MouseEvent) => void;
    amendDatesLabel?: string;
    amendHotelLabel?: string;
    manageBookingLabel?: string;
}

const ManageHolidayEntry: FunctionComponent<IManageHolidayEntryProps> = ({
    onAmendDatesClick,
    onAmendHotelClick,
    amendHotelLabel,
    amendDatesLabel,
    manageBookingLabel,
}) => {
    const {
        isNoAmendDatesAvailability,
        isAmendDatesError,
        areRoomAndBoardVariantsUnavailable,
        isNoAvailableFlightsPopupShown,
        isNoAvailabilityError,
        booking,
        isManageHolidayPopupOpened,
        setIsManageHolidayPopupOpened,
        dropHotelRequest,
        trackClickOnManageButton,
        trackClickOnChangeHotelButton,
        isMicroAppManageMyHolidayAllowed,
    } = useStore((stores: IHolidaysStores) => ({
        onAmendHotelButtonClick: stores.amendHotelStore.onAmendHotelButtonClick,
        booking: stores.viewBookingStore.booking,
        isManageHolidayPopupOpened: stores.viewBookingStore.isManageHolidayPopupOpened,
        setIsManageHolidayPopupOpened: stores.viewBookingStore.setIsManageHolidayPopupOpened,
        isNoAmendDatesAvailability: stores.amendDatesStore.isNoAvailableDates,
        areRoomAndBoardVariantsUnavailable: stores.amendRoomAndBoardStore.areRoomAndBoardVariantsUnavailable,
        isAmendDatesError: stores.amendDatesStore.isError,
        isNoAvailableFlightsPopupShown: stores.amendFlightsStore.isNoAvailableFlightsPopupShown,
        isNoAvailabilityError: stores.amendHotelStore.isNoAvailabilityError,
        isMicroAppManageMyHolidayAllowed: stores.viewBookingStore.isMicroAppManageMyHolidayAllowed,
        dropHotelRequest: stores.amendHotelStore.dropRequest,
        trackClickOnManageButton: stores.trackingStore.changeHotel.clickOnManageButton,
        trackClickOnChangeHotelButton: stores.trackingStore.changeHotel.clickOnChangeHotelButton,
    }));

    const onClosePopup = () => {
        setIsManageHolidayPopupOpened(false);
        dropHotelRequest();
    };

    const isMobile = useMobileViewport();

    useEffect(() => {
        onClosePopup();
    }, [
        isNoAmendDatesAvailability,
        isAmendDatesError,
        areRoomAndBoardVariantsUnavailable,
        isNoAvailableFlightsPopupShown,
        isNoAvailabilityError,
    ]);

    if (!booking) return null;

    const onOpenPopup = (): void => {
        setIsManageHolidayPopupOpened(true);
        trackClickOnManageButton();
    };

    const handleAmendHotelClick = (e: React.MouseEvent): void => {
        onAmendHotelClick(e);
        trackClickOnChangeHotelButton(booking);
    };

    return (
        <div className={styles.container} data-tid='manage-holiday-entry'>
            {isManageHolidayPopupOpened && (
                <ManageHolidayPopup
                    onClose={onClosePopup}
                    onAmendHotelClick={handleAmendHotelClick}
                    onAmendDatesClick={onAmendDatesClick}
                    booking={booking}
                    amendDatesLabel={amendDatesLabel}
                    amendHotelLabel={amendHotelLabel}
                />
            )}
            <Button
                onClick={onOpenPopup}
                dataTid='manage-holidays-entry-cta'
                isFullWidth={isMobile}
                className={styles.cta}
                isOutlined={isMicroAppManageMyHolidayAllowed}
                isSmall={isMicroAppManageMyHolidayAllowed}
                isSecondary={isMicroAppManageMyHolidayAllowed}
                removeDefaultClass
            >
                {manageBookingLabel}
            </Button>
        </div>
    );
};

export default observer(ManageHolidayEntry);
