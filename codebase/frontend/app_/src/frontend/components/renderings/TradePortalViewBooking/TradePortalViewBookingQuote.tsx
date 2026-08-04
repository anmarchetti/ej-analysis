import { FC } from 'react';

import useStore from 'frontend/hooks/useStore';
import { useNightsLabel } from 'frontend/hooks/viewBooking.hooks';
import { ITradePortalStores } from 'frontend/store/tradePortal';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { IPreBookingInfo } from 'models/data/IBookingInfo';
import SiteSettings from 'models/enum/SiteSettings';
import StarRating from 'frontend/components/common/StarRating';
import SvgCalendarLined from 'frontend/components/icons-new/CalendarLined';
import { getHotelMeta } from 'frontend/components/renderings/ViewBooking/components/Hotel/ViewBookingHotel.utils';
import ViewBookingHotelGallery from 'frontend/components/renderings/ViewBooking/components/Hotel/ViewBookingHotelGallery';

import { HotelLocationLabels } from './components/HotelLocationLabels';

import styles from './TradePortalViewBookingQuote.module.scss';

export interface ITradePortalViewBookingQuoteProps {
    booking: IPreBookingInfo;
}

export const TradePortalViewBookingQuote: FC<ITradePortalViewBookingQuoteProps> = ({ booking }) => {
    const { getPhrase, getSetting } = useStore((stores: ITradePortalStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        getSetting: stores.layoutStore.getSetting,
    }));

    const { hotelName, hotelLocationLinks, hotelImages, starRating, accom } = getHotelMeta(booking);

    const startDate = formatDateL10n(accom.startDate, 'ddd DD MMM');
    const nightsLabel = useNightsLabel(accom.startDate, accom.endDate, getPhrase);

    const fallbackImage = getSetting(SiteSettings.HotelFallbackImage);

    return (
        <div className={styles.bookingPreviewContainer}>
            <div className={styles.bookingPreviewTitle}>
                <h3 className={styles.bookingTitle}>{hotelName}</h3>
                <div className={styles.bookingTitleLocation}>
                    <HotelLocationLabels locationLinks={hotelLocationLinks} />
                </div>

                <div className={styles.starRating}>
                    <StarRating rating={starRating} />
                </div>
                {!!startDate && (
                    <div className={styles.bookingDateItem}>
                        <SvgCalendarLined />
                        <span data-tid='dates-label' data-cs-mask>{`${startDate} - ${nightsLabel}`}</span>
                    </div>
                )}
            </div>
            <div>
                {!!hotelImages?.length && (
                    <ViewBookingHotelGallery images={hotelImages} fallbackImage={fallbackImage} isPrintPreview />
                )}
            </div>
        </div>
    );
};

export default TradePortalViewBookingQuote;
