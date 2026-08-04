import { FunctionComponent } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { DATE_FORMATS } from 'code/dates';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { getFlightNumberWithCarNumber } from 'frontend/utils/route.utils';
import { IRoute } from 'models/data/IRoute';
import { RouteDirection } from 'models/enum/RouteDirection';
import SvgFlightsFilled from 'frontend/components/icons-new/FlightsFilled';

import styles from './Flight.module.scss';

export interface IFlightProps {
    route: IRoute;
}

export const Flight: FunctionComponent<IFlightProps> = ({ route }) => {
    const { arrDate, arrName, arrPt, depDate, depName, depPt, direction } = route;
    const isInbound = direction === RouteDirection.Inbound;
    const flightNumber = getFlightNumberWithCarNumber(route);

    const depFlightTime = (
        <span className={styles.time} data-tid='dep-time'>
            {formatDateL10n(depDate, DATE_FORMATS.time)}
        </span>
    );

    const arrFlightTime = (
        <span className={classNames(styles.time, styles.arrTime)} data-tid='arr-time'>
            {formatDateL10n(arrDate, DATE_FORMATS.time)}
        </span>
    );

    const arrAirport = (
        <span data-tid='arr-location'>
            <span className={styles.airport}>{arrName}</span>
            <span>({arrPt})</span>
        </span>
    );

    const depAirport = (
        <span data-tid='dep-location' className={styles.depLocation}>
            <span className={styles.airport}>{depName}</span>
            <span>({depPt})</span>
        </span>
    );

    return (
        <div className={styles.flight} data-tid={`${direction}-flight`}>
            <div className={styles.wrapper}>
                <div className={styles.date} data-tid='flight-date'>
                    <span>{formatDateL10n(depDate, DATE_FORMATS.DayOfWeekOrdinalDayMonthYearAbbr)}</span>
                    <span className={styles.fltNo} data-tid='flight-number'>
                        {flightNumber}
                    </span>
                </div>

                <div className={styles.content}>
                    <div className={classNames(styles.timeColumn)}>
                        <div>
                            {depFlightTime}
                            <span className={styles.mobileOnly} data-tid='mobile-arr-time'>
                                {arrFlightTime}
                            </span>
                        </div>

                        {depAirport}

                        <span className={styles.mobileOnly} data-tid='mobile-arr-location'>
                            {arrAirport}
                        </span>
                    </div>

                    <div className={styles.desktopOnly} data-tid='flights-info'>
                        <div className={classNames(styles.icon, { [styles.inboundIcon]: isInbound })}>
                            <span />
                            <SvgFlightsFilled />
                            <span />
                        </div>

                        <div className={classNames(styles.timeColumn)}>
                            {arrFlightTime}
                            {arrAirport}
                        </div>
                    </div>
                </div>
            </div>

            <div className={classNames(styles.icon, styles.mobileOnly, { [styles.inboundIcon]: isInbound })}>
                <span />
                <SvgFlightsFilled />
                <span />
            </div>
        </div>
    );
};

export default observer(Flight);
