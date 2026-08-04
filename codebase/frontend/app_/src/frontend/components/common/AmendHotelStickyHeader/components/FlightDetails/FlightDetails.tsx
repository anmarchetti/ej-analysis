import { FunctionComponent } from 'react';
import classNames from 'classnames';

import { DATE_FORMATS } from 'code/dates';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { IRoute } from 'models/data/IRoute';
import SVGDepartureFilled from 'frontend/components/icons-new/DepartureFilled';

import styles from './FlightDetails.module.scss';

export interface IFlightDetailsProps {
    flightRoutes: IRoute[];
    className?: string;
    dataTid?: string;
}

const FlightDetails: FunctionComponent<IFlightDetailsProps> = ({
    flightRoutes,
    className,
    dataTid = 'flight-details',
}) => {
    const [outbound, inbound] = flightRoutes;

    const outboundDepartureDate = formatDateL10n(outbound?.depDate, DATE_FORMATS.dateMonthTime);
    const inboundDepartureDate = formatDateL10n(inbound?.depDate, DATE_FORMATS.dateMonthTime);

    return (
        <div data-tid={dataTid}>
            <div className={classNames(className, styles.row)}>
                <SVGDepartureFilled />
                <span className={styles.airport} data-tid='departure-airport'>
                    {outbound.depName}
                </span>
                <span className={styles.date} data-tid='departure-date'>
                    {outboundDepartureDate}
                </span>
            </div>
            <div className={classNames(className, styles.row)}>
                <SVGDepartureFilled className='icon--reflect-x' />
                <span className={styles.airport} data-tid='arrival-airport'>
                    {inbound.depName}
                </span>
                <span className={styles.date} data-tid='arrival-date'>
                    {inboundDepartureDate}
                </span>
            </div>
        </div>
    );
};

export default FlightDetails;
