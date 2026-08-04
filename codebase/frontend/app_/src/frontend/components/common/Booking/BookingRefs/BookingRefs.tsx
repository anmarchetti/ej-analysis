import React, { FC } from 'react';

import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays/create-stores';
import { copyToClipboard } from 'frontend/utils/clipboard.utils';
import { IRoute } from 'models/data/IRoute';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

import FlightReferenceItem from './FlightReferenceItem/FlightReferenceItem';
import ReferenceItem from './ReferenceItem/ReferenceItem';

import styles from './BookingRefs.module.scss';

export interface IBookingRefsProps {
    bookingRoutes: IRoute[];
    referenceNumber: string;
    hasTooltips?: boolean;
    scrollToSeeFullReferences?: ISitecoreField<string>;
}

const BookingRefs: FC<IBookingRefsProps> = ({
    bookingRoutes,
    referenceNumber,
    hasTooltips,
    scrollToSeeFullReferences,
}) => {
    const { getPhrase, isFlightAndHotelPackage } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
        isFlightAndHotelPackage:
            isHolidayStore(stores) &&
            (stores.viewBookingStore.isFlightAndHotelPackage || stores.bookingStore.isFlightAndHotelPackage),
    }));

    return (
        <div className={styles.toolbarView} data-tid='booking-refs'>
            <ReferenceItem
                dataTid='booking-ref'
                referenceNumber={referenceNumber}
                title={getPhrase(
                    isFlightAndHotelPackage
                        ? SitecoreDictionary.BookingHeaderLabelsBookingReference
                        : SitecoreDictionary.BookingHeaderLabelsHolidayReference,
                )}
                tooltip={
                    (hasTooltips &&
                        getPhrase(
                            isFlightAndHotelPackage
                                ? SitecoreDictionary.BookingHeaderLabelsBookingRefTitle
                                : SitecoreDictionary.BookingHeaderLabelsHolidayRefTitle,
                        )) ||
                    ''
                }
                onClick={(): Promise<string> => copyToClipboard(referenceNumber)}
            />

            <FlightReferenceItem
                flights={bookingRoutes}
                hasTooltips={hasTooltips}
                scrollToSeeFullReferences={scrollToSeeFullReferences}
            />
        </div>
    );
};

export default BookingRefs;
