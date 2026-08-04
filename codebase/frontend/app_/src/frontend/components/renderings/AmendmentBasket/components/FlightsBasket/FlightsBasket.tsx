import { FunctionComponent } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getRouteByDirection } from 'frontend/utils/airports.utils';
import { formatDateL10n, getDaysDifference } from 'frontend/utils/date.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IRoute } from 'models/data/IRoute';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SvgCalendarFilled from 'frontend/components/icons-new/CalendarFilled';
import SVGDepartureFilled from 'frontend/components/icons-new/DepartureFilled';

import styles from './FlightsBasket.module.scss';

export const FlightsBasket: FunctionComponent = () => {
    const { bookingRoutes, selectedFlight, getPhrase } = useStore((stores: IHolidaysStores) => ({
        bookingRoutes: stores.amendFlightsStore.bookingRoutes,
        selectedFlight: stores.amendFlightsStore.selectedFlight,
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const isMobile = useMobileViewport();

    const routes = selectedFlight ? selectedFlight.routes : bookingRoutes;
    const { outbound, inbound } = getRouteByDirection(routes);

    const getAirportInfo = (route: IRoute) => `${route.depName} (${route.depPt})`;

    const getDateTime = (route: IRoute) => formatDateL10n(route.depDate, `ddd Do MMM ${isMobile ? '' : '- '}HH:mm`);

    const numberOfNights = getDaysDifference(new Date(inbound?.depDate || ''), new Date(outbound?.depDate || ''));

    const numberOfNightsLabel =
        numberOfNights &&
        Tokenizer.replaceToken(
            getPhrase(
                numberOfNights > 1
                    ? SitecoreDictionary.GlobalsLabelsNumberOfNights
                    : SitecoreDictionary.GlobalsLabelsNumberOfNight,
            ),
            Tokens.Count,
            numberOfNights.toString(),
        );

    return (
        <section
            aria-label={getPhrase(SitecoreDictionary.AmendFlightsLabelsCurrentFlights)}
            data-tid='amend-flight-basket'
            className={styles.container}
        >
            {!selectedFlight && !isMobile && (
                <span className='text-bold amendment-basket__current-flight'>
                    {getPhrase(SitecoreDictionary.AmendFlightsLabelsCurrentFlights)}
                </span>
            )}

            {isMobile && (
                <div className={styles.durationDetails}>
                    <SvgCalendarFilled />
                    <span>{numberOfNightsLabel}</span>
                </div>
            )}

            <div className='amendment-basket__flights' data-cs-mask>
                {!!outbound && (
                    <div className={classNames('amendment-basket__flight', styles.flightDetails)}>
                        <SVGDepartureFilled className='amendment-basket__icon' />
                        {isMobile ? (
                            <>
                                <span className={styles.airport}>{outbound.depPt}</span>
                                <span className='date-time'>{getDateTime(outbound)}</span>
                            </>
                        ) : (
                            <span className='amendment-basket__flight-text'>
                                <span>{getAirportInfo(outbound)}</span>
                                <span className='date-time'>{getDateTime(outbound)}</span>
                            </span>
                        )}
                    </div>
                )}

                {!!inbound && (
                    <div className={classNames('amendment-basket__flight', styles.flightDetails)}>
                        <SVGDepartureFilled className='amendment-basket__icon icon--reflect-x' />
                        {isMobile ? (
                            <>
                                <span className={styles.airport}>{inbound.depPt}</span>
                                <span className='date-time'>{getDateTime(inbound)}</span>
                            </>
                        ) : (
                            <span className='amendment-basket__flight-text'>
                                <span>{getAirportInfo(inbound)}</span>
                                <span className='date-time'>{getDateTime(inbound)}</span>
                            </span>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
};

export default observer(FlightsBasket);
