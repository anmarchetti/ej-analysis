import { FunctionComponent } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getRouteByDirection } from 'frontend/utils/airports.utils';
import { isLoadingStatus } from 'models/enum/DataStatus';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import AmendSummaryAccordion from 'frontend/components/common/AmendSummary/AmendSummaryAccordion/AmendSummaryAccordion';
import EditButton from 'frontend/components/common/AmendSummary/EditButton/EditButton';

import AmendDatesSummaryFlightItem from './components/AmendDatesSummaryFlightItem/AmendDatesSummaryFlightItem';

import styles from './AmendDatesSummaryFlight.module.scss';

interface IAmendDatesSummaryFlightProps {
    icon: ISitecoreField<ISitecoreImage>;
    title: ISitecoreField<string>;
}

const AmendDatesSummaryFlight: FunctionComponent<IAmendDatesSummaryFlightProps> = ({ icon, title }) => {
    const {
        booking,
        offer,
        isFlightsExists,
        onChangeDatesAmendFlightClick,
        noAvailableFlightOffers,
        amendFlightDataStatus,
        getPhrase,
    } = useStore(({ amendDatesStore, amendFlightsStore, layoutStore }: IHolidaysStores) => ({
        booking: amendDatesStore.booking,
        offer: amendDatesStore.offer,
        isFlightsExists: !!amendDatesStore.offer?.transport?.routes,
        onChangeDatesAmendFlightClick: amendDatesStore.onChangeDatesAmendFlightClick,
        noAvailableFlightOffers: amendDatesStore.flights.noAvailableFlightOffers,
        amendFlightDataStatus: amendFlightsStore.status,
        getPhrase: layoutStore.getPhrase,
    }));

    if (!offer || !isFlightsExists || !booking) {
        return null;
    }

    const isLoading = isLoadingStatus(amendFlightDataStatus);

    const { outbound, inbound } = getRouteByDirection(offer.transport.routes);

    const { outbound: previousOutbound, inbound: previousInbound } = getRouteByDirection(
        booking.package.transport.routes,
    );

    return (
        <AmendSummaryAccordion
            dataTid='amend-dates-flight'
            icon={icon}
            title={title.value}
            className={styles.amendFlights}
        >
            <div className={styles.flights}>
                {!!outbound && !!previousOutbound && (
                    <AmendDatesSummaryFlightItem route={outbound} previousRoute={previousOutbound} />
                )}
                {!!inbound && previousInbound && (
                    <AmendDatesSummaryFlightItem route={inbound} previousRoute={previousInbound} />
                )}
            </div>
            {!noAvailableFlightOffers && (
                <EditButton
                    dataTid='amend-dates-flight-edit-button'
                    isLoading={isLoading}
                    onClick={onChangeDatesAmendFlightClick}
                    isCapitalize
                >
                    {getPhrase(SitecoreDictionary.GlobalsLabelsChangeSingular)}
                </EditButton>
            )}
        </AmendSummaryAccordion>
    );
};

export default observer(AmendDatesSummaryFlight);
