import { FunctionComponent, useMemo } from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getAccommodationGuestsCount } from 'frontend/utils/accommodation.utils';
import { getGuestsAmountByType } from 'frontend/utils/luggage.utils';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { IExtraLuggageInfo } from 'models/data/IFlightExtras';
import { IAccomData, ITransport, IUnit } from 'models/data/IOffer';
import { ISelectedSeat } from 'models/data/ISeatMapStore';
import { ITransfer } from 'models/data/ITransfer';
import { GuestType } from 'models/enum/GuestType';
import { TransferType } from 'models/enum/transfer/TransferType';
import { ICabinBagsInfoFields } from 'frontend/components/common/Booking/CabinBagsInfo/CabinBagsInfo';
import { IFastTrackInfoFields } from 'frontend/components/common/Booking/FastTrackInfo/FastTrackInfo';
import { ILuggageInfoFields } from 'frontend/components/common/Booking/LuggageInfo/LuggageInfo';
import HolidaySummaryAirportParking, {
    IAirportParkingInfoFields,
} from 'frontend/components/common/HolidaySummaryAirportParking/HolidaySummaryAirportParking';
import HolidaySummaryBags from 'frontend/components/common/HolidaySummaryBags/HolidaySummaryBags';
import HolidaySummaryFlights from 'frontend/components/common/HolidaySummaryFlights/HolidaySummaryFlights';
import HolidaySummaryPlainOptions from 'frontend/components/common/HolidaySummaryPlainOptions/HolidaySummaryPlainOptions';
import HolidaySummaryRoomAndBoard from 'frontend/components/common/HolidaySummaryRoomAndBoard/HolidaySummaryRoomAndBoard';
import HolidaySummaryTransfer from 'frontend/components/common/HolidaySummaryTransfer/HolidaySummaryTransfer';
import FreeForKidsPill from 'frontend/components/common/Pills/FreeForKidsPill/FreeForKidsPill';

import { createDataTid, SummaryInfo } from './HolidaySummary.utils';

import styles from './HolidaySummary.module.scss';

const DEFAULT_ORDER = [
    SummaryInfo.Flight,
    SummaryInfo.LuggageAndTransfer,
    SummaryInfo.AirportParking,
    SummaryInfo.AccommodationAndBoard,
    SummaryInfo.PassengerDetails,
];

export interface IHolidaySummaryProps {
    booking: IBookingInfo;
    accom?: IAccomData<IUnit>;
    airportParkingInfoFields?: IAirportParkingInfoFields;
    cabinBagsInfoFields?: ICabinBagsInfoFields;
    containerClassName?: string;
    dataTidPrefix?: string;
    fastTrackInfoFields?: IFastTrackInfoFields;
    flights?: ITransport;
    guestsCount?: Record<GuestType, number>;
    isLuxuryPackage?: boolean;
    luggageInfo?: IExtraLuggageInfo;
    luggageInfoFields?: ILuggageInfoFields;
    rowsClassName?: string;
    selectedSeats?: ISelectedSeat[];
    showStayDuration?: boolean;
    summaryInfoOrder?: Array<SummaryInfo>;
    transfer?: ITransfer;
}

