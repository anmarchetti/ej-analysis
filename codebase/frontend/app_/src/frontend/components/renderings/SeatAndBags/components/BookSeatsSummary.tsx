import { useMemo } from 'react';
import { observer } from 'mobx-react';

import { ICurrencyFormatOptions } from 'code/currency';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { isTradeStore } from 'frontend/store/tradePortal';
import { getCheapestSeats, getSeatsPriceInfo } from 'frontend/utils/seatAndBags.utils';
import { IPassengerFlights } from 'models/data/AncillariesInfo';
import { IPassengerSeat } from 'models/data/ISeatMapStore';
import { ISeatsAndBagsFields } from 'models/data/ISeatsAndBagsFields';
import { SeatType } from 'models/enum/SeatType';
import Button from 'frontend/components/common/Button';

interface IBookSeatsSummaryProps {
    isPostBookingFlow: boolean;
    passengers: IPassengerFlights[];
    fields?: ISeatsAndBagsFields;
    handleBookSeatsClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    showCta?: boolean;
}

const getSeatsInfo = (
    passengers: IPassengerFlights[],
    cheapestData: {
        cheapestExtraLegRoomPrice?: number | undefined;
        cheapestSeatPrice?: number | undefined;
    },
    selectedSeats: IPassengerSeat[],
) => {
    const extraLegRoomSeats = selectedSeats.filter(s => s.priceBand === SeatType.ExtraLegroom);
    const isExtraLegRoomAvailable = cheapestData.cheapestExtraLegRoomPrice !== undefined;

    return {
        areAllPassengersSeated: selectedSeats.length === passengers.length,
        canUpgradeSeats: isExtraLegRoomAvailable && extraLegRoomSeats.length < passengers.length,
        cheapestPrice: cheapestData.cheapestSeatPrice ?? Infinity,
        cheapestExtraLegRoomPrice: cheapestData.cheapestExtraLegRoomPrice ?? Infinity,
    };
};

export const BookSeatsSummary = ({
    fields,
    handleBookSeatsClick,
    passengers,
    isPostBookingFlow,
}: IBookSeatsSummaryProps) => {
    const {
        haveOutboundSelectedSeats,
        haveInboundSelectedSeats,
        rowsDeparture,
        rowsReturn,
        isPriceVisible,
        hideActionButton,
        currency,
        formatMoney,
    } = useStore((stores: TStores) => ({
        rowsDeparture: stores.seatMapStore.rowsDeparture,
        rowsReturn: stores.seatMapStore.rowsReturn,
        haveOutboundSelectedSeats: stores.seatMapStore.haveOutboundSelectedSeats,
        haveInboundSelectedSeats: stores.seatMapStore.haveInboundSelectedSeats,
        hideActionButton: (stores as IHolidaysStores).viewBookingStore.hasBookingAtcomError,
        /**
         * 1. Visible at any page on Holidays
         * 2. On TradePortal on Extras page visibility depends on isPricesHidden
         * 3. On TradePortal not on Extras page prices are visible
         */
        isPriceVisible: !isTradeStore(stores) || !stores.layoutStore.isExtrasPage || !stores.layoutStore.isPricesHidden,
        currency: stores.seatMapStore.currency,
        formatMoney: stores.marketStore.formatMoney,
    }));

    const outboundSeatsInfo = useMemo(() => {
        const selectedSeats = passengers
            .filter(pax => !!pax.outboundPassenger.seat?.seatNumber)
            .map(pax => pax.outboundPassenger.seat) as IPassengerSeat[];

        const cheapestData = getCheapestSeats(
            rowsDeparture,
            selectedSeats.map(s => s.seatNumber),
        );

        return getSeatsInfo(passengers, cheapestData, selectedSeats);
    }, [passengers, rowsDeparture]);

    const inboundSeatsInfo = useMemo(() => {
        const selectedSeats = passengers
            .filter(pax => !!pax.inboundPassenger.seat?.seatNumber)
            .map(pax => pax.inboundPassenger.seat) as IPassengerSeat[];

        const cheapestData = getCheapestSeats(
            rowsReturn,
            selectedSeats.map(s => s.seatNumber),
        );

        return getSeatsInfo(passengers, cheapestData, selectedSeats);
    }, [passengers, rowsReturn]);

    if (!fields) {
        return null;
    }

    const { BtnBookSeats, BtnOutboundSeats, BtnReturnSeats, BtnChangeSeats, SeatDescription, LegRoomDescription } =
        fields;

    const currencyOptions: ICurrencyFormatOptions = { currency, minimumFractionDigits: 2 };

    const cheapestSeatsPriceLabel = getSeatsPriceInfo(
        SeatDescription?.value,
        formatMoney(Math.min(outboundSeatsInfo.cheapestPrice, inboundSeatsInfo.cheapestPrice), currencyOptions),
    );
    const cheapestExtraLegRoomPriceLabel = getSeatsPriceInfo(
        LegRoomDescription?.value,
        formatMoney(
            Math.min(outboundSeatsInfo.cheapestExtraLegRoomPrice, inboundSeatsInfo.cheapestExtraLegRoomPrice),
            currencyOptions,
        ),
    );

    let buttonText = BtnBookSeats?.value;

    if (haveOutboundSelectedSeats && haveInboundSelectedSeats) {
        buttonText = BtnChangeSeats?.value;
    } else if (haveOutboundSelectedSeats && !haveInboundSelectedSeats) {
        buttonText = BtnReturnSeats?.value;
    } else if (!haveOutboundSelectedSeats && haveInboundSelectedSeats) {
        buttonText = BtnOutboundSeats?.value;
    }

    const allPassengersAreSeated = outboundSeatsInfo.areAllPassengersSeated && inboundSeatsInfo.areAllPassengersSeated;
    const canUpgradeSeats = outboundSeatsInfo.canUpgradeSeats || inboundSeatsInfo.canUpgradeSeats;

    return (
        <div className='flights-summary no-print'>
            {isPriceVisible && (
                <div className='flights-summary__info' data-tid='flights-summary-info'>
                    {!!cheapestSeatsPriceLabel && !allPassengersAreSeated && (
                        <p
                            data-cs-mask
                            className='flights-summary__paragraph'
                            data-tid='cheapest-seats-price'
                            dangerouslySetInnerHTML={{ __html: cheapestSeatsPriceLabel.toString() }}
                        />
                    )}
                    {!!cheapestExtraLegRoomPriceLabel && canUpgradeSeats && (
                        <p
                            data-cs-mask
                            className='flights-summary__paragraph'
                            data-tid='cheapest-extra-leg-room-price'
                            dangerouslySetInnerHTML={{ __html: cheapestExtraLegRoomPriceLabel.toString() }}
                        />
                    )}
                </div>
            )}
            {!!handleBookSeatsClick && !hideActionButton && (
                <Button
                    isSmall
                    isOutlined={(haveOutboundSelectedSeats && haveInboundSelectedSeats) || isPostBookingFlow}
                    className='flights-summary__btn'
                    onClick={handleBookSeatsClick}
                >
                    <span>{buttonText}</span>
                </Button>
            )}
        </div>
    );
};

export default observer(BookSeatsSummary);
