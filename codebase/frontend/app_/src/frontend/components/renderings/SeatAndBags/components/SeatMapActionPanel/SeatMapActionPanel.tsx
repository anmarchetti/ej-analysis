import React, { FC, useMemo, useRef } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { ICurrencyFormatOptions } from 'code/currency';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { isTradeStore } from 'frontend/store/tradePortal';
import { getCheapestSeats, getSeatsPriceInfo } from 'frontend/utils/seatAndBags.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IUrgencyMessageStored } from 'frontend/utils/urgencyMessage.utils';
import { setWebStorageItem } from 'frontend/utils/webStorage.utils';
import { IPassengerFlights } from 'models/data/AncillariesInfo';
import { IPassengerSeat } from 'models/data/ISeatMapStore';
import { ISeatsAndBagsFields } from 'models/data/ISeatsAndBagsFields';
import { SeatType } from 'models/enum/SeatType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';
import Button from 'frontend/components/common/Button';
import UrgencyMessage from 'frontend/components/common/UrgencyMessage/UrgencyMessage';

import styles from './SeatMapActionPanel.module.scss';

export interface ISeatMapActionPanelProps {
    fields: ISeatsAndBagsFields;
    passengers: IPassengerFlights[];
    handleBookSeatsClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

type TSeatsInfo = {
    areAllPassengersSeated: boolean;
    canUpgradeSeats: boolean;
    cheapestExtraLegRoomPrice: number;
    cheapestPrice: number;
};

export const SeatMapActionPanel: FC<ISeatMapActionPanelProps> = ({ fields, passengers, handleBookSeatsClick }) => {
    const {
        formatMoney,
        booking,
        rowsDeparture,
        rowsReturn,
        currency,
        haveOutboundSelectedSeats,
        haveInboundSelectedSeats,
        isPricesHidden,
        isViewBookingPage,
        getPhrase,
        availableDepartureSeats,
        availableReturnSeats,
        isLuxuryPackage,
        isAllSelectedSeatsPremium,
        haveSelectedSeats,
        isSeatDataLoaded = false,
        trackUrgencyMessageTileImpression,
    } = useStore((stores: TStores) => ({
        booking: stores.viewBookingStore.booking,
        formatMoney: stores.marketStore.formatMoney,
        rowsDeparture: stores.seatMapStore.rowsDeparture,
        rowsReturn: stores.seatMapStore.rowsReturn,
        currency: stores.seatMapStore.currency,
        haveOutboundSelectedSeats: stores.seatMapStore.haveOutboundSelectedSeats,
        haveSelectedSeats: stores.seatMapStore.haveSelectedSeats,
        haveInboundSelectedSeats: stores.seatMapStore.haveInboundSelectedSeats,
        isPricesHidden: isTradeStore(stores) && stores.layoutStore.isPricesHidden,
        isViewBookingPage: stores.layoutStore.isViewBookingPage,
        getPhrase: stores.layoutStore.getPhrase,
        availableDepartureSeats: stores.seatMapStore.availableDepartureSeats,
        availableReturnSeats: stores.seatMapStore.availableReturnSeats,
        isLuxuryPackage: stores.bookingStore.isLuxuryPackage || stores.viewBookingStore.isLuxuryPackage,
        isAllSelectedSeatsPremium: stores.seatMapStore.isAllSelectedSeatsPremium,
        isSeatDataLoaded: stores.seatMapStore.isSeatDataLoaded,
        trackUrgencyMessageTileImpression: stores.trackingStore.trackUrgencyMessageTileImpression,
    }));

    const {
        BtnBookSeats,
        BtnChangeSeats,
        BtnOutboundSeats,
        BtnReturnSeats,
        SeatDescription,
        LegRoomDescription,
        UrgencyMessageSeatsThreshold,
        UrgencyMessageText,
        UrgencyMessageTooltipText,
        SeatDescriptionLux,
        itemUrgencyMessageText,
    } = fields;
    const getSeatsInfo = (
        passengers: IPassengerFlights[],
        cheapestData: {
            cheapestExtraLegRoomPrice?: number | undefined;
            cheapestSeatPrice?: number | undefined;
        },
        selectedSeats: IPassengerSeat[],
    ): TSeatsInfo => {
        const extraLegRoomSeats = selectedSeats.filter(s => s.priceBand === SeatType.ExtraLegroom);
        const isExtraLegRoomAvailable = cheapestData.cheapestExtraLegRoomPrice !== undefined;

        return {
            areAllPassengersSeated: selectedSeats.length === passengers.length,
            canUpgradeSeats: isExtraLegRoomAvailable && extraLegRoomSeats.length < passengers.length,
            cheapestPrice: cheapestData.cheapestSeatPrice ?? Infinity,
            cheapestExtraLegRoomPrice: cheapestData.cheapestExtraLegRoomPrice ?? Infinity,
        };
    };

    const outboundSeatsInfo = useMemo(() => {
        const selectedSeats = passengers
            .filter(passenger => !!passenger.outboundPassenger.seat?.seatNumber)
            .map(passenger => passenger.outboundPassenger.seat) as IPassengerSeat[];

        const cheapestData = getCheapestSeats(
            rowsDeparture,
            selectedSeats.map(s => s.seatNumber),
        );

        return getSeatsInfo(passengers, cheapestData, selectedSeats);
    }, [passengers, rowsDeparture]);

    const inboundSeatsInfo = useMemo(() => {
        const selectedSeats = passengers
            .filter(passenger => !!passenger.inboundPassenger.seat?.seatNumber)
            .map(passenger => passenger.inboundPassenger.seat) as IPassengerSeat[];

        const cheapestData = getCheapestSeats(
            rowsReturn,
            selectedSeats.map(s => s.seatNumber),
        );

        return getSeatsInfo(passengers, cheapestData, selectedSeats);
    }, [passengers, rowsReturn]);

    const currencyOptions: ICurrencyFormatOptions = {
        currency: booking?.currency?.code || currency,
        minimumFractionDigits: 2,
    };

    const seatDescription = isLuxuryPackage ? SeatDescriptionLux : SeatDescription;
    const cheapestSeatsPriceLabel = getSeatsPriceInfo(
        seatDescription?.value,
        formatMoney(Math.min(outboundSeatsInfo.cheapestPrice, inboundSeatsInfo.cheapestPrice), currencyOptions),
    );

    const cheapestExtraLegRoomPriceLabel = getSeatsPriceInfo(
        LegRoomDescription?.value,
        formatMoney(
            Math.min(outboundSeatsInfo.cheapestExtraLegRoomPrice, inboundSeatsInfo.cheapestExtraLegRoomPrice),
            currencyOptions,
        ),
    );

    const urgencyMessageTracked = useRef(false);

    const allPassengersAreSeated = outboundSeatsInfo.areAllPassengersSeated && inboundSeatsInfo.areAllPassengersSeated;
    const canUpgradeSeats = outboundSeatsInfo.canUpgradeSeats || inboundSeatsInfo.canUpgradeSeats;
    const getButtonText = (): string => {
        if (haveOutboundSelectedSeats && haveInboundSelectedSeats) {
            return BtnChangeSeats?.value;
        }

        if (haveOutboundSelectedSeats && !haveInboundSelectedSeats) {
            return BtnReturnSeats?.value;
        }

        if (!haveOutboundSelectedSeats && haveInboundSelectedSeats) {
            return BtnOutboundSeats?.value;
        }

        return BtnBookSeats?.value;
    };

    const buttonText = getButtonText();

    const shouldShowSeatPrice = !isPricesHidden && !!cheapestSeatsPriceLabel && !allPassengersAreSeated;
    const shouldShowViewBookingLuxSeatPrice =
        isAllSelectedSeatsPremium || !haveSelectedSeats || !haveOutboundSelectedSeats || !haveInboundSelectedSeats;

    const shouldShowPrice =
        isViewBookingPage && isLuxuryPackage ? shouldShowViewBookingLuxSeatPrice : shouldShowSeatPrice;

    const shouldShowExtraLegRoomPrice = !isPricesHidden && !!cheapestExtraLegRoomPriceLabel && canUpgradeSeats;

    const { urgencyMessageTextFormatted, itemUrgencyMessageTextFormatted, urgencyMessageTooltipTextFormatted } =
        useMemo(() => {
            if (!isSeatDataLoaded) {
                return {
                    urgencyMessageTextFormatted: undefined,
                    itemUrgencyMessageTextFormatted: undefined,
                    urgencyMessageTooltipTextFormatted: undefined,
                };
            }

            const isDepartureSeats = availableDepartureSeats <= availableReturnSeats;
            const minAvailableSeats = isDepartureSeats ? availableDepartureSeats : availableReturnSeats;
            let urgencyMessageTextFormatted: string | undefined;
            let itemUrgencyMessageTextFormatted: string | undefined;
            let urgencyMessageTooltipTextFormatted: string | undefined;

            const formatUrgencyMessageTooltipText = (text: string, isDepartureSeats: boolean): string =>
                Tokenizer.replaceToken(
                    text,
                    Tokens.FlightDirection,
                    getPhrase(
                        isDepartureSeats
                            ? SitecoreDictionary.GlobalsLabelsDeparture
                            : SitecoreDictionary.GlobalsLabelsReturn,
                    ),
                );

            const formatUrgencyMessageText = (text: string, availableSeats: number): string =>
                Tokenizer.replaceToken(text, Tokens.Avail, availableSeats.toString());

            if (minAvailableSeats <= UrgencyMessageSeatsThreshold?.value) {
                urgencyMessageTextFormatted = formatUrgencyMessageText(UrgencyMessageText?.value, minAvailableSeats);
                itemUrgencyMessageTextFormatted = formatUrgencyMessageText(
                    itemUrgencyMessageText?.value,
                    minAvailableSeats,
                );
                urgencyMessageTooltipTextFormatted = formatUrgencyMessageTooltipText(
                    UrgencyMessageTooltipText?.value,
                    isDepartureSeats,
                );
            }

            return {
                urgencyMessageTextFormatted,
                itemUrgencyMessageTextFormatted,
                urgencyMessageTooltipTextFormatted,
            };
        }, [isSeatDataLoaded]);

    const shouldShowUrgencyMessage =
        urgencyMessageTextFormatted && !haveInboundSelectedSeats && !haveOutboundSelectedSeats;

    if (isSeatDataLoaded) {
        const urgencyMessageData: IUrgencyMessageStored = {
            urgencyMessageText: itemUrgencyMessageTextFormatted ?? '',
            hasUrgencyMessage: !!itemUrgencyMessageTextFormatted,
        };
        setWebStorageItem(WebStorageKeys.SeatUrgencyMessageText, urgencyMessageData, sessionStorage);
    }

    if (isViewBookingPage && shouldShowUrgencyMessage && !urgencyMessageTracked.current) {
        trackUrgencyMessageTileImpression(itemUrgencyMessageTextFormatted!);
        urgencyMessageTracked.current = true;
    }

    return (
        <div className={classNames(shouldShowUrgencyMessage && styles.flexColumn, styles.wrapper)}>
            {shouldShowUrgencyMessage && (
                <div className={styles.urgencyMessageWrapper}>
                    <UrgencyMessage
                        message={urgencyMessageTextFormatted}
                        tooltip={urgencyMessageTooltipTextFormatted}
                        className={styles.urgencyMessage}
                    />
                </div>
            )}
            <div className={classNames(styles.wrapper, 'd-print-none')} data-tid='action-panel-wrapper'>
                {shouldShowPrice && (
                    <div
                        data-cs-mask
                        className={classNames(styles.seatDescription, {
                            [styles.altSeatDescription]: isViewBookingPage,
                        })}
                        data-tid='cheapest-seats-price'
                        dangerouslySetInnerHTML={{ __html: cheapestSeatsPriceLabel || '' }}
                    />
                )}
                {(shouldShowExtraLegRoomPrice || isViewBookingPage) && (
                    <div
                        data-cs-mask
                        className={classNames(styles.legRoomDescription)}
                        data-tid='cheapest-extra-leg-room-price'
                        dangerouslySetInnerHTML={{ __html: cheapestExtraLegRoomPriceLabel || '' }}
                    />
                )}
                <div className={styles.buttonContainer}>
                    <Button
                        className={classNames(styles.button, isViewBookingPage && styles.altButton)}
                        onClick={handleBookSeatsClick}
                        data-tid='action-panel-button'
                        isOutlined={haveOutboundSelectedSeats && haveInboundSelectedSeats}
                    >
                        <div
                            className={classNames(styles.buttonText, isViewBookingPage && styles.altButtonText)}
                            data-tid='action-panel-button-text'
                        >
                            {buttonText}
                        </div>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default observer(SeatMapActionPanel);
