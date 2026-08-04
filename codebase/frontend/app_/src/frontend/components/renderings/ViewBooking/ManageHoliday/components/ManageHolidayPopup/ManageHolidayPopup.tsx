import { FunctionComponent } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { useDatesLabel, useNightsLabel } from 'frontend/hooks/viewBooking.hooks';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getHotelLocation } from 'frontend/utils/getHotelLocation';
import { IBookingInfo } from 'models/data/IBookingInfo';
import SiteSettings from 'models/enum/SiteSettings';
import HotelRating from 'frontend/components/common/Hotel/HotelRating/HotelRating';
import { OfferCardSlider } from 'frontend/components/common/OfferCardSlider/OfferCardSlider';
import { Popup } from 'frontend/components/common/Popup';
import SvgCalendarLined from 'frontend/components/icons-new/CalendarLined';
import AmendDatesEntry from 'frontend/components/renderings/AmendDates/components/AmendDatesEntry/AmendDatesEntry';
import AmendHotelEntry from 'frontend/components/renderings/AmendHotel/components/AmendHotelEntry/AmendHotelEntry';
import { getHotelMeta } from 'frontend/components/renderings/ViewBooking/components/Hotel/ViewBookingHotel.utils';
import { IManageHolidayEntryProps } from 'frontend/components/renderings/ViewBooking/ManageHoliday/ManageHolidayEntry';

import styles from './ManageHolidayPopup.module.scss';

export interface IManageHolidayPopup {
    booking: IBookingInfo;
    onAmendDatesClick: IManageHolidayEntryProps['onAmendDatesClick'];
    onAmendHotelClick: IManageHolidayEntryProps['onAmendHotelClick'];
    onClose: () => void;
    amendDatesLabel?: string;
    amendHotelLabel?: string;
}

const ManageHolidayPopup: FunctionComponent<IManageHolidayPopup> = ({
    onClose,
    onAmendDatesClick,
    onAmendHotelClick,
    booking,
    amendDatesLabel,
    amendHotelLabel,
}) => {
    const { getSetting, getPhrase, isAmendDatesCTAVisible } = useStore((stores: IHolidaysStores) => ({
        getSetting: stores.layoutStore.getSetting,
        getPhrase: stores.layoutStore.getPhrase,
        isAmendDatesCTAVisible: stores.amendDatesStore.isAmendCTAVisible,
    }));
    const [startDateLabel, endDateLabel] = useDatesLabel(booking, false, getPhrase, {
        holiday: { start: 'ddd DD MMM', end: 'ddd DD MMM YY' },
    });

    const nightsLabel = useNightsLabel(booking.package.accom.startDate, booking.package.accom.endDate, getPhrase);

    const { hotelImages, hotelName } = getHotelMeta(booking);
    const fallbackHotelImage = getSetting(SiteSettings.HotelFallbackImage);
    const hotelLocation = !!booking.hotel && getHotelLocation(booking.hotel);

    return (
        <Popup onClose={onClose} showCloseButton containerClass={styles.popup} id='manage-holiday-popup'>
            <div className={styles.container}>
                <OfferCardSlider
                    images={hotelImages}
                    fallbackImage={fallbackHotelImage}
                    className={styles.gallery}
                    showIndex
                />
                <div className={styles.content}>
                    <div className={styles.hotel}>
                        <p className={styles.title} data-tid='manage-holiday-popup-title'>
                            {hotelName}
                        </p>
                        <p className={styles.location} data-tid='manage-holiday-popup-location'>
                            {hotelLocation}
                        </p>

                        <HotelRating booking={booking} />

                        <AmendHotelEntry label={amendHotelLabel} onClick={onAmendHotelClick} />
                    </div>

                    <div className={styles.amendDates}>
                        <div className={styles.dates}>
                            <SvgCalendarLined />
                            <span
                                data-tid='dates-label'
                                data-cs-mask
                            >{`${startDateLabel} - ${endDateLabel}, ${nightsLabel}`}</span>
                        </div>
                        {isAmendDatesCTAVisible && (
                            <AmendDatesEntry onClick={onAmendDatesClick} label={amendDatesLabel} />
                        )}
                    </div>
                </div>
            </div>
        </Popup>
    );
};

export default observer(ManageHolidayPopup);
