import React, { FC } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useMoreThenTabletViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { IGuestsAmount } from 'frontend/utils/luggage.utils';
import { IAirportParking } from 'models/data/externalExtras/IAirportParking';
import { ILateRoomCheckout } from 'models/data/IExtras';
import { ILuggageInfoItem } from 'models/data/IFlightExtras';
import { IBoardType, IHotel, IRoomType } from 'models/data/IHotel';
import { ITransport } from 'models/data/IOffer';
import { ISelectedSeat } from 'models/data/ISeatMapStore';
import { ITransfer } from 'models/data/ITransfer';
import { DestinationRouteFlag } from 'models/enum/DestinationRouteFlag';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import FlightErrata from 'frontend/components/common/ErrataInfo/FlightErrata';
import IconBed from 'frontend/components/icons-new/HotelBedFilled';
import { TBookingDetailsFields } from 'frontend/components/renderings/Payment/components/BookingDetails/interfaces';
import { IAirportParkingFields, IPaymentPageFields } from 'frontend/components/renderings/Payment/interfaces';

import AirportParkingInfo from './components/AirportParkingInfo/AirportParkingInfo';
import BoardInfo from './components/BoardInfo/BoardInfo';
import CollapseButton from './components/CollapseButton/FastTrackAndServiceLine/TransferAndBagsRow/CollapseButton';
import FastTrackAndServiceLine from './components/FastTrackAndServiceLine/TransferAndBagsRow/FastTrackAndServiceLine';
import FlightsInfo from './components/FlightsInfo/FlightsInfo';
import GuestDetails from './components/GuestDetails/GuestDetails';
import HotelInfo, { IHotelInfoProps } from './components/HotelInfo/HotelInfo';
import TransferAndBagsRow from './components/TransferAndBagsRow/TransferAndBagsRow';

import styles from './BookingDetailsExpanded.module.scss';

export interface IBookingDetailsExpandedProps {
    airportParking: Nullable<IAirportParking>;
    board: Nullable<IBoardType>;
    extraLuggageItems: ILuggageInfoItem[];
    guestsAmountByType: IGuestsAmount;
    hotel: Nullable<IHotel>;
    isShown: boolean;
    onToggle: () => void;
    rooms: IRoomType[];
    seatSelection: Nullable<ISelectedSeat[]>;
    transfer: Nullable<ITransfer>;
    transport: Nullable<ITransport>;
    fields?: TBookingDetailsFields;
    isLuxuryPackage?: boolean;
    lateRoomCheckout?: Nullable<ILateRoomCheckout>;
}

const BookingDetailsExpanded: FC<IBookingDetailsExpandedProps> = ({
    isShown,
    transfer,
    transport,
    seatSelection,
    rooms,
    hotel,
    board,
    lateRoomCheckout,
    guestsAmountByType,
    fields,
    onToggle,
    extraLuggageItems,
    airportParking,
    isLuxuryPackage,
}) => {
    const { getPhrase, isErrataEnabled, isTradePortal, guestsDetails, leadPassenger } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        isErrataEnabled: stores.layoutStore.isErrataEnabled,
        isTradePortal: stores.layoutStore.isTradePortal,
        guestsDetails: stores.guestDetailsStore.guestsDetails,
        leadPassenger: stores.guestDetailsStore.leadPassenger,
    }));

    const isMoreThenTabletViewport = useMoreThenTabletViewport();

    if (!isShown && !isTradePortal) {
        return null;
    }

    const departureRoute = transport ? transport.routes[0] : null;
    const arrivalRoute = transport ? transport.routes[1] : null;

    const { OverheadAddedIcon, IncludedIcon, IncludedWithInfantLabel, IncludedBagsLabel, OverheadBagAddedLabel } =
        fields || {};

    const cabinBagsInfo = {
        fields: {
            OverheadAddedIcon,
            IncludedIcon,
            IncludedBagsLabel,
            IncludedWithInfantLabel,
            OverheadBagAddedLabel,
        },
        guestsAmountByType,
    };

    const departureRouteInfo = departureRoute
        ? {
              route: departureRoute,
              flag: DestinationRouteFlag.Departure,
              seatSelection: seatSelection ? seatSelection[0].seats : undefined,
              cabinBags: cabinBagsInfo,
          }
        : null;
    const arrivalRouteInfo = arrivalRoute
        ? {
              route: arrivalRoute,
              flag: DestinationRouteFlag.Arrival,
              seatSelection: seatSelection ? seatSelection[1].seats : undefined,
              cabinBags: cabinBagsInfo,
          }
        : null;

    const { DepartureAirportText, EmailInstruction, ParkingDates } = fields as IPaymentPageFields;
    const airportParkingFields: IAirportParkingFields = {
        DepartureAirportText,
        EmailInstruction,
        ParkingDates,
    };

    const SafeHotelInfo: FC<IHotelInfoProps> = props => {
        const result = HotelInfo(props);

        return (result as JSX.Element) || null;
    };

    return (
        <div data-tid='booking-details-expanded'>
            <div className={classNames(styles.header, 'd-none', !isTradePortal && 'd-lg-flex')}>
                <h4 className={styles.title}>{getPhrase(SitecoreDictionary.PaymentTitlesYourBookingDetails)}</h4>
                {isMoreThenTabletViewport && <CollapseButton onClick={onToggle} />}
            </div>

            <div className={styles.list}>
                <div className={classNames(styles.row, isTradePortal && styles.noTopBorder)}>
                    <SafeHotelInfo hotel={hotel} rooms={rooms} />
                    <BoardInfo board={board} />
                </div>

                <FlightsInfo arrivalRouteInfo={arrivalRouteInfo} departureRouteInfo={departureRouteInfo} />

                {!isTradePortal && isErrataEnabled && !!transport?.errataFlightInfo?.length && (
                    <div className={styles.errata}>
                        <FlightErrata errataFlightInfo={transport?.errataFlightInfo} />
                    </div>
                )}

                <TransferAndBagsRow
                    fields={fields}
                    guestsAmountByType={guestsAmountByType}
                    transfer={transfer}
                    extraLuggageItems={extraLuggageItems}
                />

                {lateRoomCheckout && (
                    <div className={styles.row}>
                        <div className={styles.blockItem}>
                            <IconBed className={styles.svgIcon} />
                            <div className={styles.itemHead} data-tid='route'>
                                {getPhrase(SitecoreDictionary.PriceSummaryLabelsLateCheckout)}
                            </div>
                            <div>{getPhrase(SitecoreDictionary.PaymentLabelsLateCheckoutIncluded)}</div>
                        </div>
                    </div>
                )}
                {isLuxuryPackage && (
                    <FastTrackAndServiceLine
                        FastTrackLabel={fields?.FastTrackLabel}
                        ServiceLineLabel={fields?.ServiceLineLabel}
                    />
                )}
                {airportParking && (
                    <AirportParkingInfo
                        airportParkingDetails={airportParking}
                        fields={airportParkingFields}
                        transport={transport}
                    />
                )}

                {!isTradePortal && !isMoreThenTabletViewport && <CollapseButton onClick={onToggle} />}

                {isTradePortal && <GuestDetails guestsDetails={guestsDetails} leadPassenger={leadPassenger} />}
            </div>
        </div>
    );
};

export default observer(BookingDetailsExpanded);
