import React from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { getSeatBorderColor } from 'frontend/utils/seatAndBags.utils';
import { ISelectedSeatDetails } from 'models/data/ISeatMapStore';
import { DestinationRouteFlag } from 'models/enum/DestinationRouteFlag';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SeatSelectionDesktop from 'frontend/components/renderings/SeatAndBags/components/desktop/SeatSelectionDesktop';

import styles from './SeatsInfo.module.scss';

export interface ISeatsInfoProps {
    flag: DestinationRouteFlag;
    seats?: ISelectedSeatDetails[];
}

const SeatsInfo = ({ seats, flag }: ISeatsInfoProps) => {
    const {
        outboundFlight,
        inboundFlight,
        isSeatMapFlowEnabled,
        passengersByQueue,
        isPaymentPage,
        haveOutboundSelectedSeats,
        haveInboundSelectedSeats,
        getPhrase,
    } = useStore((stores: TStores) => ({
        outboundFlight: stores.bookingStore.outboundFlight,
        inboundFlight: stores.bookingStore.inboundFlight,
        isSeatMapFlowEnabled: stores.seatMapStore.isSeatMapFlowEnabled,
        passengersByQueue: stores.flightsPassengersStore.passengersByQueue,
        isPaymentPage: isHolidayStore(stores) ? stores.layoutStore.isPaymentPage : stores.layoutStore.isConfirmPage,
        haveOutboundSelectedSeats: stores.seatMapStore.haveOutboundSelectedSeats,
        haveInboundSelectedSeats: stores.seatMapStore.haveInboundSelectedSeats,
        getPhrase: stores.layoutStore.getPhrase,
    }));

    if (!!seats?.length) {
        return (
            <div data-tid='seats-info' className={styles.flightSeats}>
                {seats.filter(Boolean).map(seat => (
                    <SeatSelectionDesktop
                        text={seat.priceBand as string}
                        color={getSeatBorderColor(seat.priceBand)}
                        seatNumber={seat.seatNumber}
                        key={seat.paxIndex}
                    />
                ))}
            </div>
        );
    }

    if (
        (!haveOutboundSelectedSeats && flag === DestinationRouteFlag.Departure) ||
        (!haveInboundSelectedSeats && flag === DestinationRouteFlag.Arrival)
    ) {
        return <SeatSelectionDesktop text={getPhrase(SitecoreDictionary.GlobalsLabelsNoSeatSelected)} />;
    }

    const areFlightsExternal = outboundFlight?.isExt && inboundFlight?.isExt;

    if (isPaymentPage && isSeatMapFlowEnabled && areFlightsExternal && !!passengersByQueue?.length) {
        return (
            <div data-tid='passengers-info' className={styles.flightSeats}>
                {passengersByQueue.map(passenger => {
                    const { seat } =
                        flag === DestinationRouteFlag.Departure
                            ? passenger.outboundPassenger
                            : passenger.inboundPassenger;

                    return seat ? (
                        <SeatSelectionDesktop
                            key={seat.seatNumber}
                            text={seat.priceBand}
                            color={getSeatBorderColor(seat.priceBand)}
                            seatNumber={seat.seatNumber}
                        />
                    ) : null;
                })}
            </div>
        );
    }

    return null;
};

export default observer(SeatsInfo);
