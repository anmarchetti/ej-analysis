import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getRouteByDirection } from 'frontend/utils/airports.utils';
import FlightErrata from 'frontend/components/common/ErrataInfo/FlightErrata';

import Flight from './components/Flight/Flight';

import styles from './AmendFlightsDetails.module.scss';

const AmendFlightsDetails = () => {
    const { selectedFlight } = useStore((stores: IHolidaysStores) => ({
        selectedFlight: stores.amendFlightsStore.selectedFlight,
    }));

    if (!selectedFlight) {
        return null;
    }

    const isFlightErrata = !!selectedFlight.errataFlightInfo?.length;
    const { outbound, inbound } = getRouteByDirection(selectedFlight.routes);

    return (
        <div
            className={classNames(styles.details, 'amend-flights-card', {
                [styles.flightsWithErrata]: isFlightErrata,
            })}
            data-tid='amend-flights-card'
        >
            <div className={styles.flights} data-tid='flights-details'>
                {outbound && <Flight route={outbound} />}

                <div className={styles.separator} />

                {inbound && <Flight route={inbound} />}
            </div>

            {isFlightErrata && (
                <div className='flight-card__flight-errata-info-container'>
                    <FlightErrata errataFlightInfo={selectedFlight.errataFlightInfo} />
                </div>
            )}
        </div>
    );
};

export default observer(AmendFlightsDetails);
