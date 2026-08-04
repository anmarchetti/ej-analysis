import React, { FC, useMemo } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IBoardType } from 'models/data/IHotel';
import { IOfferWithoutAltBoards } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { TransferType } from 'models/enum/transfer/TransferType';
import Button from 'frontend/components/common/Button';
import { Popup } from 'frontend/components/common/Popup';
import StartBookingButton from 'frontend/components/common/StartBookingButton';
import SvgCross from 'frontend/components/icons-new/Cross';
import IconSuitcase from 'frontend/components/icons-new/HoldBagFilled';
import IconBed from 'frontend/components/icons-new/HotelBedFilled';
import SvgProtection from 'frontend/components/icons-new/Protection';
import SvgTaxiFilled from 'frontend/components/icons-new/TaxiFilled';
import SvgTransferFilled from 'frontend/components/icons-new/TransferFilled';
import BasketPriceCell from 'frontend/components/renderings/Basket/components/BasketPriceCell';
import BoardTypeIcon from 'frontend/components/renderings/BoardTypes/components/BoardTypeIcon/BoardTypeIcon';

import Flight from './Flight';
import { countRoomsByTitle } from './utils';

import styles from './BasketPopup.module.scss';

export interface IBasketPopupProps {
    board: Nullable<IBoardType>;
    className: string;
    isNextButtonVisible: boolean;
    isPricePPShown: boolean;
    offer: IOfferWithoutAltBoards;
    onClosePopup: () => void;
}

