import React, { FC } from 'react';

import IconPlainDeparture from 'frontend/components/icons/PlainDeparture';
import RouteInfo, {
    IRouteInfoProps,
} from 'frontend/components/renderings/Payment/components/BookingDetailsExpanded/components/RouteInfo/RouteInfo';

export interface IFlightsInfoProps {
    arrivalRouteInfo: IRouteInfoProps | null;
    departureRouteInfo: IRouteInfoProps | null;
    isPrintPreview?: boolean;
}

import classNames from 'classnames';

import styles from './FlightsInfo.module.scss';

const FlightsInfo: FC<IFlightsInfoProps> = ({ departureRouteInfo, arrivalRouteInfo, isPrintPreview = false }) => {
    if (!departureRouteInfo && !arrivalRouteInfo) return null;

    return (
        <div className={styles.row}>
            {departureRouteInfo && (
                <div className={styles.blockItem}>
                    <IconPlainDeparture className={styles.svgIcon} />
                    <div data-tid='outbound-flight' data-cs-mask>
                        <RouteInfo isPrintPreview={isPrintPreview} {...departureRouteInfo} />
                    </div>
                </div>
            )}
            {arrivalRouteInfo && (
                <div className={styles.blockItem}>
                    <IconPlainDeparture className={classNames(styles.svgIcon, 'icon--reflect-x')} />
                    <div data-tid='inbound-flight' data-cs-mask>
                        <RouteInfo isPrintPreview={isPrintPreview} {...arrivalRouteInfo} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default FlightsInfo;
