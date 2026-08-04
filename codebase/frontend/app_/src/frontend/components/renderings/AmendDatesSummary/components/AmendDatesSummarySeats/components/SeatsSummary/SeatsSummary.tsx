import { FunctionComponent } from 'react';
import classnames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getGuestAmount } from 'frontend/utils/luggage.utils';
import { getSeatBorderColor } from 'frontend/utils/seatAndBags.utils';
import { IRoute } from 'models/data/IRoute';
import { IPassengerSeat } from 'models/data/ISeatMapStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import CabinBagsInfo from 'frontend/components/common/Booking/CabinBagsInfo/CabinBagsInfo';
import { IAmendDatesSummaryFields } from 'frontend/components/renderings/AmendDatesSummary/AmendDatesSummary';
import SeatSelectionDesktop from 'frontend/components/renderings/SeatAndBags/components/desktop/SeatSelectionDesktop';

import styles from './SeatsSummary.module.scss';

interface IAmendDatesSummarySeatsItemProps {
    chosenSeats: IPassengerSeat[];
    fields: IAmendDatesSummaryFields;
    route?: IRoute;
    title?: string;
}

const AmendDatesSummarySeatsDirection: FunctionComponent<IAmendDatesSummarySeatsItemProps> = ({
    chosenSeats,
    title,
    route,
    fields,
}) => {
    const { getPhrase, offer, LCBCount } = useStore(({ layoutStore, amendDatesStore }: IHolidaysStores) => ({
        getPhrase: layoutStore.getPhrase,
        LCBCount: amendDatesStore.extraLuggage.LCBCount,
        offer: amendDatesStore.offer,
    }));

    const guestsAmountByType = getGuestAmount(offer);

    const { depPt, arrPt } = route || {};

    return (
        <div className={classnames(styles.direction, 'seats-summary-direction')}>
            <div className={styles.header}>
                {!!title && (
                    <h4 data-tid='flight-details-title' className={styles.title}>
                        {title}
                    </h4>
                )}
                {!!route && (
                    <h5 data-tid='airport-details' className={styles.subtitle}>
                        {depPt} - {arrPt}
                    </h5>
                )}
                {chosenSeats.length === 0 && (
                    <p data-tid='no-seats-text' className={styles.noneSelectedLabel}>
                        {getPhrase(SitecoreDictionary.GlobalsLabelsNoSeatSelected)}
                    </p>
                )}
            </div>

            {!!chosenSeats.length && (
                <div data-tid='selected-seats' className={styles.selectedSeats}>
                    {chosenSeats.map(({ seatNumber, priceBand, hasSecondaryStyle }) => (
                        <SeatSelectionDesktop
                            key={seatNumber}
                            text={priceBand}
                            color={getSeatBorderColor(priceBand)}
                            seatNumber={seatNumber}
                            hasSecondaryStyle={hasSecondaryStyle}
                            isPricesHidden
                        />
                    ))}
                </div>
            )}

            <div data-tid='fallback-products' className={styles.fallbackProducts}>
                <CabinBagsInfo
                    fields={fields}
                    guestsAmountByType={guestsAmountByType}
                    LCBCount={LCBCount}
                    containerClassName={styles.cabinBagsWrapper}
                    bagTypeClassName={styles.cabinBags}
                    iconClassName={styles.icon}
                />
            </div>
        </div>
    );
};

export default observer(AmendDatesSummarySeatsDirection);
