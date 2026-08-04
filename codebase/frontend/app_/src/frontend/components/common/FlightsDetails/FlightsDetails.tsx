import { FC } from 'react';

import { getRouteByDirection } from 'frontend/utils/airports.utils';
import { IRoute } from 'models/data/IRoute';

import Flight, { IFlightProps } from './Flight/Flight';

import styles from './FlightsDetails.module.scss';

export interface IFlightsDetailsProps extends Omit<IFlightProps, 'route'> {
    routes: IRoute[];
}

export const FlightsDetails: FC<IFlightsDetailsProps> = ({ routes, shouldShowTerminal, ...flightProps }) => {
    const { outbound, inbound } = getRouteByDirection(routes);

    const hasTerminalInfo =
        !!outbound?.arrTerminal || !!outbound?.depTerminal || !!inbound?.arrTerminal || !!inbound?.depTerminal;

    return (
        <div className={styles.flights}>
            {outbound && (
                <Flight route={outbound} shouldShowTerminal={shouldShowTerminal && hasTerminalInfo} {...flightProps} />
            )}

            <div className={styles.separator} />

            {inbound && (
                <Flight route={inbound} shouldShowTerminal={shouldShowTerminal && hasTerminalInfo} {...flightProps} />
            )}
        </div>
    );
};

export default FlightsDetails;
