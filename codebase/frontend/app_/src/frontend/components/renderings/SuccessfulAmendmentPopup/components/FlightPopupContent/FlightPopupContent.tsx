import { observer } from 'mobx-react';

import { DATE_FORMATS } from 'code/dates';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getRouteByDirection } from 'frontend/utils/airports.utils';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { IRoute } from 'models/data/IRoute';
import styles from 'frontend/components/renderings/SuccessfulAmendmentPopup/SuccessfulAmendmentPopup.module.scss';

const FlightPopupContent = () => {
    const { booking } = useStore((stores: IHolidaysStores) => ({
        booking: stores.viewBookingStore.booking,
    }));

    const routes = booking?.package?.transport?.routes;

    if (!routes) {
        return null;
    }

    const { outbound, inbound } = getRouteByDirection(routes);

    const renderFlight = (transport: IRoute) => (
        <div className={styles.confirmedFlight} data-tid={`flight-${transport.direction}`}>
            <div className={styles.flightDate} data-tid='flight-date'>
                {formatDateL10n(transport.depDate, 'ddd Do MMM')}
            </div>
            <div className={styles.flightDirection}>
                <span data-tid='airports-name-code'>
                    {`${transport.depName} (${transport.depPt})`}&nbsp;-
                    {` ${transport.arrName} (${transport.arrPt})`}
                </span>
            </div>
            <div>
                <span className={styles.flightTime} data-tid='arr-time'>
                    {formatDateL10n(transport.depDate, DATE_FORMATS.time)}
                </span>
            </div>
        </div>
    );

    return (
        <div className={styles.flightDetails}>
            {outbound && renderFlight(outbound)}
            <div className={styles.confirmedFlightIcon} />
            {inbound && renderFlight(inbound)}
        </div>
    );
};

export default observer(FlightPopupContent);
