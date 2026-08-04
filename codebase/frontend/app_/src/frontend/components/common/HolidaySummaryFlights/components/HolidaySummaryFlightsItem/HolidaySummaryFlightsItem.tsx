import { FC } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { DATE_FORMATS } from 'code/dates';
import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { IGuestsAmount } from 'frontend/utils/luggage.utils';
import { formatPriceToTwoDecimalPlaces, getSeatBorderColor } from 'frontend/utils/seatAndBags.utils';
import { IRoute } from 'models/data/IRoute';
import { IPassengerSeat } from 'models/data/ISeatMapStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import CabinBagsInfo, { ICabinBagsInfoFields } from 'frontend/components/common/Booking/CabinBagsInfo/CabinBagsInfo';
import FastTrackInfo, { IFastTrackInfoFields } from 'frontend/components/common/Booking/FastTrackInfo/FastTrackInfo';
import SVGDepartureFilled from 'frontend/components/icons-new/DepartureFilled';
import SeatSelectionDesktop from 'frontend/components/renderings/SeatAndBags/components/desktop/SeatSelectionDesktop';

import styles from './HolidaySummaryFlightsItem.module.scss';

export interface IHolidaySummaryFlightsItemProps {
    flight: IRoute;
    guestsAmountByType: IGuestsAmount;
    cabinBagsInfoFields?: ICabinBagsInfoFields;
    chosenSeats?: IPassengerSeat[];
    dataTid?: string;
    fastTrackInfoFields?: IFastTrackInfoFields;
    includesFastTrack?: boolean;
    reverse?: boolean;
    showSpeedyBoardingTooltip?: boolean;
}

const HolidaySummaryFlightsItem: FC<IHolidaySummaryFlightsItemProps> = ({
    chosenSeats = [],
    flight,
    reverse,
    dataTid,
    cabinBagsInfoFields,
    fastTrackInfoFields,
    guestsAmountByType,
    includesFastTrack,
    showSpeedyBoardingTooltip,
}) => {
    const { LCBCountBooking, LCBCountOffer, getPhrase, isAmendPaymentPage } = useStore(stores => ({
        LCBCountBooking: stores.viewBookingStore.extraLuggage.LCBCount,
        LCBCountOffer: isHolidayStore(stores) ? stores.amendDatesStore.extraLuggage.LCBCount : 0,
        getPhrase: stores.layoutStore.getPhrase,
        isAmendPaymentPage: stores.layoutStore.isAmendPaymentPage,
    }));

    const departureDate: string = formatDateL10n(flight?.depDate, DATE_FORMATS.fullDateTime);
    const LCBCount = isAmendPaymentPage ? LCBCountOffer : LCBCountBooking;

    return (
        <div className={styles.container} data-tid={dataTid}>
            <SVGDepartureFilled
                className={classNames(styles.icon, {
                    'icon--reflect-x': reverse,
                })}
                data-tid={`${dataTid}-icon`}
            />
            <div className={styles.content}>
                <div
                    data-tid={`${dataTid}-route`}
                    className={styles.route}
                >{`${flight.depName} - ${flight.arrName}`}</div>
                <div data-tid={`${dataTid}-date`} className={styles.date}>
                    {departureDate}
                </div>
                {!chosenSeats.length && (
                    <div data-tid={`${dataTid}-no-seats`} className={styles.noSeats}>
                        {getPhrase(SitecoreDictionary.GlobalsLabelsNoSeatSelected)}
                    </div>
                )}
                {!!chosenSeats.length && (
                    <div data-tid={`${dataTid}-seats`} className={styles.selectedSeats}>
                        {chosenSeats.map(seat => (
                            <SeatSelectionDesktop
                                key={seat.seatNumber}
                                text={seat?.priceBand ?? ''}
                                color={getSeatBorderColor(seat?.priceBand)}
                                seatNumber={seat?.seatNumber}
                                price={formatPriceToTwoDecimalPlaces(seat?.price)}
                                hasSecondaryStyle={seat?.hasSecondaryStyle}
                                isPricesHidden
                            />
                        ))}
                    </div>
                )}
                {cabinBagsInfoFields && (
                    <CabinBagsInfo
                        fields={cabinBagsInfoFields}
                        LCBCount={LCBCount}
                        guestsAmountByType={guestsAmountByType}
                        containerClassName={classNames(styles.additionalProducts, {
                            [styles.cabinBagsContainerAmendPayment]: isAmendPaymentPage,
                        })}
                        bagTypeClassName={styles.cabinBag}
                        iconClassName={styles.cabinBagIcon}
                        showSpeedyBoardingTooltip={showSpeedyBoardingTooltip}
                    />
                )}
                {includesFastTrack && fastTrackInfoFields && (
                    <FastTrackInfo
                        fields={fastTrackInfoFields}
                        count={LCBCount}
                        containerClassName={styles.cabinBag}
                        iconClassName={styles.cabinBagIcon}
                    />
                )}
            </div>
        </div>
    );
};

export default observer(HolidaySummaryFlightsItem);
