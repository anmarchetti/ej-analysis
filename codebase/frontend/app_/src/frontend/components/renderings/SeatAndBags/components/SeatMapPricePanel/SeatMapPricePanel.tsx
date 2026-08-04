import React, { FunctionComponent } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { SignDisplay, TrailingZeroDisplay } from 'code/currency';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getSeatBorderColor, isPremiumSeat } from 'frontend/utils/seatAndBags.utils';
import { IPassengerSeat } from 'models/data/ISeatMapStore';
import { RouteDirection } from 'models/enum/RouteDirection';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import LuxuryPill from 'frontend/components/common/Pills/LuxuryPill/LuxuryPill';
import RichTextDictionary from 'frontend/components/common/RichTextDictionary';

import styles from './SeatMapPricePanel.module.scss';

export interface ISeatMapPricePanelProps {
    isLastChild: boolean;
    seat: IPassengerSeat | undefined;
    type: RouteDirection;
    isPricesHidden?: boolean;
}

export const SeatMapPricePanel: FunctionComponent<ISeatMapPricePanelProps> = ({
    seat,
    isPricesHidden,
    type,
    isLastChild,
}) => {
    const { currency, formatMoney, isLuxuryPackage } = useStore(
        ({ seatMapStore, marketStore, bookingStore, viewBookingStore }: TStores) => ({
            currency: seatMapStore.currency,
            formatMoney: marketStore.formatMoney,
            isLuxuryPackage: bookingStore.isLuxuryPackage || viewBookingStore.isLuxuryPackage,
        }),
    );

    const { price, priceBand, seatNumber } = seat || {};

    const isArrival = type === RouteDirection.Inbound;
    const isLastArrivalChild = isLastChild && isArrival;

    if (!(seatNumber && priceBand)) {
        return (
            <div
                data-tid='no-seat-selected'
                className={classNames(
                    styles.wrapper,
                    isArrival && styles.arrivalWrapper,
                    isLastArrivalChild && styles.lastChildWrapper,
                )}
            >
                <div data-tid='no-seat-selected-container' className={styles.container}>
                    <div data-tid='no-seat-selected-text' className={styles.text}>
                        <RichTextDictionary
                            tag='span'
                            className={styles.seatsGrayText}
                            dictionaryKey={SitecoreDictionary.SeatMapLabelsNoSeatSelectedSingular}
                        />
                    </div>
                </div>
            </div>
        );
    }

    const shouldShowLuxPill = isLuxuryPackage && !isPremiumSeat(seat?.priceBand);

    return (
        <div
            data-tid='price-panel'
            className={classNames({
                [styles.wrapper]: true,
                [styles.arrivalWrapper]: isArrival,
                [styles.lastChildWrapper]: isLastArrivalChild,
            })}
        >
            <div
                data-tid='price-panel-container'
                className={classNames({
                    [styles.container]: true,
                    [styles.wrap]: shouldShowLuxPill,
                })}
            >
                <div className={styles.seatInfo}>
                    <span
                        className={`seat-confirmation__seat-number seat-confirmation__seat-number--alt seat-confirmation__seat-number--border-color-${getSeatBorderColor(
                            priceBand,
                        )}`}
                        data-tid='seat-number'
                    >
                        {seatNumber}
                    </span>
                    <span className={classNames(styles.text, styles.seatsGrayText)} data-tid='price-band'>
                        {priceBand}
                    </span>
                </div>
                {!isPricesHidden && !shouldShowLuxPill && (
                    <div className={styles.seatPrice} data-tid='seat-price-container'>
                        <span data-tid='seat-price' className={classNames('seat-confirmation__place', styles.price)}>
                            {formatMoney(Number(price), {
                                currency,
                                signDisplay: SignDisplay.Always,
                                trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                            })}
                        </span>
                    </div>
                )}

                {shouldShowLuxPill && <LuxuryPill />}
            </div>
        </div>
    );
};

export default observer(SeatMapPricePanel);