const HolidaySummary: FunctionComponent<IHolidaySummaryProps> = ({
    booking,
    flights,
    transfer,
    accom,
    guestsCount,
    dataTidPrefix,
    containerClassName,
    rowsClassName,
    selectedSeats,
    luggageInfoFields,
    cabinBagsInfoFields,
    fastTrackInfoFields,
    airportParkingInfoFields,
    luggageInfo,
    summaryInfoOrder = DEFAULT_ORDER,
    showStayDuration,
    isLuxuryPackage,
}) => {
    const { totalHoldLuggageItemsNumber } = useStore(({ viewBookingStore }: TStores) => ({
        totalHoldLuggageItemsNumber: viewBookingStore.extraLuggage.totalHoldLuggageItemsNumber,
    }));

    const hotelMeta = {
        resort: {
            name: booking.hotel?.resort.name || '',
            region: booking.package.location.region,
        },
        name: booking.hotel!.name!,
    };

    const rowStyles = classNames(styles.row, rowsClassName);
    const airportParkingRowStyles = classNames(styles.row, styles.airportParkingRow, rowsClassName);
    const guestsAmountByType = useMemo(() => getGuestsAmountByType(booking, accom), [booking, accom]);

    const resolvedTransfer = transfer ?? booking.transfers?.[0];
    const isTransfer = !!resolvedTransfer && resolvedTransfer?.type !== TransferType.NoTransfer;
    const isPram = !!guestsAmountByType.infants;
    const isHoldLuggage = !!totalHoldLuggageItemsNumber || isPram;

    const shouldShowTransferAndBags = isTransfer || isHoldLuggage;

    return (
        <div
            className={classNames(styles.container, containerClassName)}
            data-tid={createDataTid('holiday-summary', dataTidPrefix)}
        >
            {summaryInfoOrder.map(component => {
                switch (component) {
                    case SummaryInfo.Flight:
                        return (
                            <div
                                key='flights'
                                className={rowStyles}
                                data-tid={createDataTid('holiday-summary-flights', dataTidPrefix)}
                            >
                                <HolidaySummaryFlights
                                    flights={flights ?? booking.package.transport}
                                    passengers={booking.guests}
                                    selectedSeats={selectedSeats ?? booking.seatSelection}
                                    cabinBagsInfoFields={cabinBagsInfoFields}
                                    guestsAmountByType={guestsAmountByType}
                                    fastTrackInfoFields={fastTrackInfoFields}
                                    isLuxuryPackage={isLuxuryPackage}
                                />
                            </div>
                        );
                    case SummaryInfo.LuggageAndTransfer:
                        if (shouldShowTransferAndBags) {
                            return (
                                <div
                                    key='luggageAndTransfer'
                                    className={rowStyles}
                                    data-tid={createDataTid('holiday-summary-luggage-transfer', dataTidPrefix)}
                                >
                                    {isHoldLuggage && (
                                        <HolidaySummaryBags
                                            luggageInfo={luggageInfo ?? booking.extraLuggageInfo}
                                            fields={luggageInfoFields}
                                            dataTid={createDataTid('holiday-summary-bags', dataTidPrefix)}
                                            guestsAmountByType={guestsAmountByType}
                                        />
                                    )}
                                    {isTransfer && (
                                        <HolidaySummaryTransfer
                                            transfer={resolvedTransfer}
                                            dataTid={createDataTid('holiday-summary-transfer', dataTidPrefix)}
                                        />
                                    )}
                                </div>
                            );
                        }

                        return null;
                    case SummaryInfo.AccommodationAndBoard:
                        return (
                            <div
                                key='accommodation'
                                className={rowStyles}
                                data-tid={createDataTid('holiday-summary-accommodation', dataTidPrefix)}
                            >
                                <HolidaySummaryRoomAndBoard
                                    units={accom?.unit ?? booking.package.accom.rooms}
                                    hotel={hotelMeta}
                                    dataTid={createDataTid('holiday-summary-room-and-board', dataTidPrefix)}
                                    accom={booking.package.accom}
                                    showStayDuration={showStayDuration}
                                />
                            </div>
                        );
                    case SummaryInfo.PassengerDetails:
                        return (
                            <div
                                key='passengerDetails'
                                className={rowStyles}
                                data-tid={createDataTid('holiday-summary-passenger-details', dataTidPrefix)}
                            >
                                <HolidaySummaryPlainOptions
                                    guestsCount={
                                        guestsCount ?? getAccommodationGuestsCount(booking.package.accom.rooms)
                                    }
                                    dataTid={createDataTid('holiday-summary-passengers', dataTidPrefix)}
                                />
                            </div>
                        );
                    case SummaryInfo.FreeKids:
                        if (booking.package.accom.rooms.find(item => item.isFreeForKids)) {
                            return (
                                <div
                                    key='freeKids'
                                    className={rowStyles}
                                    data-tid={createDataTid('holiday-summary-free-kids', dataTidPrefix)}
                                >
                                    <FreeForKidsPill />
                                </div>
                            );
                        }

                        return null;
                    case SummaryInfo.AirportParking:
                        if (booking.airportParking) {
                            const departureAirportName = flights?.routes?.[0]?.depItemName;

                            return (
                                <div
                                    key='airportParking'
                                    className={airportParkingRowStyles}
                                    data-tid={createDataTid('holiday-summary-airport-parking-details', dataTidPrefix)}
                                >
                                    <HolidaySummaryAirportParking
                                        airportParkingInfoFields={airportParkingInfoFields}
                                        airportParking={booking.airportParking}
                                        departureAirportName={departureAirportName}
                                        dataTid={createDataTid('holiday-summary-airport-parking', dataTidPrefix)}
                                    />
                                </div>
                            );
                        }

                        return null;
                    default:
                        return null;
                }
            })}
        </div>
    );
};

export default HolidaySummary;
