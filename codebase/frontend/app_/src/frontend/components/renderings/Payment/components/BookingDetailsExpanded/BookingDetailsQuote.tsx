import React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getNumberOfGuestsByCategory } from 'frontend/utils/guestsValidation';
import { generateExtraLuggageFullInfo, getDefaultBagsOneDirection, IGuestsAmount } from 'frontend/utils/luggage.utils';
import { extractPassengerSeats } from 'frontend/utils/passenger.utils';
import { ILateRoomCheckout } from 'models/data/IExtras';
import { ILuggageInfoItem } from 'models/data/IFlightExtras';
import { IBoardType, IHotel, IRoomType } from 'models/data/IHotel';
import { ITransport } from 'models/data/IOffer';
import { ITransfer } from 'models/data/ITransfer';
import { DestinationRouteFlag } from 'models/enum/DestinationRouteFlag';
import CabinBagsInfo from 'frontend/components/common/Booking/CabinBagsInfo/CabinBagsInfo';
import LuggageInfo from 'frontend/components/common/Booking/LuggageInfo/LuggageInfo';
import SvgGuestsFilled from 'frontend/components/icons-new/GuestsFilled';
import IconSuitcase from 'frontend/components/icons-new/HoldBagFilled';
import SvgLuggageBackpackFilled from 'frontend/components/icons-new/LuggageBackpackFilled';
import BoardTypeIcon from 'frontend/components/renderings/BoardTypes/components/BoardTypeIcon/BoardTypeIcon';
import { IExportHolidayQuoteFields } from 'frontend/components/renderings/ExportHolidayDetails/ExportHolidayDetails';

import FlightsInfo from './components/FlightsInfo/FlightsInfo';
import HotelInfo from './components/HotelInfo/HotelInfo';
import TransferInfo from './components/TransferInfo/TransferInfo';

import styles from './BookingDetailsQuote.module.scss';

export interface IBookingDetailsQuoteProps {
    board: Nullable<IBoardType>;
    fields: IExportHolidayQuoteFields;
    guestsAmountByType: IGuestsAmount;
    hotel: Nullable<IHotel>;
    isShown: boolean;
    luggageItems: ILuggageInfoItem[];
    rooms: IRoomType[];
    transfer: Nullable<ITransfer>;
    transport: Nullable<ITransport>;
    lateRoomCheckout?: Nullable<ILateRoomCheckout>;
}

const SafeHotelInfo = (props: any) => (HotelInfo(props) as JSX.Element) || null;

const BookingDetailsQuote = ({
    transfer,
    transport,
    rooms,
    hotel,
    board,
    guestsAmountByType,
    luggageItems,
    fields,
}: IBookingDetailsQuoteProps) => {
    const { getPhrase, sportEquipmentCategoryCodes, holdLuggageCategoryCodes, LCBCount, passengersByQueue } = useStore(
        (stores: TStores) => ({
            getPhrase: stores.layoutStore.getPhrase,
            sportEquipmentCategoryCodes: stores.layoutStore.sportEquipmentCategoryCodes,
            holdLuggageCategoryCodes: stores.layoutStore.holdLuggageCategoryCodes,
            LCBCount: stores.bookingStore.extraLuggage.LCBCount,
            passengersByQueue: stores.flightsPassengersStore.passengersByQueue,
        }),
    );

    const departureRoute = transport ? transport.routes[0] : null;
    const arrivalRoute = transport ? transport.routes[1] : null;

    const { inboundSeats, outboundSeats } = extractPassengerSeats(passengersByQueue);

    const departureRouteInfo = departureRoute
        ? {
              route: departureRoute,
              flag: DestinationRouteFlag.Departure,
              seatSelection: outboundSeats,
              seatSummaryText: fields.SeatsSelectedLabel?.value,
          }
        : null;
    const arrivalRouteInfo = arrivalRoute
        ? {
              route: arrivalRoute,
              flag: DestinationRouteFlag.Arrival,
              seatSelection: inboundSeats,
              seatSummaryText: fields.SeatsSelectedLabel?.value,
          }
        : null;

    const guestsByCategoryText = getNumberOfGuestsByCategory(
        getPhrase,
        guestsAmountByType.adults,
        guestsAmountByType.children,
        guestsAmountByType.infants,
    );

    const extraLuggageFullInfo = generateExtraLuggageFullInfo(
        luggageItems,
        sportEquipmentCategoryCodes,
        holdLuggageCategoryCodes,
    );
    const defaultBagsOneDirection = getDefaultBagsOneDirection(luggageItems);

    return (
        <div className={styles.gridContainer}>
            <div className={classNames(styles.column, styles.columnBorder)}>
                <div className={styles.item}>
                    <SafeHotelInfo hotel={hotel} rooms={rooms} isPrintPreview />
                </div>
                {board && (
                    <div className={styles.item}>
                        <div className={styles.container}>
                            <BoardTypeIcon iconUrl={board.iconUrl} className={styles.icon} />
                            <div className={styles.contentContainer}>
                                <Text tag='div' field={fields.BoardLabel} className={styles.title} />
                                {board.title && <div className={styles.smallText}>{board.title}</div>}
                            </div>
                        </div>
                    </div>
                )}
                <div className={styles.item}>
                    <div className={styles.container}>
                        <div className={styles.iconContainer}>
                            <SvgGuestsFilled className={styles.icon} />
                        </div>
                        <div className={styles.contentContainer}>
                            <Text tag='div' field={fields.GuestsLabel} className={styles.title} />
                            <div className={styles.smallText}>{guestsByCategoryText}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div className={classNames(styles.column, styles.columnBorder)}>
                <div className={classNames(styles.item, styles.itemRowToColumn)}>
                    <FlightsInfo
                        arrivalRouteInfo={arrivalRouteInfo}
                        departureRouteInfo={departureRouteInfo}
                        isPrintPreview
                    />
                </div>
                <div className={styles.item}>
                    {transfer && <TransferInfo transfer={transfer} textClassName={styles.smallText} />}
                </div>
            </div>
            <div className={classNames(styles.column)}>
                <div className={styles.item}>
                    <div className={styles.container}>
                        <div className={styles.iconContainer}>
                            <SvgLuggageBackpackFilled className={styles.icon} />
                        </div>
                        <div>
                            <Text tag='div' field={fields.CabinBagsLabel} className={styles.title} />
                            <div className={styles.text}>
                                <CabinBagsInfo
                                    fields={fields}
                                    guestsAmountByType={guestsAmountByType}
                                    LCBCount={LCBCount}
                                    containerClassName={styles.cabinBagsWrapper}
                                    bagTypeClassName={styles.bagType}
                                    iconClassName={styles.cabinIcon}
                                    hideIcon={true}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className={styles.item}>
                    <div className={styles.container}>
                        <div className={styles.iconContainer}>
                            <IconSuitcase className={styles.icon} />
                        </div>
                        <div>
                            <Text tag='div' field={fields.LuggageInfoTitle} className={styles.title} />
                            <div className={styles.text}>
                                <LuggageInfo
                                    fields={fields}
                                    infantsNumber={guestsAmountByType.infants}
                                    extraLuggageFullInfo={extraLuggageFullInfo}
                                    defaultBagsOneDirection={defaultBagsOneDirection}
                                    hideTitle={true}
                                    guestWithHoldLuggage={guestsAmountByType.adults + guestsAmountByType.children}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default observer(BookingDetailsQuote);
