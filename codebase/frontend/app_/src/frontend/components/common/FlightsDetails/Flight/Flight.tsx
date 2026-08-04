import { FC } from 'react';
import classNames from 'classnames';

import { DATE_FORMATS } from 'code/dates';
import useStore from 'frontend/hooks/useStore';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { getFlightNumberWithCarNumber } from 'frontend/utils/route.utils';
import { IRoute } from 'models/data/IRoute';
import { RouteDirection } from 'models/enum/RouteDirection';
import TerminalInfo, { ITerminalInfoProps } from 'frontend/components/common/FlightsDetails/TerminalInfo/TerminalInfo';
import SvgDepartureFilled from 'frontend/components/icons-new/DepartureFilled';

import styles from './Flight.module.scss';

export interface IFlightProps extends Omit<ITerminalInfoProps, 'terminal'> {
    route: IRoute;
    isIconOrange?: boolean;
    shouldShowTerminal?: boolean;
}

export const Flight: FC<IFlightProps> = ({ route, isIconOrange, shouldShowTerminal, fields }: IFlightProps) => {
    const { isTerminalInformationEnabled, isTradePortal } = useStore(stores => ({
        isTerminalInformationEnabled: stores.layoutStore.isTerminalInformationEnabled,
        isTradePortal: stores.layoutStore.isTradePortal,
    }));

    const { arrDate, arrName, arrPt, depDate, depName, depPt, direction, id, arrTerminal, depTerminal } = route;
    const isInbound = direction === RouteDirection.Inbound;
    const flightNumber = getFlightNumberWithCarNumber(route);
    const showTerminalInfo = isTerminalInformationEnabled && shouldShowTerminal && !!fields;
    const renderAirportInfo = (idPrefix: string, name: string, code: string, terminal: string | undefined) => (
        <div className={classNames(styles.detailsCol, styles.airportsCol)} data-tid={`${idPrefix}-location`}>
            {name}
            <span className={styles.airportCode} data-tid={`${idPrefix}-airport`}>
                ({code})
            </span>
            {showTerminalInfo && (
                <div className={styles.terminal} data-tid={`${idPrefix}-terminal`}>
                    <TerminalInfo terminal={terminal} fields={fields} />
                </div>
            )}
        </div>
    );

    return (
        <div className={styles.flight} data-tid={`${direction}-flight`}>
            <div className={classNames(styles.icon, isIconOrange && styles.iconOrange)} data-tid='icon'>
                {<SvgDepartureFilled className={isInbound ? 'icon--reflect-x' : undefined} />}
            </div>

            <div className={styles.details} data-tid={id}>
                <div className={classNames(styles.date, styles.detailsRow)} data-tid='flight-date'>
                    {formatDateL10n(depDate, DATE_FORMATS.DayOfWeekOrdinalDayMonthYearAbbr)}
                </div>

                {isTradePortal && !!flightNumber && (
                    <div className={styles.flightNumber} data-tid='flight-number'>
                        {flightNumber}
                    </div>
                )}

                <div className={classNames(styles.timeRow, styles.detailsRow)}>
                    <span className={styles.detailsCol} data-tid='dep-time'>
                        {formatDateL10n(depDate, DATE_FORMATS.time)}
                    </span>
                    <span className={classNames(styles.detailsCol, styles.separator)} />
                    <span className={styles.detailsCol} data-tid='arr-time'>
                        {formatDateL10n(arrDate, DATE_FORMATS.time)}
                    </span>
                </div>

                <div className={classNames(styles.airportsRow, styles.detailsRow)}>
                    {renderAirportInfo('dep', depName, depPt, depTerminal)}
                    <span className={classNames(styles.detailsCol, styles.separator)} />
                    {renderAirportInfo('arr', arrName, arrPt, arrTerminal)}
                </div>
            </div>
        </div>
    );
};

export default Flight;