export const BasketPopup: FC<IBasketPopupProps> = ({
    board,
    offer,
    onClosePopup,
    className,
    isNextButtonVisible,
    isPricePPShown,
}) => {
    const {
        getPhrase,
        haveSelectedSeats,
        outboundFlight,
        inboundFlight,
        whoValue,
        totalGuestsQuantity,
        outboundPassengers,
        inboundPassengers,
        transfer,
        isATOLProtectionEnabled,
    } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        outboundPassengers: stores.flightsPassengersStore.outBoundPassengers,
        inboundPassengers: stores.flightsPassengersStore.inBoundPassengers,
        haveSelectedSeats: stores.seatMapStore.haveSelectedSeats,
        outboundFlight: stores.bookingStore.outboundFlight,
        inboundFlight: stores.bookingStore.inboundFlight,
        whoValue: stores.bookingStore.whoValueOnlyGuests,
        totalGuestsQuantity: stores.bookingStore.totalGuestsQuantity,
        transfer: stores.bookingStore.transfer,
        isATOLProtectionEnabled: stores.layoutStore.isATOLProtectionEnabled,
    }));

    const { hotel, lateRoomCheckout } = offer;

    const areFlightsExternal = outboundFlight?.isExt && inboundFlight?.isExt;

    const nightsLabel = useMemo(
        () =>
            Tokenizer.replaceToken(
                getPhrase(
                    offer.stay > 1
                        ? SitecoreDictionary.GlobalsLabelsNightsStayPlural
                        : SitecoreDictionary.GlobalsLabelsNightStaySingular,
                ),
                Tokens.Number,
                `${offer.stay}`,
            ),
        // exclude: getPhrase
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [offer.stay],
    );

    const stakedRooms = useMemo(() => {
        const rooms = offer.accom.unit.slice();

        return countRoomsByTitle(rooms);
    }, [offer]);

    return (
        <Popup
            onClose={onClosePopup}
            showCloseButton={false}
            footerContent={
                <React.Fragment>
                    <BasketPriceCell
                        offer={offer}
                        className={className}
                        isNextButtonVisible={isNextButtonVisible}
                        isPricePPShown={isPricePPShown}
                        isABTestingComponent
                    />
                    {isNextButtonVisible && (
                        <div className='diagonal-cell--btn'>
                            <StartBookingButton
                                render={onClick => (
                                    <Button id='book-button-basket' isMd onClick={onClick} className='continue-button'>
                                        {getPhrase(SitecoreDictionary.GlobalsButtonsContinue)}
                                    </Button>
                                )}
                            />
                        </div>
                    )}
                </React.Fragment>
            }
            containerClass='basket-popup'
        >
            <div className={classNames(styles.wrapper)}>
                <Button
                    isText
                    className={classNames(styles.closePopupButton)}
                    onClick={onClosePopup}
                    dataTid='close-basket-popup-button'
                >
                    <SvgCross />
                    {getPhrase(SitecoreDictionary.GlobalsLabelsShowLessDetails)}
                </Button>

                <div className={classNames(styles.list)}>
                    <div className={styles.item}>
                        <div className={styles.point}>
                            <IconBed />

                            <div className={styles.pointHead} data-tid='hotel-name'>
                                {hotel?.name}
                            </div>

                            <span data-tid='location'>
                                {[hotel?.resort?.name, hotel?.country?.name].filter(Boolean).join(', ')}
                            </span>

                            <div data-tid='nights'>{nightsLabel}</div>
                        </div>

                        {!!board && !!(board.title || board.content) && (
                            <div className={styles.point}>
                                <BoardTypeIcon iconUrl={board.iconUrl} className={styles.icon} />

                                {board.title && (
                                    <div className={styles.pointHead} data-tid='board-title'>
                                        {board.title}
                                    </div>
                                )}

                                {stakedRooms.map(([roomTitle, count]) => (
                                    <div key={roomTitle}>{count > 1 ? `${count} x ${roomTitle}` : roomTitle}</div>
                                ))}

                                <div>{whoValue}</div>
                            </div>
                        )}
                    </div>
                    <div className={styles.item}>
                        {!!outboundFlight && (
                            <Flight
                                flight={outboundFlight}
                                passengers={outboundPassengers}
                                areFlightsExternal={areFlightsExternal}
                                haveSelectedSeats={haveSelectedSeats}
                            />
                        )}
                        {!!inboundFlight && (
                            <Flight
                                flight={inboundFlight}
                                passengers={inboundPassengers}
                                areFlightsExternal={areFlightsExternal}
                                haveSelectedSeats={haveSelectedSeats}
                            />
                        )}
                    </div>
                    <div className={styles.item}>
                        <div className={styles.point}>
                            <IconSuitcase />
                            <div>
                                <span className={styles.pointHead} data-tid='hold-luggage'>
                                    {getPhrase(SitecoreDictionary.BagsAndLuggage)}
                                </span>
                                <br />
                                <span>
                                    {`${totalGuestsQuantity} x ${getPhrase(
                                        totalGuestsQuantity > 1
                                            ? SitecoreDictionary.PaymentLabelsLUG23HoldBagsPlural
                                            : SitecoreDictionary.PaymentLabelsLUG23HoldBagSingular,
                                    )}`}
                                </span>
                            </div>
                        </div>

                        {transfer && transfer.type !== TransferType.NoTransfer && (
                            <div className={styles.point}>
                                {transfer.type === TransferType.Shared && <SvgTransferFilled />}
                                {transfer.type === TransferType.Private && <SvgTaxiFilled />}

                                <div className={styles.pointHead} data-tid='transfer-name'>
                                    {transfer.name} {getPhrase(SitecoreDictionary.LuggageButtonsIncluded)}
                                </div>

                                <span>
                                    {`${totalGuestsQuantity} x ${getPhrase(
                                        totalGuestsQuantity > 1
                                            ? SitecoreDictionary.StandardSeatsIncluded
                                            : SitecoreDictionary.StandardSeatIncluded,
                                    )}`}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className={styles.item}>
                        {lateRoomCheckout && (
                            <div className={styles.point}>
                                <IconBed />
                                <div className={styles.pointHead} data-tid='late-room-checkout'>
                                    {getPhrase(SitecoreDictionary.PriceSummaryLabelsLateCheckout)}
                                </div>
                                <div>{getPhrase(SitecoreDictionary.PaymentLabelsLateCheckoutIncluded)}</div>
                            </div>
                        )}

                        {isATOLProtectionEnabled && (
                            <div className={styles.point}>
                                <SvgProtection />
                                <div className={styles.pointHead}>
                                    {getPhrase(SitecoreDictionary.HotelDetailsLabelsAtolProtected)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Popup>
    );
};

export default observer(BasketPopup);
