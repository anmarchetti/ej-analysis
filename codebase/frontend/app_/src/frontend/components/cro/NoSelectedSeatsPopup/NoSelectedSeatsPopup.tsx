import React, { useMemo } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { ICurrencyFormatOptions } from 'code/currency';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getCheapestSeats, getSeatsPriceInfo } from 'frontend/utils/seatAndBags.utils';
import { IPassengerSeat } from 'models/data/ISeatMapStore';
import Button from 'frontend/components/common/Button';
import { Popup } from 'frontend/components/common/Popup';

import SvgNoSelectedSeatsPopup from './components/SvgNoSelectedSeatsPopup';

import styles from './NoSelectedSeatsPopup.module.scss';

export interface INoSelectedSeatsPopupProps {
    continueBookingFunnel: () => void;
    onClose: () => void;
}

export const experimentFields = {
    Title: {
        value: 'Don’t forget to book your seats!',
    },
    Description: {
        value: 'If you don’t book your seats, we will automatically allocate them at check-in. Book your seats today to get the best seat availability, the best prices and the option to avoid the middle seat.',
    },
    SeatDescription: {
        value: 'Seats from <strong>{seatPrice}pp</strong>',
    },
    LegRoomDescription: {
        value: 'Extra legroom for just <strong>{seatPrice}pp</strong>',
    },
    BookSeats: { value: 'Book seats' },
    ContinueWithoutSeats: { value: 'Continue without seats' },
};

const NoSelectedSeatsPopup = ({ onClose, continueBookingFunnel }: INoSelectedSeatsPopupProps) => {
    const { setSeatMapOpened, rowsReturn, rowsDeparture, formatMoney, currency, passengersByQueue } = useStore(
        (stores: TStores) => ({
            formatMoney: stores.marketStore.formatMoney,
            setSeatMapOpened: stores.seatMapStore.setSeatMapOpened,
            rowsDeparture: stores.seatMapStore.rowsDeparture,
            rowsReturn: stores.seatMapStore.rowsReturn,
            currency: stores.seatMapStore.currency,
            passengersByQueue: stores.flightsPassengersStore.passengersByQueue,
        }),
    );

    const openSeatMap = () => {
        onClose();
        setSeatMapOpened(true);
    };

    const continueBooking = () => {
        onClose();
        continueBookingFunnel();
    };

    const { Title, Description, BookSeats, ContinueWithoutSeats, LegRoomDescription, SeatDescription } =
        experimentFields;

    const currencyOptions: ICurrencyFormatOptions = { currency, minimumFractionDigits: 2 };

    const outboundSeatsInfo = useMemo(() => {
        const selectedSeats = passengersByQueue
            .filter(pax => !!pax.outboundPassenger.seat?.seatNumber)
            .map(pax => pax.outboundPassenger.seat) as IPassengerSeat[];

        const cheapestData = getCheapestSeats(
            rowsDeparture,
            selectedSeats.map(s => s.seatNumber),
        );

        return {
            cheapestSeatPrice: cheapestData.cheapestSeatPrice || 0,
            cheapestExtraLegRoomPrice: cheapestData.cheapestExtraLegRoomPrice || 0,
        };
    }, [passengersByQueue, rowsDeparture]);

    const inboundSeatsInfo = useMemo(() => {
        const selectedSeats = passengersByQueue
            .filter(pax => !!pax.inboundPassenger.seat?.seatNumber)
            .map(pax => pax.inboundPassenger.seat) as IPassengerSeat[];

        const cheapestData = getCheapestSeats(
            rowsReturn,
            selectedSeats.map(s => s.seatNumber),
        );

        return {
            cheapestSeatPrice: cheapestData.cheapestSeatPrice || 0,
            cheapestExtraLegRoomPrice: cheapestData.cheapestExtraLegRoomPrice || 0,
        };
    }, [passengersByQueue, rowsReturn]);

    const cheapestSeatsPriceLabel = getSeatsPriceInfo(
        SeatDescription?.value,
        formatMoney(Math.min(outboundSeatsInfo.cheapestSeatPrice, inboundSeatsInfo.cheapestSeatPrice), currencyOptions),
    );

    const cheapestExtraLegRoomPriceLabel = getSeatsPriceInfo(
        LegRoomDescription?.value,
        formatMoney(
            Math.min(outboundSeatsInfo.cheapestExtraLegRoomPrice, inboundSeatsInfo.cheapestExtraLegRoomPrice),
            currencyOptions,
        ),
    );

    return (
        <Popup containerClass={styles.popup} aria-label={Title.value} onClose={onClose}>
            <div className={classNames(styles.header, styles.bottomSeparator)}>
                <SvgNoSelectedSeatsPopup />
            </div>
            <div className={classNames(styles.content, styles.bottomSeparator)}>
                <div className={styles.title} data-tid='no-selected-seats-title'>
                    <Text field={Title} tag='span' />
                </div>
                <div className={styles.text}>
                    <Text field={Description} tag='span' />
                </div>
            </div>
            <div className={styles.content} data-tid='no-selected-seats-content'>
                {!!cheapestSeatsPriceLabel && (
                    <div
                        className={styles.contentText}
                        data-tid='cheapest-seats-price'
                        dangerouslySetInnerHTML={{ __html: cheapestSeatsPriceLabel.toString() }}
                    />
                )}
                {!!cheapestExtraLegRoomPriceLabel && (
                    <div
                        data-cs-mask
                        className={styles.contentExtraText}
                        data-tid='cheapest-extra-leg-room-price'
                        dangerouslySetInnerHTML={{ __html: cheapestExtraLegRoomPriceLabel.toString() }}
                    />
                )}
            </div>
            <Button
                onClick={openSeatMap}
                className={classNames(styles.button)}
                data-tid='no-selected-seats-book-seats-button'
            >
                <Text field={BookSeats} tag='span' />
            </Button>
            <Button
                onClick={continueBooking}
                className={classNames(styles.button, 'btn--outlined')}
                data-tid='no-selected-seats-continue-booking-button'
            >
                <Text field={ContinueWithoutSeats} tag='span' />
            </Button>
        </Popup>
    );
};

export default observer(NoSelectedSeatsPopup);
