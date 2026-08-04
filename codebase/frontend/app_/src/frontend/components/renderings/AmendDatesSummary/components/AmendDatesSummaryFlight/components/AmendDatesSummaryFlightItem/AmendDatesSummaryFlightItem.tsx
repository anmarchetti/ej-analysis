import { FunctionComponent } from 'react';
import classNames from 'classnames';

import { IRoute } from 'models/data/IRoute';

import { getFormattedDate } from './AmendDatesSummaryFlightItem.utils';

import styles from './AmendDatesSummaryFlightItem.module.scss';

interface IAmendDatesSummaryFlightItemProps {
    previousRoute: IRoute;
    route: IRoute;
}

const AmendDatesSummaryFlightItem: FunctionComponent<IAmendDatesSummaryFlightItemProps> = ({
    route,
    previousRoute,
}) => {
    const { date, departureTime, arrivalTime } = getFormattedDate(route);
    const {
        date: previousDate,
        departureTime: previousDepartureTime,
        arrivalTime: previousArrivalTime,
    } = getFormattedDate(previousRoute);

    return (
        <div className={styles.item}>
            <h4 className={styles.date} data-tid='flight-date'>
                {date}
            </h4>
            <span className={styles.time} data-tid='flight-time'>
                {departureTime} - {arrivalTime}
            </span>
            <span className={styles.airport} data-tid='flight-airport'>
                {route.depName} ({route.depPt}) - ({route.arrPt})
            </span>
            <span className={classNames(styles.previousDetail, styles.previousDate)} data-tid='previous-flight-date'>
                {previousDate}
            </span>
            <span className={styles.previousDetail} data-tid='previous-flight-time'>
                {previousDepartureTime} - {previousArrivalTime}
            </span>
        </div>
    );
};

export default AmendDatesSummaryFlightItem;
