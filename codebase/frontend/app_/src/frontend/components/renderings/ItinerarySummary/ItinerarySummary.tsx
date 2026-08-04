import React, { FunctionComponent, useCallback, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { HOURS_PER_DAY } from 'code/commonNumbers';
import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { getRouteByDirection } from 'frontend/utils/airports.utils';
import { getTotalHoursDifference } from 'frontend/utils/date.utils';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import Button from 'frontend/components/common/Button';
import { IComponentWithRerenderProps } from 'frontend/components/hoc/withRerender';

import ItineraryAirport from './components/ItineraryAirport/ItineraryAirport';
import ItineraryFlight from './components/ItineraryFlight/ItineraryFlight';
import ItineraryHotel from './components/ItineraryHotel/ItineraryHotel';
import ItineraryTransfer from './components/ItineraryTransfer/ItineraryTransfer';
import { IItinerarySummarySummaryFields } from './interfaces';

import styles from './ItinerarySummary.module.scss';

export type TItinerarySummaryProps = IComponentWithRerenderProps & ISitecoreComponent<IItinerarySummarySummaryFields>;

enum ItineraryItemType {
    Airport = 'airport',
    OutboundFlight = 'outboundFlight',
    InboundFlight = 'inboundFlight',
    OutboundTransfer = 'outboundTransfer',
    InboundTransfer = 'inboundTransfer',
    Hotel = 'hotel',
}
const ItinerarySummary: FunctionComponent<TItinerarySummaryProps> = ({ fields }) => {
    const { booking, isLuxuryPackage, bookingTransfers } = useStore(stores => ({
        booking: stores.viewBookingStore.booking,
        isLuxuryPackage: stores.viewBookingStore.isLuxuryPackage,
        ...(isHolidayStore(stores) && {
            bookingTransfers: stores.viewBookingStore.bookingTransfers,
        }),
    }));

    const [expandedItems, setExpandedItems] = useState<ItineraryItemType[]>([]);
    const isAllExpanded = expandedItems.length === Object.keys(ItineraryItemType).length;

    const toggleExpandedView = useCallback((item: ItineraryItemType): void => {
        setExpandedItems(prev => {
            if (prev.includes(item)) {
                return prev.filter(i => i !== item);
            }

            return [...prev, item];
        });
    }, []);

    const toggleExpandAll = useCallback((): void => {
        setExpandedItems(prev => {
            if (prev.length !== Object.keys(ItineraryItemType).length) {
                return Object.values(ItineraryItemType);
            }

            return [];
        });
    }, []);

    if (!booking || !fields) {
        return null;
    }

    const routes = booking.package?.transport?.routes || [];
    const { outbound, inbound } = getRouteByDirection(routes);
    const isOutboundItinerariesGrayedOut =
        getTotalHoursDifference(new Date(), new Date(outbound?.arrDate || '')) >=
        (fields.HoursToGrayOut.value || HOURS_PER_DAY);

    const { ItineraryTitle, ExpandAllButton, CloseAllButton } = fields;
    const isLess24HoursBeforeDeparture =
        getTotalHoursDifference(new Date(inbound?.depDate || ''), new Date()) <= HOURS_PER_DAY;

    const getProps = (
        item: ItineraryItemType,
    ): IItinerarySummarySummaryFields & { className: string; isExpanded: boolean; setExpanded: () => void } => ({
        ...fields,
        className: styles.itineraryItem,
        isExpanded: expandedItems.includes(item),
        setExpanded: () => toggleExpandedView(item),
    });

    return (
        <div className={styles.container} data-tid='itinerary-container'>
            <div className={styles.header}>
                <Text
                    field={ItineraryTitle}
                    className={styles.headerTitle}
                    tag='h2'
                    data-tid='itinerary-summary-title'
                />
                <Button isText onClick={toggleExpandAll} className={styles.expandButton} data-tid='expand-all-button'>
                    {isAllExpanded ? CloseAllButton.value : ExpandAllButton.value}
                </Button>
            </div>

            <div className={styles.content}>
                {isLuxuryPackage && (
                    <ItineraryAirport
                        {...getProps(ItineraryItemType.Airport)}
                        isGreyedOut={isOutboundItinerariesGrayedOut}
                        booking={booking}
                    />
                )}
                <ItineraryFlight
                    {...getProps(ItineraryItemType.OutboundFlight)}
                    route={outbound}
                    isArrival={true}
                    isLuxuryPackage={isLuxuryPackage}
                    isGreyedOut={isOutboundItinerariesGrayedOut}
                />
                <ItineraryTransfer
                    {...getProps(ItineraryItemType.OutboundTransfer)}
                    isArrival={true}
                    isGreyedOut={isOutboundItinerariesGrayedOut}
                    booking={booking}
                    transfer={bookingTransfers?.outboundTransferDetails}
                />
                <ItineraryHotel {...getProps(ItineraryItemType.Hotel)} booking={booking} />
                <ItineraryTransfer
                    {...getProps(ItineraryItemType.InboundTransfer)}
                    booking={booking}
                    transfer={bookingTransfers?.inboundTransferDetails}
                    isLess24HoursBeforeDeparture={isLess24HoursBeforeDeparture}
                />
                <ItineraryFlight
                    {...getProps(ItineraryItemType.InboundFlight)}
                    isLuxuryPackage={isLuxuryPackage}
                    route={inbound}
                />
            </div>
        </div>
    );
};

export default observer(ItinerarySummary);
