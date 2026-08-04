import { FC } from 'react';
import { ComponentRendering } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { BookingsTabs } from 'frontend/store/holidays/viewBooking/ViewBookingsStore';
import { containsFAndHPromoCode } from 'frontend/utils/offer.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { OfferPromotionCodes } from 'models/enum/OfferPromotionCodes';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import BookingCard from 'frontend/components/common/Booking/BookingCard/BookingCard';
import TabBar, { ITabs } from 'frontend/components/common/TabBar';
import BookingsSort from 'frontend/components/renderings/ViewBookings/components/BookingsSort/BookingsSort';

import styles from './BookingList.module.scss';

export interface IBookingListProps {
    rendering: ComponentRendering;
    FlightHotelPillIcon?: ISitecoreField<ISitecoreImage>;
    FlightHotelPillText?: ISitecoreField<string>;
    RegularPillIcon?: ISitecoreField<ISitecoreImage>;
}

const BookingsList: FC<IBookingListProps> = ({
    rendering,
    FlightHotelPillIcon,
    FlightHotelPillText,
    RegularPillIcon,
}) => {
    const {
        bookings,
        upcomingCount,
        previousCount,
        canceledCount,
        activeTab,
        onTabChange,
        sortBy,
        setSortBy,
        sortOptions,
        isSortByDisabled,
        getPhrase,
    } = useStore((stores: IHolidaysStores) => ({
        bookings: stores.viewBookingsStore.bookings,
        upcomingCount: stores.viewBookingsStore.upcomingCount,
        previousCount: stores.viewBookingsStore.previousCount,
        canceledCount: stores.viewBookingsStore.canceledCount,
        activeTab: stores.viewBookingsStore.activeTab,
        onTabChange: stores.viewBookingsStore.onTabChange,
        sortBy: stores.viewBookingsStore.sortBy,
        setSortBy: stores.viewBookingsStore.setSortBy,
        sortOptions: stores.viewBookingsStore.availableSortOptions,
        isSortByDisabled: stores.viewBookingsStore.isSortByDisabled,
        getPhrase: stores.layoutStore.getPhrase,
    }));

    if (!activeTab) {
        return null;
    }

    const tabs = [] as ITabs[];

    if (upcomingCount) {
        tabs.push({
            label: Tokenizer.replaceToken(
                getPhrase(SitecoreDictionary.ViewBookingsLabelsUpcomingHolidays),
                Tokens.Number,
                upcomingCount + '',
            ) as string,
            accessor: BookingsTabs.Upcoming,
        });
    }

    if (previousCount) {
        tabs.push({
            label: Tokenizer.replaceToken(
                getPhrase(SitecoreDictionary.ViewBookingsLabelsPreviousHolidays),
                Tokens.Number,
                previousCount + '',
            ) as string,
            accessor: BookingsTabs.Previous,
        });
    }

    if (canceledCount) {
        tabs.push({
            label: Tokenizer.replaceToken(
                getPhrase(SitecoreDictionary.ViewBookingsLabelsCancelledHolidays),
                Tokens.Number,
                canceledCount + '',
            ) as string,
            accessor: BookingsTabs.Canceled,
        });
    }

    const flightAndHotelBookingsCount = bookings
        ? bookings.filter(booking => containsFAndHPromoCode(booking?.promoCollections || [])).length
        : 0;

    const getPillProps = (
        promocodes: OfferPromotionCodes[] = [],
    ): { PillIcon?: ISitecoreField<ISitecoreImage>; PillText?: ISitecoreField<string> } => {
        const isFlightAndHotel = containsFAndHPromoCode(promocodes);

        if (!flightAndHotelBookingsCount) {
            return {};
        }

        if (isFlightAndHotel) {
            return {
                PillIcon: FlightHotelPillIcon,
                PillText: FlightHotelPillText,
            };
        }

        return {
            PillIcon: RegularPillIcon,
        };
    };

    return (
        <div data-tid='bookings-list' className={styles.bookingList}>
            <div className={styles.bookingListHeader}>
                <div className={styles.anchorsWrapper}>
                    <TabBar onClick={onTabChange} tabs={tabs} activeTab={activeTab} tabClass={styles.tab} />
                </div>
                <BookingsSort
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    sortOptions={sortOptions}
                    isSortByDisabled={isSortByDisabled}
                />
            </div>
            {bookings?.map(b => (
                <BookingCard
                    key={b.bookingReference}
                    booking={b}
                    isUpcoming={activeTab === BookingsTabs.Upcoming}
                    isPrevious={activeTab === BookingsTabs.Previous}
                    rendering={rendering}
                    {...getPillProps(b.promoCollections)}
                />
            ))}
        </div>
    );
};

export default observer(BookingsList);
