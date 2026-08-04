import { FC } from 'react';
import classNames from 'classnames';

import { DATE_FORMATS } from 'code/dates';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { IRoute } from 'models/data/IRoute';
import { RouteDirection } from 'models/enum/RouteDirection';
import SvgDepartureFilled from 'frontend/components/icons-new/DepartureFilled';

import styles from './HolidayCardFlight.module.scss';

interface IHolidayCardFlightProps {
    route: IRoute | undefined;
}

const HolidayCardFlight: FC<IHolidayCardFlightProps> = ({ route }) => {
    if (!route) {
        return null;
    }

    const isOutbound = route.direction === RouteDirection.Outbound;

    return (
        <div className={styles.flightItem} data-tid={isOutbound ? 'outbound-flight' : 'inbound-flight'}>
            <span className={styles.itemIcon}>
                <SvgDepartureFilled className={classNames({ 'icon--reflect-x': !isOutbound })} />
            </span>
            <div className={styles.flightInfo}>
                <p className={styles.itemTitle} data-tid={isOutbound ? 'departure-airport' : 'arrival-airport'}>
                    {route.depName}
                </p>
                <p data-tid={isOutbound ? 'departure-date' : 'arrival-date'}>
                    {formatDateL10n(route.depDate, DATE_FORMATS.dateMonthTime)}
                </p>
            </div>
        </div>
    );
};

export default HolidayCardFlight;
