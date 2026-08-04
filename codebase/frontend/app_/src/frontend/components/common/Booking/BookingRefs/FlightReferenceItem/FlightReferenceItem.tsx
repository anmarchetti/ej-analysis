import { FC } from 'react';

import useStore from 'frontend/hooks/useStore';
import { copyToClipboard } from 'frontend/utils/clipboard.utils';
import { getFlightsReferences } from 'frontend/utils/route.utils';
import { IRoute } from 'models/data/IRoute';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import MultipleFlightReferenceItem from 'frontend/components/common/Booking/BookingRefs/MultipleFlightReferenceItem/MultipleFlightReferenceItem';
import ReferenceItem from 'frontend/components/common/Booking/BookingRefs/ReferenceItem/ReferenceItem';

import styles from './FlightReferenceItem.module.scss';

export interface IReferenceItemProps {
    flights: IRoute[];
    hasTooltips?: boolean;
    scrollToSeeFullReferences?: ISitecoreField<string>;
}

const FlightReferenceItem: FC<IReferenceItemProps> = ({ flights, hasTooltips, scrollToSeeFullReferences }) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const flightsRefs = getFlightsReferences(flights);

    // Render reference for multiple flights
    if (flightsRefs.length > 1) {
        return <MultipleFlightReferenceItem flights={flights} scrollToSeeFullReferences={scrollToSeeFullReferences} />;
    }

    // Render reference for single flight
    if (flightsRefs.length === 1 && flightsRefs[0]) {
        return (
            <ReferenceItem
                dataTid='flight-ref'
                title={getPhrase(SitecoreDictionary.BookingHeaderLabelsFlightReference)}
                referenceNumber={flightsRefs[0]}
                tooltip={hasTooltips ? getPhrase(SitecoreDictionary.BookingHeaderLabelsFlightRefTitle) : ''}
                onClick={(): void => {
                    !!flightsRefs[0] && copyToClipboard(flightsRefs[0]);
                }}
            />
        );
    }

    return (
        <div className={styles.noFlightInfo} data-tid='no-flight-info-section'>
            <span className={styles.noFlightInfoHeader} data-tid='no-flight-header'>
                {getPhrase(SitecoreDictionary.ViewBookingNoFlightInfoTitle)}
            </span>
            <span className={styles.noFlightInfoDescription} data-tid='no-flight-description'>
                {getPhrase(SitecoreDictionary.ViewBookingNoFlightInfoDescription)}
            </span>
        </div>
    );
};

export default FlightReferenceItem;
